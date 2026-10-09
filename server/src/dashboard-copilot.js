// Explanations use observed portfolio and recorded bot decisions only.
// No generative claims, price predictions, or real-order recommendations.
export function dashboardCopilot({portfolio={},health={},latestDecision=null,market={}}={}){
 const notes=[];
 const eur=value=>Number.isFinite(Number(value))?Number(value).toFixed(2).replace(".",",")+" €":"indisponible";
 const change=Number(portfolio.returnEur);
 if(Number.isFinite(change))notes.push({kind:"performance",title:"Performance simulée",message:"Écart affiché par rapport au capital initial : "+eur(change)+". Ce chiffre reflète les valorisations du portefeuille simulé et ne représente pas un rendement garanti.",source:"portefeuille"});
 else notes.push({kind:"performance",title:"Performance indisponible",message:"Données de performance insuffisantes.",source:"portefeuille"});
 if(health.alerts?.length){for(const alert of health.alerts.slice(0,2))notes.push({kind:"risk",title:"Point de vigilance",message:String(alert.message),source:"indicateurs de risque"});}
 else notes.push({kind:"risk",title:"Répartition",message:"Aucune alerte de concentration ou de liquidité selon les seuils pédagogiques actuels. Cela ne signifie pas absence de risque.",source:"indicateurs de risque"});
 if(latestDecision&&typeof latestDecision==="object"){
  const bot=String(latestDecision.bot_type||"bot");
  const action=String(latestDecision.action||"hold").toLowerCase();
  const label={buy:"achat",sell:"vente",hold:"conservation"}[action]||"observation";
  const asset=String(latestDecision.asset||"").replace(/[^A-Za-z0-9_-]/g,"").slice(0,12);
  const reason=String(latestDecision.reason||"Justification non enregistrée.").slice(0,300);
  notes.push({kind:"bot",title:"Dernière décision enregistrée",message:bot+" : "+label+(asset?" sur "+asset:"")+". "+reason,source:"journal des décisions du moteur"});
 }else notes.push({kind:"bot",title:"Décisions des bots",message:"Aucune décision IA enregistrée à expliquer pour le moment.",source:"journal des décisions du moteur"});
 return {mode:"pedagogical",disclaimer:"Analyse déterministe de données simulées. Ni conseil financier ni prévision de marché.",notes};
}
