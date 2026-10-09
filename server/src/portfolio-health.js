// Educational heuristics for simulated portfolios; not an investment recommendation.
export function portfolioHealth({cash=0,positions=[],activeBots=0}={}){
 const safeCash=Number.isFinite(Number(cash))?Math.max(0,Number(cash)):0;
 const valid=positions.map(p=>({asset:String(p.asset||"").toUpperCase(),value:Number(p.value)})).filter(p=>p.asset&&Number.isFinite(p.value)&&p.value>0);
 const invested=valid.reduce((sum,p)=>sum+p.value,0),total=safeCash+invested;
 const allocations=valid.map(p=>({...p,percent:total>0?p.value/total*100:0})).sort((a,b)=>b.percent-a.percent);
 const concentration=allocations[0]?.percent||0,exposure=total>0?invested/total*100:0;
 const cashPercent=total>0?safeCash/total*100:0;
 const hhi=total>0?allocations.reduce((sum,p)=>sum+(p.value/total)**2,0):0;
 const diversification=valid.length<2?"Faible":hhi>.4?"Limitée":"Répartie";
 const alerts=[];
 if(concentration>=50)alerts.push({level:"warning",code:"concentration",message:"Une seule crypto représente au moins 50 % du portefeuille simulé."});
 if(exposure>=90)alerts.push({level:"warning",code:"exposure",message:"Moins de 10 % du portefeuille est conservé en liquidités simulées."});
 if(valid.length===1)alerts.push({level:"info",code:"single_asset",message:"Une seule cryptomonnaie est détenue."});
 const bots=Math.max(0,Number(activeBots)||0);
 const score=Math.min(100,Math.round(concentration*.55+exposure*.25+Math.min(3,bots)*5+(hhi*15)));
 return {score,label:score>=70?"Vigilance élevée":score>=40?"Vigilance modérée":"Vigilance faible",method:"Indicateur pédagogique heuristique, non prédictif",diversification,concentration:Math.round(concentration*10)/10,exposure:Math.round(exposure*10)/10,cashPercent:Math.round(cashPercent*10)/10,positionCount:valid.length,alerts};
}
