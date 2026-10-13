import {useEffect,useState} from "react";
import {useAuth} from "../auth/AuthContext";
import {CheckCircle2,Compass,X} from "lucide-react";
import {Card} from "./ui";

const KEY="bitgold:react-onboarding:v3";
const LAST_USER="bitgold:react-onboarding:owner";
function accountScope(token:string){try{const payload=token.split(".")[1];if(!payload)return "";const data=JSON.parse(atob(payload.replace(/-/g,"+").replace(/_/g,"/")));return String(data.id??data.userId??data.sub??"")}catch{return ""}}
function scopedKey(token:string){const user=accountScope(token);return user?KEY+":"+user:""}
const steps=[
  {title:"Explorer les marchés",href:"/investir",description:"Consultez les prix avant toute simulation."},
  {title:"Consulter mon portefeuille",href:"/portefeuille",description:"Retrouvez vos liquidités et positions virtuelles."},
  {title:"Découvrir les bots",href:"/bots",description:"Comparez les stratégies et leurs risques."},
  {title:"Première simulation",href:"/investir",description:"Effectuez une opération fictive depuis un actif, puis vérifiez votre portefeuille."}
];
function readProgress(token:string):number[]{try{const key=scopedKey(token);if(!key)return [];const value=JSON.parse(localStorage.getItem(key)||"[]");return Array.isArray(value)?value.filter((v):v is number=>Number.isInteger(v)&&v>=0&&v<steps.length):[]}catch{return []}}
export function ReactOnboarding(){
  const {token}=useAuth();
  const [done,setDone]=useState<number[]>(()=>readProgress(token));
  useEffect(()=>{const owner=accountScope(token);if(!owner)return;try{const last=sessionStorage.getItem(LAST_USER);if(last!==owner){sessionStorage.setItem(LAST_USER,owner);setDone(readProgress(token))}}catch{}},[token]);
  const [dismissed,setDismissed]=useState(()=>{try{return sessionStorage.getItem(scopedKey(token)+":dismissed")==="1"}catch{return false}});
  useEffect(()=>{setDismissed(false);try{setDismissed(sessionStorage.getItem(scopedKey(token)+":dismissed")==="1")}catch{}},[token]);
  useEffect(()=>{const path=window.location.pathname;const index=path.startsWith("/investir")?0:path.startsWith("/portefeuille")?1:path.startsWith("/bots")?2:-1;if(index<0)return;setDone(current=>{if(current.includes(index))return current;const next=[...current,index];try{scopedKey(token)&&localStorage.setItem(scopedKey(token),JSON.stringify(next))}catch{}return next})},[token]);
  if(dismissed||done.length===steps.length)return null;
  return <Card className="border-lime-400/20" >
    <div className="flex items-start justify-between gap-3"><div><div className="flex items-center gap-2 text-lime-300"><Compass size={18}/><h2 className="font-semibold">Votre guide de démarrage</h2></div><p className="mt-1 text-sm text-slate-400">{done.length} étape{done.length>1?"s":""} sur {steps.length} explorée{done.length>1?"s":""} · progression sur cet appareil uniquement</p></div><button type="button" aria-label="Masquer le guide" className="rounded-lg p-2 text-slate-400 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime-400" onClick={()=>{setDismissed(true);try{scopedKey(token)&&sessionStorage.setItem(scopedKey(token)+":dismissed","1")}catch{}}}><X size={18}/></button></div>
    <ol className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">{steps.map((step,index)=><li key={step.href}><a href={step.href} className="block h-full rounded-xl border border-white/10 p-3 transition-colors hover:border-lime-400/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime-400"><span className="flex items-center gap-2 text-sm font-semibold">{done.includes(index)?<CheckCircle2 className="text-lime-300" size={17}/>:<span className="grid h-5 w-5 place-items-center rounded-full border border-slate-500 text-xs">{index+1}</span>}{step.title}</span><span className="mt-2 block text-xs leading-5 text-slate-400">{step.description}</span></a></li>)}</ol>
  </Card>
}
