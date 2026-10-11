// Strategy DNA: deterministic, explainable profile for simulated trading bots.
// This module never places orders or calls an external AI provider.
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
const safe=(value,fallback=0)=>Number.isFinite(Number(value))?Number(value):fallback;
const profiles={
  shield:{label:"Protection",style:"defensive",riskBudget:25},
  silver:{label:"Équilibre",style:"balanced",riskBudget:45},
  gold:{label:"Dynamisme",style:"offensive",riskBudget:65}
};
export function strategyDNA({type,decision={},features={},risk={},regime={}}={}){
  const profile=profiles[type];
  if(!profile)throw new RangeError("Stratégie inconnue");
  const action=["buy","sell","hold"].includes(decision.action)?decision.action:"hold";
  const asset=typeof decision.asset==="string"&&/^[A-Z0-9]{2,12}$/.test(decision.asset)?decision.asset:null;
  const indicators=asset&&features[asset]||{};
  const confidence=clamp(safe(decision.confidence),0,1);
  const cashPct=clamp(safe(risk.cashPct,100),0,100);
  const riskScore=clamp(safe(risk.score),0,100);
  const regimeName=["bullish","risk-off","high-volatility","range"].includes(regime.name)?regime.name:"unknown";
  const reasons=[];
  if(regimeName==="risk-off")reasons.push("Marché défavorable : priorité à la maîtrise du risque.");
  if(riskScore>=70)reasons.push("Risque du portefeuille élevé.");
  if(cashPct<20)reasons.push("Réserve de liquidités faible.");
  if(safe(indicators.rsi,50)>78)reasons.push("RSI élevé : vigilance sur la surchauffe.");
  if(safe(indicators.momentum7d)<-5)reasons.push("Momentum négatif sur sept jours.");
  if(!reasons.length)reasons.push(action==="hold"?"Conditions insuffisantes pour intervenir.":"Signal simulé compatible avec la stratégie.");
  return Object.freeze({
    bot:type,label:profile.label,style:profile.style,riskBudget:profile.riskBudget,
    action,asset,confidence:Number(confidence.toFixed(3)),regime:regimeName,
    metrics:{riskScore,cashPct,momentum7d:safe(indicators.momentum7d),rsi:clamp(safe(indicators.rsi,50),0,100)},
    reasons,simulationOnly:true
  });
}
