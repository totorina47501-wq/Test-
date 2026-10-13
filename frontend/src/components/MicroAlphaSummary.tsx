import {useEffect,useState} from "react";
import {Card} from "./ui";
type History={points:Array<{at:string;equityEur:number;pnlEur:number}>;sampleCount:number;maxObservedDrawdownPct:number|null};
const eur=(n:number)=>new Intl.NumberFormat("fr-FR",{style:"currency",currency:"EUR"}).format(n);
export function MicroAlphaSummary({token,onExpired}:{token:string;onExpired:()=>void}){
 const [history,setHistory]=useState<History|null>(null);
 const [error,setError]=useState(false);
 useEffect(()=>{
  const controller=new AbortController();
  setError(false);
  fetch("/api/micro-alpha/market-history",{signal:controller.signal,headers:{Authorization:"Bearer "+token}})
   .then(async res=>{if(res.status===401){onExpired();throw Error("Session expired");}if(!res.ok)throw Error("History unavailable");return res.json();})
   .then(data=>{if(!controller.signal.aborted)setHistory(data);})
   .catch(()=>{if(!controller.signal.aborted)setError(true);});
  return()=>controller.abort();
 },[token,onExpired]);
 return <Card aria-label="Résumé Micro Alpha" className="space-y-2">
  <h2 className="text-lg font-semibold">Micro Alpha · performance fictive</h2>
  <p className="text-xs text-slate-400">Compte paper séparé : jamais additionné au portefeuille principal ni attribué à Shield, Silver ou Gold.</p>
  {error?<p className="text-sm text-slate-400">Historique Micro Alpha indisponible.</p>:!history?<p className="text-sm text-slate-400">Chargement du suivi Micro Alpha…</p>:history.sampleCount?<><p className="text-sm">Dernière valeur enregistrée : <strong>{eur(history.points.at(-1)!.equityEur)}</strong></p><p className="text-xs text-slate-400">Points vérifiés : {history.sampleCount} · Drawdown observé : {history.maxObservedDrawdownPct===null?"non disponible":history.maxObservedDrawdownPct.toFixed(2)+" %"}</p></>:<p className="text-sm text-slate-400">Aucun point de performance enregistré. Ouvrez Bots IA pour commencer le suivi.</p>}
 </Card>;
}
