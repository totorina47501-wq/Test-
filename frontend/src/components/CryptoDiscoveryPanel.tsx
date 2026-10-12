import {useEffect,useMemo,useState} from "react";
import {useLanguage} from "../i18n";
import {Card} from "./ui";
type Discovery={symbol:string;name:string;category:string;mode:"discovery";tradable:false;botEligible:false};
export function CryptoDiscoveryPanel(){
 const {t}=useLanguage();
 const [assets,setAssets]=useState<Discovery[]>([]);
 const [error,setError]=useState("");
 const [search,setSearch]=useState("");
 const [category,setCategory]=useState("all");
 useEffect(()=>{const controller=new AbortController();fetch("/api/market/discovery",{signal:controller.signal}).then(r=>{if(!r.ok)throw Error("Catalogue indisponible");return r.json()}).then((data:{assets:Discovery[]})=>{if(!controller.signal.aborted)setAssets(data.assets)}).catch(e=>{if(!controller.signal.aborted&&e.name!=="AbortError")setError("Catalogue temporairement indisponible.")});return()=>controller.abort()},[]);
 const categories=useMemo(()=>["all",...new Set(assets.map(a=>a.category))], [assets]);
 const filtered=useMemo(()=>assets.filter(a=>(category==="all"||a.category===category)&&[a.symbol,a.name,a.category].join(" ").toLowerCase().includes(search.trim().toLowerCase())),[assets,category,search]);
 return <Card className="space-y-4" aria-label={t("researchHeading")}><div><h2 className="text-xl font-bold">{t("researchHeading")}</h2><p className="mt-1 text-sm text-slate-400">{t("disclaimer")}</p></div>
 <div className="flex flex-wrap gap-3"><input aria-label={t("search")} placeholder={t("search")} value={search} onChange={e=>setSearch(e.target.value)} className="min-w-0 flex-1 rounded-xl border border-white/15 bg-[#090b0e] px-3 py-2 text-white"/><select aria-label="Catégorie crypto" value={category} onChange={e=>setCategory(e.target.value)} className="rounded-xl border border-white/15 bg-[#090b0e] px-3 py-2 text-white">{categories.map(c=><option key={c} value={c}>{c==="all"?t("all"):c}</option>)}</select></div>
 {error&&<p role="alert" className="text-rose-300">{error}</p>}
 {!error&&filtered.length===0&&<p className="text-sm text-slate-400">{t("noResult")}</p>}
 <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">{filtered.map(asset=><div key={asset.symbol} className="rounded-xl border border-white/10 bg-white/[.03] p-3"><div className="flex items-center justify-between gap-2"><strong>{asset.symbol}</strong><span className="text-[10px] text-slate-400">{t("research")}</span></div><p className="mt-1 text-sm">{asset.name}</p><p className="mt-1 text-xs text-slate-500">{asset.category}</p></div>)}</div>
 <p className="text-xs text-slate-500">{t("beta")}</p></Card>
}
