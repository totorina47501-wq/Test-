import {blendForecastWithSentiment,scoreNews} from "./bot-ai-sentiment.js";

const PROVIDER_ORDER=["openai","gemini","anthropic"];
const provider=String(process.env.BOT_AI_PROVIDER||"auto").trim().toLowerCase();
const config={
  provider,
  openaiKey:String(process.env.OPENAI_API_KEY||"").trim(),
  openaiModel:String(process.env.OPENAI_MODEL||"gpt-6-luna").trim(),
  geminiKey:String(process.env.GEMINI_API_KEY||"").trim(),
  geminiModel:String(process.env.GEMINI_MODEL||"gemini-3.8-flash").trim(),
  anthropicKey:String(process.env.ANTHROPIC_API_KEY||"").trim(),
  anthropicModel:String(process.env.ANTHROPIC_MODEL||"claude-sonnet-5").trim(),
  timeoutMs:Math.max(2000,Number(process.env.BOT_AI_TIMEOUT_MS||7000)),
  cacheMs:Math.max(30000,Number(process.env.BOT_AI_CACHE_MS||300000))
};
const aiCache=new Map();
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
const finite=(v,fallback=0)=>Number.isFinite(Number(v))?Number(v):fallback;
const mean=values=>{const a=values.filter(Number.isFinite);return a.length?a.reduce((s,v)=>s+v,0)/a.length:0};
const std=values=>{const a=values.filter(Number.isFinite);if(a.length<2)return 0;const m=mean(a);return Math.sqrt(mean(a.map(v=>(v-m)**2)))};
function series(points){return(points||[]).map(p=>({timestamp:finite(p.timestamp),price:finite(p.price)})).filter(p=>p.price>0)}
export function momentum(points){const v=series(points).map(p=>p.price);return v.length>1&&v[0]>0?(v[v.length-1]/v[0]-1)*100:0}
export function rsi(points){const v=series(points).map(p=>p.price);if(v.length<4)return 50;const start=Math.max(1,v.length-14),g=[],l=[];for(let i=start;i<v.length;i++){const d=v[i]-v[i-1];if(d>0)g.push(d);else if(d<0)l.push(-d)}const periods=Math.min(14,v.length-1);const ag=g.reduce((s,x)=>s+x,0)/periods,al=l.reduce((s,x)=>s+x,0)/periods;if(al===0)return ag>0?100:50;return 100-100/(1+ag/al)}
export function volatility(points){const v=series(points).map(p=>p.price);if(v.length<4)return 0;const returns=[];for(let i=1;i<v.length;i++)if(v[i-1]>0)returns.push((v[i]/v[i-1]-1)*100);return std(returns)}
export function trend(points){const v=series(points).map(p=>p.price);if(v.length<6)return 0;const half=Math.floor(v.length/2);const fast=mean(v.slice(-half)),slow=mean(v.slice(0,half));return slow?((fast/slow)-1)*100:0}
export function maxDrawdown(points){const v=series(points).map(p=>p.price);let peak=0,best=0;for(const price of v){peak=Math.max(peak,price);if(peak>0)best=Math.max(best,(peak-price)/peak*100)}return best}
export function ema(points,period=12){const prices=series(points).map(p=>p.price);if(!Number.isInteger(period)||period<2||prices.length<period)return null;let result=prices.slice(0,period).reduce((a,b)=>a+b,0)/period;const alpha=2/(period+1);for(let i=period;i<prices.length;i++)result=alpha*prices[i]+(1-alpha)*result;return result}
export function macd(points){const prices=series(points);if(prices.length<34)return{value:null,signal:null,histogram:null};const values=[];for(let i=26;i<=prices.length;i++){const subset=prices.slice(0,i);values.push(ema(subset,12)-ema(subset,26))}let signal=values.slice(0,9).reduce((a,b)=>a+b,0)/9;for(let i=9;i<values.length;i++)signal=.2*values[i]+.8*signal;const value=values.at(-1);return{value,signal,histogram:value-signal}}
export function buildAssetFeatures(marketRow,history){const h=series(history);const m7=momentum(h),tr=trend(h),vol=volatility(h),rs=rsi(h);const day=finite(marketRow?.change24h);const technical=macd(h);return{ema12:ema(h,12),ema26:ema(h,26),macd:technical.value,macdSignal:technical.signal,macdHistogram:technical.histogram,price:finite(marketRow?.price),change24h:day,momentum7d:m7,trend:tr,volatility:vol,rsi:rs,maxDrawdown:maxDrawdown(h),historyPoints:h.length}}
export function detectRegime(market,features){const btc=market.find(x=>x.symbol==="BTC"),eth=market.find(x=>x.symbol==="ETH");const bf=features.BTC||{},ef=features.ETH||{};const btcDay=finite(btc?.change24h),ethDay=finite(eth?.change24h);const vol=mean([finite(bf.volatility),finite(ef.volatility)]);const score=mean([btcDay/3,ethDay/3,bf.momentum7d/8,ef.momentum7d/8]);if(score>0.9&&vol<6)return{name:"bullish",score:clamp(0.5+score*.15,0,1),label:"Bullish"};if(score<-0.8||vol>9&&score<0)return{name:"risk-off",score:clamp(0.5+score*.15,0,1),label:"Risk-Off"};if(vol>9)return{name:"high-volatility",score:0.5,label:"High Volatility"};return{name:"range",score:clamp(0.5+score*.12,0,1),label:"Range"}}
export function forecast(feature){const momentumScore=clamp((feature.momentum7d+12)/24,0,1);const trendScore=clamp((feature.trend+8)/16,0,1);const dayScore=clamp((feature.change24h+6)/12,0,1);const rsiScore=feature.rsi<30?0.72:feature.rsi>78?0.28:clamp(1-Math.abs(feature.rsi-52)/70,0,1);const volPenalty=clamp(feature.volatility/12,0,1)*.18;const macdBias=Number.isFinite(feature.macdHistogram)&&feature.price>0?clamp(feature.macdHistogram/feature.price*100,-2,2)*.025:0;const score=clamp(.32*momentumScore+.28*trendScore+.22*dayScore+.18*rsiScore+macdBias-volPenalty,0,1);return{score,upProbability:clamp(.5+(score-.5)*1.25,0,1)}}
export function portfolioRisk(portfolio,features){const total=finite(portfolio?.total);const cash=finite(portfolio?.cash);const cashPct=total?cash/total*100:100;const positions=Array.isArray(portfolio?.positions)?portfolio.positions:[];const concentration=positions.reduce((m,p)=>Math.max(m,finite(p.allocation)),0);const weightedVol=mean(positions.map(p=>finite(features[p.asset]?.volatility)));const drawdown=mean(positions.map(p=>finite(features[p.asset]?.maxDrawdown)));const score=clamp(Math.round(14+concentration*.62+(cashPct<15?18:cashPct<25?8:0)+weightedVol*2.4+drawdown*.7),0,100);return{score,cashPct,concentration,weightedVol,drawdown}}
export function pickAsset(type,forecasts,features,regime,positions){const ranked=Object.keys(forecasts).map(symbol=>({symbol,...forecasts[symbol],m:finite(features[symbol]?.momentum7d),v:finite(features[symbol]?.volatility)})).sort((a,b)=>b.score-a.score);if(!ranked.length)return null;if(type==="shield")return ranked.find(x=>x.symbol==="BTC")||ranked[0];if(type==="macro-rotation")return ranked.find(x=>x.symbol!=="USDC")||ranked[0];if(type==="quant-pulse")return ranked.find(x=>Math.abs(x.m)>1.2)||ranked[0];return ranked[0]}
export function baseDecision(type,asset,features,forecastValue,regime,risk,positions){const holding=positions.find(p=>p.asset===asset);const qty=finite(holding?.quantity);const m=finite(features[asset]?.momentum7d),v=finite(features[asset]?.volatility),r=finite(features[asset]?.rsi);const positive=forecastValue.upProbability>=0.58&&m>-1&&r<78;const negative=forecastValue.upProbability<=0.42||m<-5||r>84;let action="hold",fraction=.0;
 if(type==="shield"){if(risk.score>=68||regime.name==="risk-off"||v>8){action=qty>0&&negative?"sell":"hold";fraction=.08}else if(positive&&risk.cashPct>=30){action="buy";fraction=.012}}
 else if(type==="silver"){if(negative&&qty>0)action="sell",fraction=.10;else if(positive&&risk.score<72)action="buy",fraction=.02}
 else if(type==="gold"){if(negative&&qty>0)action="sell",fraction=.15;else if(positive&&m>2&&regime.name!=="risk-off"&&risk.score<76)action="buy",fraction=.035}
 else if(type==="adaptive-ai"){if(negative&&qty>0)action="sell",fraction=.12;else if(positive&&risk.score<78)action="buy",fraction=.025}
 else if(type==="quant-pulse"){if(negative&&qty>0)action="sell",fraction=.12;else if(positive&&Math.abs(m)>1.2&&risk.score<78)action="buy",fraction=.022}
 else if(type==="macro-rotation"){if(regime.name==="risk-off"&&qty>0)action="sell",fraction=.14;else if(regime.name!=="risk-off"&&positive&&risk.score<74)action="buy",fraction=.02}
 return{action,asset,fraction}}
function configuredProvider(){if(provider!=="auto")return PROVIDER_ORDER.includes(provider)&&config[provider+"Key"]?provider:"none";for(const p of PROVIDER_ORDER)if(config[p+"Key"])return p;return"none"}
export function getBotAIConfig(){const p=configuredProvider();return{enabled:p!=="none",provider:p,model:p==="openai"?config.openaiModel:p==="gemini"?config.geminiModel:p==="anthropic"?config.anthropicModel:null,timeoutMs:config.timeoutMs,cacheMs:config.cacheMs}}
function timeoutFetch(url,options){const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),config.timeoutMs);return fetch(url,{...options,signal:controller.signal}).finally(()=>clearTimeout(timer))}
function textFromOpenAI(data){if(typeof data?.output_text==="string")return data.output_text;const parts=[];for(const item of data?.output||[])for(const c of item?.content||[])if(typeof c?.text==="string")parts.push(c.text);return parts.join("\n")}
async function callOpenAI(prompt){const res=await timeoutFetch("https://api.openai.com/v1/responses",{method:"POST",headers:{authorization:"Bearer "+config.openaiKey,"content-type":"application/json"},body:JSON.stringify({model:config.openaiModel,input:prompt})});if(!res.ok)throw Error("OpenAI HTTP "+res.status);const data=await res.json();return textFromOpenAI(data)}
async function callGemini(prompt){const url="https://generativelanguage.googleapis.com/v1beta/models/"+encodeURIComponent(config.geminiModel)+":generateContent?key="+encodeURIComponent(config.geminiKey);const res=await timeoutFetch(url,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({contents:[{parts:[{text:prompt}]}],generationConfig:{temperature:0.1}})});if(!res.ok)throw Error("Gemini HTTP "+res.status);const data=await res.json();return(data.candidates||[]).flatMap(c=>c.content?.parts||[]).map(p=>p.text||"").join("\n")}
async function callAnthropic(prompt){const res=await timeoutFetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"x-api-key":config.anthropicKey,"anthropic-version":"2023-06-01","content-type":"application/json"},body:JSON.stringify({model:config.anthropicModel,max_tokens:280,temperature:0.1,messages:[{role:"user",content:prompt}]})});if(!res.ok)throw Error("Anthropic HTTP "+res.status);const data=await res.json();return(data.content||[]).map(x=>x.text||"").join("\n")}
export function parseJson(text){const raw=String(text||"").trim();if(!raw)throw Error("Réponse IA non JSON");const fenced=raw.match(/^\s*```(?:json)?\s*([\s\S]*?)\s*```\s*$/i);const source=fenced?fenced[1]:raw;try{return JSON.parse(source)}catch{const begin=source.indexOf("{"),end=source.lastIndexOf("}");if(begin<0||end<=begin)throw Error("Réponse IA non JSON");return JSON.parse(source.slice(begin,end+1))}}
async function aiOverlay(type,regime,ranked,risk,sentiment){const p=configuredProvider();if(p==="none")return null;const top=ranked.slice(0,4).map(x=>({asset:x.symbol,upProbability:Number(x.upProbability.toFixed(3)),score:Number(x.score.toFixed(3))}));const prompt=["You are a constrained crypto strategy classifier inside a simulated trading system.","Do not invent prices. Do not give financial advice. Return JSON only.","Allowed bias: buy, sell, hold. Select one asset from the supplied list.","Regime: "+regime.name+". Portfolio risk: "+JSON.stringify(risk),"Market sentiment: "+JSON.stringify({bias:sentiment?.bias||"neutral",score:sentiment?.score||0,confidence:sentiment?.confidence||0}),"Candidates: "+JSON.stringify(top),"Bot: "+type,'Return {"bias":"buy|sell|hold","asset":"SYMBOL","confidence":0..1,"reason":"max 180 chars"}'].join("\n");const now=Date.now();const key=p+"|"+config[p+"Model"]+"|"+type+"|"+regime.name+"|"+top.map(x=>x.asset+Math.round(x.score*100)).join(",");const cached=aiCache.get(key);if(cached&&now-cached.time<config.cacheMs)return cached.value;let raw;if(p==="openai")raw=await callOpenAI(prompt);else if(p==="gemini")raw=await callGemini(prompt);else raw=await callAnthropic(prompt);const parsed=parseJson(raw);const value={bias:["buy","sell","hold"].includes(parsed.bias)?parsed.bias:"hold",asset:top.some(x=>x.asset===parsed.asset)?parsed.asset:top[0]?.asset||null,confidence:clamp(finite(parsed.confidence,.5),0,1),reason:String(parsed.reason||"Analyse IA indisponible").slice(0,180)};aiCache.set(key,{time:now,value});return value}
export async function evaluateBot({type,market,histories,portfolio,subscription,news}={}){
 const safeType=String(type||"").toLowerCase();
 const validMarket=(Array.isArray(market)?market:[]).filter(row=>row&&typeof row.symbol==="string"&&Number.isFinite(Number(row.price))&&Number(row.price)>0);
 const features=Object.fromEntries(validMarket.map(row=>[row.symbol,buildAssetFeatures(row,histories?.[row.symbol])]));
 const eligibleMarket=validMarket.filter(row=>features[row.symbol].historyPoints>=4);
 const eligibleFeatures=Object.fromEntries(eligibleMarket.map(row=>[row.symbol,features[row.symbol]]));
 const regime=detectRegime(eligibleMarket,eligibleFeatures);
 const sentiment=scoreNews(news||[]);
 const forecasts=Object.fromEntries(Object.entries(eligibleFeatures).map(([symbol,f])=>[symbol,blendForecastWithSentiment(forecast(f),sentiment.perAsset[symbol]||sentiment)]));
 const risk=portfolioRisk(portfolio||{},eligibleFeatures);
 const positions=Array.isArray(portfolio?.positions)?portfolio.positions:[];
 const ranked=Object.keys(forecasts).map(symbol=>({symbol,...forecasts[symbol],momentum7d:features[symbol].momentum7d,volatility:features[symbol].volatility})).sort((a,b)=>b.score-a.score);
 const selected=pickAsset(safeType,forecasts,eligibleFeatures,regime,positions);
 let base=selected?baseDecision(safeType,selected.symbol,features,forecasts[selected.symbol],regime,risk,positions):{action:"hold",asset:null,fraction:0};
 let ai=null;
 let decisionReason=selected?"strategy_signal":"no_eligible_market_data";
 if(ranked.length)try{ai=await aiOverlay(safeType,regime,ranked,risk,sentiment)}catch(error){console.warn("[BOT-AI] provider unavailable:",error.message)}
 if(base.action==="hold"&&selected)decisionReason="strategy_hold";
 // External AI can veto a proposed simulated order, never originate one.
 // A disagreement on the asset is also a veto, even if the direction matches.
 if(ai&&ai.confidence>=.62&&base.action!=="hold"&&(ai.bias!==base.action||ai.asset!==base.asset)){
  base={action:"hold",asset:base.asset,fraction:0};
  decisionReason="ai_veto";
 }
 if(base.action!=="hold"&&(!base.asset||!eligibleFeatures[base.asset]||!Number.isFinite(eligibleFeatures[base.asset].price)||eligibleFeatures[base.asset].price<=0)){
  base={action:"hold",asset:base.asset||null,fraction:0};
  decisionReason="invalid_market_data";
 }
 if(base.action==="buy"&&(risk.cashPct<finite(subscription?.min_cash_pct,20)||risk.score>=82)){
  base={action:"hold",asset:base.asset,fraction:0};
  decisionReason="risk_limit";
 }
 const selectedFeatures=base.asset?features[base.asset]:null;
 const selectedForecast=base.asset?forecasts[base.asset]:null;
 const message=base.action==="buy"?"IA favorable : "+regime.label+" · score "+Math.round((selectedForecast?.upProbability||.5)*100)+" % · momentum "+finite(selectedFeatures?.momentum7d).toFixed(1)+" %." :base.action==="sell"?"IA défensive : "+regime.label+" · risque "+risk.score+"/100 · drawdown "+finite(selectedFeatures?.maxDrawdown).toFixed(1)+" %." :"IA en attente : "+regime.label+" · risque "+risk.score+"/100 · signal insuffisant pour agir.";
 return{...base,decisionReason,aiConfidence:ai?.confidence??null,confidence:Number((selectedForecast?.upProbability??.5).toFixed(3)),engine:"ensemble-v2",provider:configuredProvider(),model:getBotAIConfig().model,regime,ai,sentiment,features,forecasts,portfolioRisk:risk,selected:selectedForecast?{asset:base.asset,features:selectedFeatures,forecast:selectedForecast}:null,message,generatedAt:Date.now()};
}
