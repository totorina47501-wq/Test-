// Comparative research lab. All inputs are simulated strategy equity curves; no orders.
const finite=n=>Number.isFinite(Number(n))?Number(n):NaN;
function normalize(curve){
 if(!Array.isArray(curve)||curve.length<12)throw new RangeError("At least 12 equity observations required");
 const rows=curve.map(p=>({timestamp:finite(p.timestamp),equity:finite(p.equity)}));
 if(rows.some(p=>!Number.isFinite(p.timestamp)||!Number.isFinite(p.equity)||p.equity<=0))throw new RangeError("Invalid equity curve");
 for(let i=1;i<rows.length;i++)if(rows[i].timestamp<=rows[i-1].timestamp)throw new RangeError("Timestamps must increase");
 return rows;
}
const avg=a=>a.reduce((s,n)=>s+n,0)/a.length;
function stats(returns){
 const equity=returns.reduce((a,r)=>{a.push(a.at(-1)*(1+r));return a},[1]);
 let peak=1,dd=0;for(const v of equity){peak=Math.max(peak,v);dd=Math.max(dd,1-v/peak)}
 const mu=avg(returns),vol=Math.sqrt(avg(returns.map(r=>(r-mu)**2)));
 const downside=Math.sqrt(avg(returns.map(r=>Math.min(0,r)**2)));
 return {returnPct:+((equity.at(-1)-1)*100).toFixed(2),maxDrawdownPct:+(dd*100).toFixed(2),sharpe:vol?+(mu/vol*Math.sqrt(365)).toFixed(3):0,sortino:downside?+(mu/downside*Math.sqrt(365)).toFixed(3):0};
}
export function compareQuantumFund({agents,feeRate=0,rebalanceEvery=7,trainFraction=.6,maxWeight=.6}={}){
 if(!agents||typeof agents!=="object")throw new RangeError("Agents required");
 const ids=Object.keys(agents);if(ids.length<2)throw new RangeError("At least two agents required");
 if(!Number.isFinite(feeRate)||feeRate<0||feeRate>=.1||!Number.isInteger(rebalanceEvery)||rebalanceEvery<1||!(trainFraction>=.3&&trainFraction<=.8)||!(maxWeight>=1/ids.length&&maxWeight<=1))throw new RangeError("Invalid parameters");
 const curves=ids.map(id=>normalize(agents[id]));
 const stamps=curves[0].map(p=>p.timestamp);
 if(curves.some(c=>c.length!==stamps.length||c.some((p,i)=>p.timestamp!==stamps[i])))throw new RangeError("Agents must share identical timestamps");
 const all=curves.map(c=>c.slice(1).map((p,i)=>p.equity/c[i].equity-1));
 const n=all[0].length,split=Math.floor(n*trainFraction);
 if(split<8||n-split<4)throw new RangeError("Insufficient train/test observations");
 const train=all.map(a=>a.slice(0,split)),test=all.map(a=>a.slice(split));
 const score=a=>{const m=avg(a),v=Math.sqrt(avg(a.map(x=>(x-m)**2)));return v>0?m/v:0};
 const winner=train.map(score).indexOf(Math.max(...train.map(score)));
 const equal=ids.map(()=>1/ids.length);
 const raw=train.map(a=>Math.max(0,score(a)));
 const total=raw.reduce((a,b)=>a+b,0);
 let dynamic=total>0?raw.map(v=>v/total):equal.slice();
 // Capped simplex allocation; unallocated weight is retained as cash.
 dynamic=dynamic.map(w=>Math.min(maxWeight,w));
 function simulate(weights){
  let holdings=weights.slice(),cash=Math.max(0,1-holdings.reduce((a,b)=>a+b,0)),prev=1;
  const returns=[];
  for(let t=0;t<test[0].length;t++){
   if(t%rebalanceEvery===0){
    const totalValue=cash+holdings.reduce((a,b)=>a+b,0);
    const desired=weights.map(w=>w*totalValue);
    const turnover=desired.reduce((s,v,i)=>s+Math.abs(v-holdings[i]),0);
    const cost=turnover*feeRate;
    const investable=Math.max(0,totalValue-cost);
    holdings=weights.map(w=>w*investable);
    cash=investable*(1-weights.reduce((a,b)=>a+b,0));
   }
   holdings=holdings.map((v,i)=>v*(1+test[i][t]));
   const current=cash+holdings.reduce((a,b)=>a+b,0);
   returns.push(current/prev-1);prev=current;
  }
  return stats(returns);
 }
 return {simulationOnly:true,method:"train/test split; train-only agent selection and weights; out-of-sample comparison",trainPoints:split,testPoints:n-split,agents:ids,strategies:{single:{agent:ids[winner],...simulate(ids.map((_,i)=>i===winner?1:0))},equalWeight:simulate(equal),quantumFund:{weights:Object.fromEntries(ids.map((id,i)=>[id,+dynamic[i].toFixed(4)])),...simulate(dynamic)}},warning:"Agent curves must be independently backtested without look-ahead bias. This is not a live trading performance claim."};
}
