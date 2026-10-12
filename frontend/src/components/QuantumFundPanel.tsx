import {useState} from "react";
import {Bar,BarChart,CartesianGrid,Legend,ResponsiveContainer,Tooltip,XAxis,YAxis} from "recharts";
import {useAuth} from "../auth/AuthContext";
import {Badge,Button,Card} from "./ui";

type Metrics={returnPct:number;maxDrawdownPct:number;sharpe:number;sortino:number};
type Comparison={trainPoints:number;testPoints:number;strategies:{single:Metrics&{agent:string};equalWeight:Metrics;quantumFund:Metrics&{weights:Record<string,number>}};simulationOnly:boolean;warning:string};
type Response={comparison?:Comparison;error?:string;days?:number};
const display=(n:number)=>Number.isFinite(n)?n.toLocaleString("fr-FR",{minimumFractionDigits:2,maximumFractionDigits:2}):"—";
export function QuantumFundPanel({botIds,onExpired}:{botIds:string[];onExpired:()=>void}){
  const auth=useAuth();
  const [days,setDays]=useState(90);
  const [loading,setLoading]=useState(false);
  const [data,setData]=useState<Comparison|null>(null);
  const [error,setError]=useState("");
  async function run(){
    if(!auth.token){setError("Connexion requise.");return}
    setLoading(true);setData(null);setError("");
    try{
      const bots=[...new Set(botIds)].slice(0,6);
      if(bots.length<2)throw new Error("Deux bots minimum sont nécessaires.");
      const params=new URLSearchParams({days:String(days),bots:bots.join(",")});
      const response=await fetch("/api/bots/quantum-fund?"+params.toString(),{headers:{Authorization:"Bearer "+auth.token,Accept:"application/json"}});
      if(response.status===401){onExpired();throw new Error("Session expirée.")}
      const body=await response.json().catch(()=>({})) as Response;
      if(!response.ok||!body.comparison)throw new Error(body.error||"Analyse indisponible.");
      setData(body.comparison);
    }catch(e){setError(e instanceof Error?e.message:"Analyse indisponible.")}
    finally{setLoading(false)}
  }
  const rows=data?[
    {name:"Agent unique",...data.strategies.single},
    {name:"Multi-agents égaux",...data.strategies.equalWeight},
    {name:"Quantum Fund",...data.strategies.quantumFund}
  ]:[];

  return <Card>
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div><Badge>Recherche · Simulation</Badge><h2 className="mt-2 text-xl font-semibold">BitGold Quantum Fund</h2><p className="mt-1 max-w-2xl text-sm text-slate-400">Confronte un agent unique, plusieurs agents équipondérés et une allocation Quantum Fund sur une période de test séparée de l'entraînement.</p></div>
      <div className="flex items-end gap-2"><label className="text-xs text-slate-400">Historique<select aria-label="Période Quantum Fund" className="mt-1 block rounded-lg border border-white/20 bg-[#15171b] px-3 py-2 text-white" value={days} onChange={e=>setDays(Number(e.target.value))}><option value={30}>30 jours</option><option value={90}>90 jours</option><option value={180}>180 jours</option></select></label><Button disabled={loading||botIds.length<2} onClick={run}>{loading?"Comparaison…":"Comparer les modèles"}</Button></div>
    </div>
    {error&&<p role="alert" className="mt-4 text-sm text-rose-300">{error}</p>}
    {data&&<div className="mt-5 space-y-5">
      <p className="text-xs text-slate-400">Échantillon : {data.trainPoints} observations d'entraînement · {data.testPoints} observations de test hors échantillon. Les rendements sont nets des frais de rééquilibrage simulés.</p>
      <div className="h-64 w-full" role="img" aria-label="Graphique de comparaison des rendements simulés et des drawdowns">
        <ResponsiveContainer width="100%" height="100%"><BarChart data={rows} margin={{top:10,right:12,left:0,bottom:5}}><CartesianGrid strokeDasharray="3 3" stroke="#334155"/><XAxis dataKey="name" tick={{fill:"#cbd5e1",fontSize:11}}/><YAxis tick={{fill:"#cbd5e1",fontSize:11}} unit=" %"/><Tooltip formatter={(value:number,name:string)=>[display(Number(value))+" %",name==="returnPct"?"Rendement":"Drawdown max"]}/><Legend formatter={value=>value==="returnPct"?"Rendement net (%)":"Drawdown max (%)"}/><Bar dataKey="returnPct" fill="#c8ff2e" name="returnPct"/><Bar dataKey="maxDrawdownPct" fill="#fb7185" name="maxDrawdownPct"/></BarChart></ResponsiveContainer>
      </div>
      <div className="overflow-x-auto"><table className="w-full min-w-[560px] text-left text-sm"><caption className="pb-2 text-left text-xs text-slate-400">Résultats comparatifs sur la période de test uniquement.</caption><thead><tr className="border-b border-white/10 text-slate-400"><th className="py-2">Architecture</th><th>Rendement net</th><th>Drawdown max</th><th>Sharpe</th><th>Sortino</th></tr></thead><tbody>{rows.map(row=><tr key={row.name} className="border-b border-white/10"><th className="py-3">{row.name}</th><td>{display(row.returnPct)} %</td><td>{display(row.maxDrawdownPct)} %</td><td>{display(row.sharpe)}</td><td>{display(row.sortino)}</td></tr>)}</tbody></table></div>
      <div className="rounded-xl border border-white/10 bg-white/5 p-4"><h3 className="text-sm font-semibold">Allocation expérimentale Quantum Fund</h3><div className="mt-3 flex flex-wrap gap-3">{Object.entries(data.strategies.quantumFund.weights).map(([id,weight])=><span key={id} className="rounded-lg border border-white/15 px-3 py-2 text-xs">{id} · {display(weight*100)} %</span>)}</div><p className="mt-2 text-xs text-slate-400">Les proportions non allouées restent en liquidités simulées.</p></div>
    </div>}
    <p className="mt-4 text-xs text-slate-500">Étude exploratoire sur les courbes de backtests BitGold, limitées à leurs 200 dernières observations. La sélection de stratégies peut surapprendre. Résultats ni prédictifs ni garantis ; aucun ordre réel n'est exécuté.</p>
  </Card>;
}
