// Presentation-only normalization: never infer a reason or confidence absent from stored decisions.
export function presentDecision(row){
 const action={buy:"ACHAT",sell:"VENTE",hold:"CONSERVATION"}[String(row.action||"").toLowerCase()]||"INCONNUE";
 const raw=row.features;
 let features={};
 try{features=typeof raw==="string"?JSON.parse(raw):raw||{}}catch{features={}}
 const selected=features.selected&&typeof features.selected==="object"?features.selected:{};
 const indicators={};
 for(const [key,label] of [["momentum7d","Momentum 7j"],["rsi","RSI"],["volatility","Volatilité"],["trend","Tendance"],["macdHistogram","MACD histogramme"],["maxDrawdown","Drawdown"]]){
  if(typeof selected[key]==="number"&&Number.isFinite(selected[key]))indicators[key]={label,value:selected[key]};
 }
 const confidence=typeof row.confidence==="number"&&Number.isFinite(row.confidence)&&row.confidence>=0&&row.confidence<=1?row.confidence:null;
 return {...row,actionLabel:action,explanation:row.decision_reason||row.reason||null,confidence:confidence,indicators,risk:features.portfolioRisk||null,simulation:true};
}
export function decisionFilters(query){
 const botType=String(query.botType||"").trim().toLowerCase();
 const asset=String(query.asset||"").trim().toUpperCase();
 if(asset&&!/^[A-Z0-9]{2,15}$/.test(asset))throw new Error("Cryptomonnaie invalide.");
 const days=query.days==null||query.days===""?null:Number(query.days);
 if(days!==null&&(!Number.isInteger(days)||days<1||days>365))throw new Error("Période invalide.");
 const limit=Math.min(100,Math.max(1,Number.parseInt(String(query.limit||"30"),10)||30));
 return {botType,asset,days,limit};
}
