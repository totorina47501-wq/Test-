import {useEffect,useMemo,useState} from "react";
import {Badge,Button,Card} from "./ui";

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
export function BotObservabilityPanel({token,botIds,onExpired,compact=false}:{token:string;botIds:string[];onExpired:()=>void;compact?:boolean}){
 const [executions,setExecutions]=useState<Execution[]>([]);
 const [decisions,setDecisions]=useState<Decision[]>([]);
 const [state,setState]=useState<"loading"|"ready"|"error">("loading");
 const [filter,setFilter]=useState("all");
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
 const summary=useMemo(()=>summarizeBotHistory(executions,decisions,ids),[executions,decisions,ids]);
 const timeline=useMemo(()=>[
  ...executions.map(e=>({id:"e"+e.id,bot:e.bot_type,date:e.created_at,label:"Exécution "+e.action+" · "+e.status,asset:e.asset,reason:e.reason||""})),
  ...decisions.map(d=>({id:"d"+d.id,bot:d.bot_type,date:d.created_at,label:"Décision "+d.action,asset:d.asset,reason:d.decision_reason||d.reason||""}))
 ].filter(e=>filter==="all"||e.bot===filter).sort((a,b)=>Date.parse(b.date)-Date.parse(a.date)).slice(0,compact?5:25),[executions,decisions,filter,compact]);
 return <Card className="space-y-4" aria-label="Observatoire des bots IA">
  <div className="flex flex-wrap items-center justify-between gap-3"><div><Badge>Historique réel · simulation</Badge><h2 className="mt-2 text-xl font-semibold">Journal des stratégies automatisées</h2><p className="mt-1 text-xs text-slate-400">Décisions et exécutions enregistrées, sans rendement inventé. Les backtests et Quantum Fund présentent séparément les performances hypothétiques.</p></div><Button variant="secondary" onClick={()=>setReload(v=>v+1)}>Actualiser</Button></div>
  {state==="loading"&&<p role="status">Chargement de l'historique des bots…</p>}
  {state==="error"&&<p role="alert" className="text-rose-300">Historique des bots indisponible. Réessayez.</p>}
  {state==="ready"&&<><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{summary.filter(row=>!compact||row.executions||row.decisions).map(row=><div key={row.bot} className="rounded-xl border border-white/10 bg-white/[.03] p-3"><strong className="capitalize">{row.bot}</strong><p className="mt-2 text-sm text-slate-300">{row.decisions} décisions · {row.executions} exécutions</p><p className="text-xs text-slate-400">{row.successful} réussies · {row.rejected} refusées</p><p className="mt-1 text-xs text-slate-400">Volume exécuté simulé : {row.volume.toLocaleString("fr-FR",{style:"currency",currency:"EUR"})}</p></div>)}</div>
  {!summary.some(row=>row.executions||row.decisions)&&<p className="text-sm text-slate-400">Aucune activité de bot enregistrée pour le moment.</p>}
  <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-semibold">Journal des événements</h3><select aria-label="Filtrer le journal par bot" value={filter} onChange={e=>setFilter(e.target.value)} className="rounded-lg border border-white/15 bg-[#15171b] px-3 py-2 text-sm text-white"><option value="all">Tous les bots</option>{ids.map(id=><option key={id} value={id}>{id}</option>)}</select></div>
  <ul className="divide-y divide-white/10">{timeline.map(event=><li key={event.id} className="py-2 text-sm"><div className="flex flex-wrap justify-between gap-2"><span className="font-medium capitalize">{event.bot} · {event.asset||"—"}</span><time className="text-xs text-slate-400">{Number.isFinite(Date.parse(event.date))?new Date(event.date).toLocaleString("fr-FR"):"—"}</time></div><p className="text-slate-300">{event.label}</p>{event.reason&&<p className="text-xs text-slate-400">{event.reason}</p>}</li>)}</ul>
  {!timeline.length&&<p className="text-sm text-slate-400">Aucun événement pour ce filtre.</p>}
  <p className="text-xs text-slate-500">100 derniers événements par source au maximum. Les volumes ne sont pas des profits. Les résultats de backtest ne représentent pas la performance du portefeuille.</p></>}
 </Card>;
}
