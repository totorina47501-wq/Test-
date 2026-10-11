import {useEffect,useState} from "react";
import {CheckCircle2,Compass,X} from "lucide-react";
import {Card} from "./ui";

const KEY="bitgold:react-onboarding:v1";
const steps=[
  {title:"Explorer les marchés",href:"/investir",description:"Consultez les prix avant toute simulation."},
  {title:"Consulter mon portefeuille",href:"/portefeuille",description:"Retrouvez vos liquidités et positions virtuelles."},
  {title:"Découvrir les bots",href:"/bots",description:"Comparez les stratégies et leurs risques."}
];
function readProgress():number[]{try{const value=JSON.parse(localStorage.getItem(KEY)||"[]");return Array.isArray(value)?value.filter((v):v is number=>Number.isInteger(v)&&v>=0&&v<steps.length):[]}catch{return []}}
export function ReactOnboarding(){
  const [done,setDone]=useState<number[]>(readProgress);
  const [dismissed,setDismissed]=useState(()=>{try{return sessionStorage.getItem(KEY+":dismissed")==="1"}catch{return false}});
  useEffect(()=>{const path=window.location.pathname;const index=path.startsWith("/investir")?0:path.startsWith("/portefeuille")?1:path.startsWith("/bots")?2:-1;if(index<0)return;setDone(current=>{if(current.includes(index))return current;const next=[...current,index];try{localStorage.setItem(KEY,JSON.stringify(next))}catch{}return next})},[]);
  if(dismissed||done.length===steps.length)return null;
  return <Card className="border-emerald-400/20" >
    <div className="flex items-start justify-between gap-3"><div><div className="flex items-center gap-2 text-emerald-300"><Compass size={18}/><h2 className="font-semibold">Votre guide de démarrage</h2></div><p className="mt-1 text-sm text-slate-400">{done.length} étape{done.length>1?"s":""} sur {steps.length} explorée{done.length>1?"s":""} · progression sur cet appareil uniquement</p></div><button type="button" aria-label="Masquer le guide" className="rounded-lg p-2 text-slate-400 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-400" onClick={()=>{setDismissed(true);try{sessionStorage.setItem(KEY+":dismissed","1")}catch{}}}><X size={18}/></button></div>
    <ol className="mt-4 grid gap-3 md:grid-cols-3">{steps.map((step,index)=><li key={step.href}><a href={step.href} className="block h-full rounded-xl border border-white/10 p-3 transition-colors hover:border-emerald-400/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-400"><span className="flex items-center gap-2 text-sm font-semibold">{done.includes(index)?<CheckCircle2 className="text-emerald-300" size={17}/>:<span className="grid h-5 w-5 place-items-center rounded-full border border-slate-500 text-xs">{index+1}</span>}{step.title}</span><span className="mt-2 block text-xs leading-5 text-slate-400">{step.description}</span></a></li>)}</ol>
  </Card>
}
