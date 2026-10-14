import {useLanguage} from "../i18n";
import {useEffect,useState} from "react";
import {Card} from "./ui";
type History={points:Array<{at:string;equityEur:number;pnlEur:number}>;sampleCount:number;maxObservedDrawdownPct:number|null};
const eur=(n:number,locale:string)=>new Intl.NumberFormat(locale,{style:"currency",currency:"EUR"}).format(n);
export function MicroAlphaSummary({token,onExpired}:{token:string;onExpired:()=>void}){
 const {language,t}=useLanguage();
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
 return <Card aria-label={t("microSummaryTitle")} className="space-y-2">
  <h2 className="text-lg font-semibold">{t("microSummaryTitle")}</h2>
  <p className="text-xs text-slate-400">{t("microSummaryDesc")}</p>
  {error?<p className="text-sm text-slate-400">{t("microSummaryError")}</p>:!history?<p className="text-sm text-slate-400">{t("microSummaryLoading")}</p>:history.sampleCount?<><p className="text-sm">{t("microSummaryLast")} : <strong>{eur(history.points[history.points.length-1].equityEur,language)}</strong></p><p className="text-xs text-slate-400">{t("microSummaryPoints")} : {history.sampleCount} · {t("microSummaryDrawdown")} : {history.maxObservedDrawdownPct===null?t("microSummaryUnavailable"):history.maxObservedDrawdownPct.toFixed(2)+" %"}</p></>:<p className="text-sm text-slate-400">{t("microSummaryEmpty")}</p>}
 </Card>;
}
