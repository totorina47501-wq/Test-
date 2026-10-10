import type {ButtonHTMLAttributes,HTMLAttributes,ReactNode} from "react";
import {useRef,useState,type KeyboardEvent} from "react";
type ButtonProps=ButtonHTMLAttributes<HTMLButtonElement>&{variant?:"primary"|"secondary"|"ghost";children:ReactNode};
export function Button({variant="primary",className="",children,...props}:ButtonProps){const variants={primary:"bg-emerald-400 text-slate-950 hover:bg-emerald-300",secondary:"border border-white/15 bg-white/10 text-white hover:bg-white/15",ghost:"text-slate-300 hover:bg-white/10"};return <button className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400 disabled:opacity-50 ${variants[variant]} ${className}`} {...props}>{children}</button>}
export function Card({className="",children,...props}:HTMLAttributes<HTMLElement>){return <section className={`rounded-2xl border border-white/10 bg-[#15171b]/95 p-5 shadow-[0_18px_48px_rgba(0,0,0,.18)] ${className}`} {...props}>{children}</section>}
export function Badge({children,className=""}:{children:ReactNode;className?:string}){return <span className={`inline-flex rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-xs font-medium text-emerald-300 ${className}`}>{children}</span>}
export function Tabs({tabs,initial}:{tabs:{id:string;label:string;content:ReactNode}[];initial?:string}){
  const [active,setActive]=useState(initial??tabs[0]?.id);
  const tabRefs=useRef<(HTMLButtonElement|null)[]>([]);
  function onTabKeyDown(event:KeyboardEvent<HTMLButtonElement>,index:number){
    if(!tabs.length)return;
    let next=index;
    if(event.key==="ArrowRight")next=(index+1)%tabs.length;
    else if(event.key==="ArrowLeft")next=(index-1+tabs.length)%tabs.length;
    else if(event.key==="Home")next=0;
    else if(event.key==="End")next=tabs.length-1;
    else return;
    event.preventDefault();
    setActive(tabs[next].id);
    tabRefs.current[next]?.focus();
  }
  return <div>
    <div role="tablist" aria-label="Sélection de vue" aria-orientation="horizontal" className="flex flex-wrap gap-2 border-b border-white/10 pb-3">
      {tabs.map((tab,index)=><button key={tab.id} ref={node=>{tabRefs.current[index]=node}} type="button" role="tab" id={`tab-${tab.id}`} aria-selected={active===tab.id} aria-controls={`panel-${tab.id}`} tabIndex={active===tab.id?0:-1} onKeyDown={event=>onTabKeyDown(event,index)} onClick={()=>setActive(tab.id)} className={`rounded-lg px-3 py-2 text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400 ${active===tab.id?"bg-emerald-400/15 text-emerald-300":"text-slate-400 hover:bg-white/5 hover:text-white"}`}>{tab.label}</button>)}
    </div>
    {tabs.map(tab=><div key={tab.id} role="tabpanel" id={`panel-${tab.id}`} aria-labelledby={`tab-${tab.id}`} tabIndex={0} hidden={active!==tab.id} className="pt-4">{tab.content}</div>)}
  </div>;
}
