import {useLanguage} from "../i18n";
import {useEffect,useMemo,useState} from "react";
import {Badge,Button,Card} from "./ui";

const observabilityCopy={"fr":{"title":"Observatoire des bots IA","badge":"Historique réel · simulation","heading":"Journal des stratégies automatisées","intro":"Décisions et exécutions enregistrées, sans rendement inventé. Les backtests et Quantum Fund présentent séparément les performances hypothétiques.","refresh":"Actualiser","period":"Période commune","periodAria":"Période de comparaison des bots","days":"jours","allHistory":"Tout l’historique disponible","loading":"Chargement de l'historique des bots…","error":"Historique des bots indisponible. Réessayez.","decisions":"décisions","executions":"exécutions","successful":"réussies","rejected":"refusées","volume":"Volume exécuté simulé","notAvailable":"Résultat net / drawdown : non disponibles (valorisation historique absente)","filter":"Filtrer le journal par bot","allBots":"Tous les bots","footer":"100 derniers événements par source au maximum, filtrés par période : les données peuvent être incomplètes. Les volumes ne sont pas des profits. Les résultats de backtest ne représentent pas la performance du portefeuille.","execution":"Exécution","decision":"Décision"},"en":{"title":"AI bot observatory","badge":"Recorded history · simulation","heading":"Automated strategy journal","intro":"Recorded decisions and executions, without invented returns. Backtests and Quantum Fund show hypothetical performance separately.","refresh":"Refresh","period":"Shared period","periodAria":"Bot comparison period","days":"days","allHistory":"All available history","loading":"Loading bot history…","error":"Bot history unavailable. Please retry.","decisions":"decisions","executions":"executions","successful":"successful","rejected":"rejected","volume":"Simulated executed volume","notAvailable":"Net result / drawdown: unavailable (no historical valuation)","filter":"Filter journal by bot","allBots":"All bots","footer":"Up to 100 latest events per source, filtered by period: data may be incomplete. Volumes are not profits. Backtest results do not represent portfolio performance.","execution":"Execution","decision":"Decision"},"es":{"title":"Observatorio de bots IA","badge":"Historial registrado · simulación","heading":"Registro de estrategias automatizadas","intro":"Decisiones y ejecuciones registradas, sin rentabilidades inventadas. Los backtests y Quantum Fund muestran por separado resultados hipotéticos.","refresh":"Actualizar","period":"Período común","periodAria":"Período de comparación de bots","days":"días","allHistory":"Todo el historial disponible","loading":"Cargando historial de bots…","error":"Historial de bots no disponible. Inténtalo de nuevo.","decisions":"decisiones","executions":"ejecuciones","successful":"correctas","rejected":"rechazadas","volume":"Volumen ejecutado simulado","notAvailable":"Resultado neto / caída máxima: no disponibles (sin valoración histórica)","filter":"Filtrar registro por bot","allBots":"Todos los bots","footer":"Hasta 100 eventos recientes por fuente, filtrados por período: los datos pueden estar incompletos. Los volúmenes no son beneficios. Los backtests no representan el rendimiento de la cartera.","execution":"Ejecución","decision":"Decisión"}} as const;
type Execution={id:number;bot_type:string;action:string;asset:string;status:string;reason?:string;amount_eur?:number;created_at:string};
type Decision={id:number;bot_type:string;action:string;asset:string;reason?:string;decision_reason?:string;confidence?:number;created_at:string};
type Summary={bot:string;executions:number;successful:number;rejected:number;decisions:number;volume:number};
export function summarizeBotHistory(executions:Execution[],decisions:Decision[],ids:string[]):Summary[]{
 return [...new Set(ids)].map(bot=>{
  const events=executions.filter(e=>e.bot_type===bot);
  const signals=decisions.filter(d=>d.bot_type===bot);
  return {bot,executions:events.length,successful:events.filter(e=>["executed","success","filled","completed"].includes(String(e.status).toLowerCase())).length,rejected:events.filter(e=>["rejected","failed","skipped","blocked"].includes(String(e.status).toLowerCase())).length,decisions:signals.length,volume:events.filter(e=>["executed","success","filled","completed"].includes(String(e.status).toLowerCase())).reduce((sum,e)=>sum+Math.max(0,Number(e.amount_eur)||0),0)};
 });
}
export function BotObservabilityPanel({token,botIds,onExpired,compact=false}:{token:string;botIds:string[];onExpired:()=>void;compact?:boolean}){const {t,language}=useLanguage();const copy=observabilityCopy[language==="en"||language==="es"?language:"fr"];const locale=language==="en"?"en-GB":language==="es"?"es-ES":"fr-FR";
 const [executions,setExecutions]=useState<Execution[]>([]);
 const [decisions,setDecisions]=useState<Decision[]>([]);
 const [state,setState]=useState<"loading"|"ready"|"error">("loading");
 const [filter,setFilter]=useState("all");
 const [period,setPeriod]=useState<"7d"|"30d"|"90d"|"all">("30d");
 const [reload,setReload]=useState(0);
 useEffect(()=>{
  if(!token){setState("error");return}
  const controller=new AbortController();
  setState("loading");
  const headers={Authorization:"Bearer "+token,Accept:"application/json"};
  Promise.all(["/api/bots/executions/history?limit=100","/api/bots/decisions/history?limit=100"].map(async url=>{
   const response=await fetch(url,{headers,signal:controller.signal});
   if(response.status===401){onExpired();throw Error("Session expirée")}
   if(!response.ok)throw Error("Historique indisponible");
   return response.json();
  })).then(([a,b])=>{if(!controller.signal.aborted){setExecutions(Array.isArray(a.executions)?a.executions:[]);setDecisions(Array.isArray(b.decisions)?b.decisions:[]);setState("ready")}}).catch(()=>{if(!controller.signal.aborted)setState("error")});
  return()=>controller.abort();
 },[token,onExpired,reload]);
 const ids=useMemo(()=>[...new Set([...botIds,...executions.map(e=>e.bot_type),...decisions.map(d=>d.bot_type)])].filter(Boolean),[botIds,executions,decisions]);
 const filteredExecutions=useMemo(()=>executions.filter(e=>period==="all"||(Number.isFinite(Date.parse(e.created_at))&&Date.parse(e.created_at)>=Date.now()-({"7d":7,"30d":30,"90d":90}[period])*86400000)),[executions,period]);
 const filteredDecisions=useMemo(()=>decisions.filter(d=>period==="all"||(Number.isFinite(Date.parse(d.created_at))&&Date.parse(d.created_at)>=Date.now()-({"7d":7,"30d":30,"90d":90}[period])*86400000)),[decisions,period]);
 const summary=useMemo(()=>summarizeBotHistory(filteredExecutions,filteredDecisions,ids),[filteredExecutions,filteredDecisions,ids]);
 const timeline=useMemo(()=>[
  ...filteredExecutions.map(e=>({id:"e"+e.id,bot:e.bot_type,date:e.created_at,label:copy.execution+" "+e.action+" · "+e.status,asset:e.asset,reason:e.reason||""})),
  ...filteredDecisions.map(d=>({id:"d"+d.id,bot:d.bot_type,date:d.created_at,label:copy.decision+" "+d.action,asset:d.asset,reason:d.decision_reason||d.reason||""}))
 ].filter(e=>filter==="all"||e.bot===filter).sort((a,b)=>Date.parse(b.date)-Date.parse(a.date)).slice(0,compact?5:25),[filteredExecutions,filteredDecisions,filter,compact,copy]);
 return <Card className="space-y-4" aria-label={copy.title}>
  <div className="flex flex-wrap items-center justify-between gap-3"><div><Badge>{copy.badge}</Badge><h2 className="mt-2 text-xl font-semibold">{copy.heading}</h2><p className="mt-1 text-xs text-slate-400">{copy.intro}</p></div><Button variant="secondary" onClick={()=>setReload(v=>v+1)}>{copy.refresh}</Button></div>
  <label className="flex flex-wrap items-center gap-2 text-sm">{copy.period}<select aria-label={copy.periodAria} value={period} onChange={event=>setPeriod(event.target.value as "7d"|"30d"|"90d"|"all")} className="rounded-lg border border-white/15 bg-[#15171b] px-3 py-2 text-white"><option value="7d">7 {copy.days}</option><option value="30d">30 {copy.days}</option><option value="90d">90 {copy.days}</option><option value="all">{copy.allHistory}</option></select></label>
  {state==="loading"&&<p role="status">{copy.loading}</p>}
  {state==="error"&&<p role="alert" className="text-rose-300">{copy.error}</p>}
  {state==="ready"&&<><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{summary.filter(row=>!compact||row.executions||row.decisions).map(row=><div key={row.bot} className="rounded-xl border border-white/10 bg-white/[.03] p-3"><strong className="capitalize">{row.bot}</strong><p className="mt-2 text-sm text-slate-300">{row.decisions} {copy.decisions} · {row.executions} {copy.executions}</p><p className="text-xs text-slate-400">{row.successful} {copy.successful} · {row.rejected} {copy.rejected}</p><p className="mt-1 text-xs text-slate-400">{copy.volume}: {row.volume.toLocaleString(locale,{style:"currency",currency:"EUR"})}</p><p className="text-xs text-slate-400">{copy.notAvailable}</p></div>)}</div>
  {!summary.some(row=>row.executions||row.decisions)&&<p className="text-sm text-slate-400">{t("botNoActivity")}</p>}
  <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-semibold">{t("botJournal")}</h3><select aria-label={copy.filter} value={filter} onChange={e=>setFilter(e.target.value)} className="rounded-lg border border-white/15 bg-[#15171b] px-3 py-2 text-sm text-white"><option value="all">{copy.allBots}</option>{ids.map(id=><option key={id} value={id}>{id}</option>)}</select></div>
  <ul className="divide-y divide-white/10">{timeline.map(event=><li key={event.id} className="py-2 text-sm"><div className="flex flex-wrap justify-between gap-2"><span className="font-medium capitalize">{event.bot} · {event.asset||"—"}</span><time className="text-xs text-slate-400">{Number.isFinite(Date.parse(event.date))?new Date(event.date).toLocaleString(locale):"—"}</time></div><p className="text-slate-300">{event.label}</p>{event.reason&&<p className="text-xs text-slate-400">{event.reason}</p>}</li>)}</ul>
  {!timeline.length&&<p className="text-sm text-slate-400">{t("botNoEvents")}</p>}
  <p className="text-xs text-slate-500">{copy.footer}</p></>}
 </Card>;
}
