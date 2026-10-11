// Synthetic what-if lab: applies hypothetical market shocks to a Strategy DNA snapshot.
// Not a forecast, historical backtest, or order recommendation.
import {strategyDNA} from "./bot-strategy-dna.js";
const scenarios=Object.freeze({
  bull:{label:"Hausse rapide",shockPct:15,volatility:"high"},
  bear:{label:"Chute brutale",shockPct:-25,volatility:"high"},
  sideways:{label:"Marché latéral",shockPct:0,volatility:"low"}
});
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
export function botScenarioLab({type,portfolio={},decision={},features={},risk={},regime={}}={}){
  const dna=strategyDNA({type,decision,features,risk,regime});
  const total=Number(portfolio.total),cash=Number(portfolio.cash);
  if(!Number.isFinite(total)||total<=0||!Number.isFinite(cash)||cash<0||cash>total)throw new RangeError("Portefeuille simulé invalide");
  const exposure=clamp((total-cash)/total,0,1);
  return {bot:type,baselineEur:total,exposurePct:Number((exposure*100).toFixed(2)),scenarios:Object.entries(scenarios).map(([id,scenario])=>{
    const pnl=total*exposure*scenario.shockPct/100;
    return {id,label:scenario.label,shockPct:scenario.shockPct,estimatedTotalEur:Number((total+pnl).toFixed(2)),estimatedPnlEur:Number(pnl.toFixed(2)),riskFlag:scenario.shockPct<0&&exposure>dna.riskBudget/100?"above-profile-exposure":"none"};
  }),simulationOnly:true,forecast:false,assumptions:["Choc uniforme sur les positions exposées","Liquidités inchangées","Sans frais, slippage ni rééquilibrage automatique"]};
}
