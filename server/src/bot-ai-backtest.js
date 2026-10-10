import {baseDecision,buildAssetFeatures,detectRegime,forecast,pickAsset,portfolioRisk} from "./bot-ai-engine.js";

const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
const finite=(v,fallback=0)=>Number.isFinite(Number(v))?Number(v):fallback;
const mean=a=>a.length?a.reduce((s,v)=>s+v,0)/a.length:0;
const std=a=>a.length>1?Math.sqrt(mean(a.map(v=>(v-mean(a))**2))):0;

function normalize(points){
  return (points||[])
    .map(p=>({timestamp:finite(p.timestamp),price:finite(p.price)}))
    .filter(p=>p.timestamp>0&&p.price>0)
    .sort((a,b)=>a.timestamp-b.timestamp);
}
export function isFreshBacktestQuote(row,timestamp){return Boolean(row&&row.timestamp===timestamp&&Number.isFinite(row.price)&&row.price>0);}
function latestAt(points,timestamp,pointer={i:0}){
  while(pointer.i+1<points.length&&points[pointer.i+1].timestamp<=timestamp)pointer.i++;
  const row=points[pointer.i];
  return row&&row.timestamp<=timestamp?row:null;
}
function maxDrawdown(curve){
  let peak=0,best=0;
  for(const row of curve){peak=Math.max(peak,row.equity);if(peak>0)best=Math.max(best,(peak-row.equity)/peak*100);}
  return best;
}
export function drawdownSeries(curve=[]){
  let peak=0;
  return curve.map(point=>{
    const equity=Number(point?.equity);
    if(!Number.isFinite(equity)||equity<=0)return{timestamp:point?.timestamp??null,drawdownPct:0};
    peak=Math.max(peak,equity);
    return{timestamp:point.timestamp,drawdownPct:Number((peak>0?(peak-equity)/peak*100:0).toFixed(2))};
  });
}
function annualizationFactor(timeline){
  const gaps=[];
  for(let i=1;i<timeline.length;i++)if(timeline[i]>timeline[i-1])gaps.push(timeline[i]-timeline[i-1]);
  const median=gaps.length?gaps.slice().sort((a,b)=>a-b)[Math.floor(gaps.length/2)]:86400000;
  return Math.sqrt((365*86400000)/Math.max(3600000,median));
}

export function analyzeBacktestRobustness({curve=[],paths=250,seed=42}={}){
  const safeCurve=Array.isArray(curve)?curve.filter(row=>Number.isFinite(Number(row?.equity))&&Number(row.equity)>0):[];
  const returns=[];
  for(let i=1;i<safeCurve.length;i++){const prev=Number(safeCurve[i-1].equity),next=Number(safeCurve[i].equity);if(prev>0)returns.push(next/prev-1)}
  if(returns.length<8)return{paths:0,confidence:{p05:null,p50:null,p95:null},drawdown:{p95:null},sampleSize:returns.length};
  let state=(Number(seed)>>>0)||42;
  const rand=()=>{state=(Math.imul(1664525,state)+1013904223)>>>0;return state/4294967296};
  const finals=[],drawdowns=[],count=Math.max(25,Math.min(1000,Number(paths)||250));
  for(let p=0;p<count;p++){
    let equity=1,peak=1,dd=0;
    for(let i=0;i<returns.length;i++){const r=returns[Math.floor(rand()*returns.length)];equity*=Math.max(.05,1+r);peak=Math.max(peak,equity);dd=Math.max(dd,(peak-equity)/peak)}
    finals.push(equity-1);drawdowns.push(dd);
  }
  const percentile=(values,p)=>{const sorted=values.slice().sort((a,b)=>a-b),index=(sorted.length-1)*p,lo=Math.floor(index),hi=Math.ceil(index);return lo===hi?sorted[lo]:sorted[lo]+(sorted[hi]-sorted[lo])*(index-lo)};
  return{paths:count,confidence:{p05:Number((percentile(finals,.05)*100).toFixed(2)),p50:Number((percentile(finals,.5)*100).toFixed(2)),p95:Number((percentile(finals,.95)*100).toFixed(2))},drawdown:{p95:Number((percentile(drawdowns,.95)*100).toFixed(2))},sampleSize:returns.length,seed:Number(seed)||42};
}

export function compareBacktests({histories={},botTypes=[],initialCash=10000,feeRate=.0015,slippageRate=.0005}={}){
  return botTypes.filter(Boolean).map(botType=>simulateBacktest({botType,histories,initialCash,feeRate,slippageRate})).sort((a,b)=>b.totalReturn-a.totalReturn);
}

export function simulateBacktest({
  botType="adaptive-ai",
  histories={},
  initialCash=10000,
  feeRate=.0015,
  slippageRate=.0005
}={}){
  if(!Number.isFinite(initialCash)||initialCash<=0)throw Error("Capital initial invalide.");
  if(!Number.isFinite(feeRate)||feeRate<0||feeRate>=1||!Number.isFinite(slippageRate)||slippageRate<0||slippageRate>=1)throw Error("Frais ou slippage invalides.");
  const symbols=Object.keys(histories).filter(symbol=>symbol!=="USDC");
  const series=Object.fromEntries(symbols.map(symbol=>[symbol,normalize(histories[symbol])]));
  const timeline=normalize(series.BTC||[]).map(p=>p.timestamp);
  if(timeline.length<16)throw Error("Historique insuffisant pour le backtest.");
  const pointers=Object.fromEntries(symbols.map(symbol=>[symbol,{i:0}]));
  let cash=finite(initialCash,10000);
  const holdings=Object.fromEntries(symbols.map(symbol=>[symbol,0]));
  let fees=0,turnover=0,trades=0,buyTrades=0,sellTrades=0;
  const curve=[];
  const decisionHistory=[];
  for(let i=14;i<timeline.length;i++){
    const t=timeline[i];
    const points=Object.fromEntries(symbols.map(symbol=>[symbol,series[symbol].filter(p=>p.timestamp<=t)]));
    const current=Object.fromEntries(symbols.map(symbol=>[symbol,latestAt(series[symbol],t,pointers[symbol])]).filter(([,row])=>row));
    const market=symbols.map(symbol=>{
      const row=current[symbol];
      const previous=series[symbol].filter(p=>p.timestamp<t).at(-1);
      return{symbol,price:row?.price||0,change24h:previous?.price?((row.price/previous.price)-1)*100:0};
    }).filter(row=>row.price>0&&isFreshBacktestQuote(current[row.symbol],t));
    const features=Object.fromEntries(market.map(row=>[row.symbol,buildAssetFeatures(row,points[row.symbol])])); 
    const forecasts=Object.fromEntries(Object.entries(features).map(([symbol,f])=>[symbol,forecast(f)]));
    const regime=detectRegime(market,features);
    const positions=Object.entries(holdings).map(([asset,quantity])=>{
      const price=finite(current[asset]?.price);
      return{asset,quantity,price,value:quantity*price,allocation:0};
    }).filter(row=>row.quantity>0&&row.price>0);
    const totalBefore=cash+positions.reduce((sum,row)=>sum+row.value,0);
    const weighted=positions.map(row=>({...row,allocation:totalBefore?row.value/totalBefore*100:0}));
    const risk=portfolioRisk({cash,total:totalBefore,positions:weighted},features);
    const selected=pickAsset(botType,forecasts,features,regime,weighted);
    const base=selected?baseDecision(botType,selected.symbol,features,forecasts[selected.symbol],regime,risk,weighted):{action:"hold",asset:null,fraction:0};
    const asset=base.asset;
    const price=finite(current[asset]?.price);
    if(asset&&price>0&&isFreshBacktestQuote(current[asset],t)&&base.action!=="hold"){
      const holding=Math.max(0,finite(holdings[asset]));
      if(base.action==="buy"&&cash>0){
        const requested=Math.min(cash/(1+feeRate),cash*Math.max(0,finite(base.fraction)));
        const executionPrice=price*(1+Math.max(0,feeRate*0+slippageRate));
        const quantity=requested/executionPrice;
        const fee=requested*feeRate;
        if(quantity>0&&requested+fee<=cash){
          cash-=requested+fee;
          holdings[asset]=holding+quantity;
          fees+=fee;turnover+=requested;trades++;buyTrades++;
          decisionHistory.push({timestamp:t,action:"buy",asset,price:Number(executionPrice.toFixed(4)),quantity:Number(quantity.toFixed(8)),fee:Number(fee.toFixed(4)),reason:"Signal d'achat simulé selon la stratégie, le régime de marché et le risque du portefeuille."});
        }
      }
      if(base.action==="sell"&&holding>0){
        const quantity=Math.min(holding,holding*Math.max(0,finite(base.fraction)));
        const executionPrice=price*(1-Math.min(.1,Math.max(0,slippageRate)));
        const proceeds=quantity*executionPrice;
        const fee=proceeds*feeRate;
        cash+=Math.max(0,proceeds-fee);
        holdings[asset]=holding-quantity;
        fees+=fee;turnover+=proceeds;trades++;sellTrades++;
        if(quantity>0)decisionHistory.push({timestamp:t,action:"sell",asset,price:Number(executionPrice.toFixed(4)),quantity:Number(quantity.toFixed(8)),fee:Number(fee.toFixed(4)),reason:"Signal de réduction simulée de l'exposition selon la stratégie et les limites de risque."});
      }
    }
    const equity=cash+Object.entries(holdings).reduce((sum,[symbol,quantity])=>sum+quantity*finite(current[symbol]?.price),0);
    curve.push({timestamp:t,equity:Number(equity.toFixed(2))});
  }
  const returns=[];
  for(let i=1;i<curve.length;i++){const previous=curve[i-1].equity;if(previous>0)returns.push(curve[i].equity/previous-1);}
  const finalEquity=curve.at(-1)?.equity||cash;
  const totalReturn=initialCash?finalEquity/initialCash-1:0;
  const ann=annualizationFactor(timeline);
  const avg=mean(returns),vol=std(returns),downside=returns.length?Math.sqrt(mean(returns.map(r=>Math.min(0,r)**2))):0;
  const sharpe=vol?avg/vol*ann:0;
  const sortino=downside?avg/downside*ann:0;
  const firstBtc=series.BTC.find(p=>p.timestamp===curve[0]?.timestamp)?.price,lastBtc=series.BTC.find(p=>p.timestamp===curve.at(-1)?.timestamp)?.price;
  const benchmarkReturn=firstBtc&&lastBtc?lastBtc/firstBtc-1:0;
  const benchmarkCurve=curve.map(point=>({timestamp:point.timestamp,equity:Number((firstBtc?initialCash*(finite(series.BTC.find(p=>p.timestamp===point.timestamp)?.price,firstBtc)/firstBtc):initialCash).toFixed(2))}));
  return{
    botType,
    initialCash:Number(initialCash.toFixed(2)),
    finalEquity:Number(finalEquity.toFixed(2)),
    totalReturn:Number((totalReturn*100).toFixed(2)),
    benchmarkBTC:Number((benchmarkReturn*100).toFixed(2)),
    excessReturnBTC:Number(((totalReturn-benchmarkReturn)*100).toFixed(2)),
    benchmarkPeriod:"same-as-strategy",
    maxDrawdown:Number(maxDrawdown(curve).toFixed(2)),
    sharpe:Number(sharpe.toFixed(2)),
    sortino:Number(sortino.toFixed(2)),
    volatility:Number((vol*100*ann).toFixed(2)),
    trades,
    decisionHistory:decisionHistory.slice(-30),
    buyTrades,
    sellTrades,
    fees:Number(fees.toFixed(2)),
    turnover:Number(turnover.toFixed(2)),
    periodPoints:curve.length,
    periodStart:curve[0]?.timestamp||null,
    periodEnd:curve.at(-1)?.timestamp||null,
    curve:curve.slice(-200),
    drawdownCurve:drawdownSeries(curve).slice(-200),
    benchmarkCurve:benchmarkCurve.slice(-200)
  };
}
