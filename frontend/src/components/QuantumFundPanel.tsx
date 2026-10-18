import {useLanguage} from "../i18n";
import {useState} from "react";
import {Bar,BarChart,CartesianGrid,Legend,ResponsiveContainer,Tooltip,XAxis,YAxis} from "recharts";
import {useAuth} from "../auth/AuthContext";
import {Badge,Button,Card} from "./ui";

type Metrics={returnPct:number;maxDrawdownPct:number;sharpe:number;sortino:number};
type Comparison={trainPoints:number;testPoints:number;strategies:{single:Metrics&{agent:string};equalWeight:Metrics;quantumFund:Metrics&{weights:Record<string,number>}};simulationOnly:boolean;warning:string};
type Response={comparison?:Comparison;error?:string;days?:number};
const quantumCopy={"fr":{"research":"Recherche · Simulation","history":"Historique","days":"jours","busy":"Comparaison…","compare":"Comparer les modèles","single":"Agent unique","equal":"Multi-agents égaux","net":"Rendement net","returns":"Rendement","drawdown":"Drawdown max","architecture":"Architecture","sample":"Échantillon","training":"observations d'entraînement","testing":"observations de test hors échantillon. Les rendements sont nets des frais de rééquilibrage simulés.","login":"Connexion requise.","minimum":"Deux bots minimum sont nécessaires.","expired":"Session expirée.","unavailable":"Analyse indisponible.","period":"Période Quantum Fund","chart":"Graphique de comparaison des rendements simulés et des drawdowns"},"en":{"research":"Research · Simulation","history":"History","days":"days","busy":"Comparing…","compare":"Compare models","single":"Single agent","equal":"Equal-weight agents","net":"Net return","returns":"Return","drawdown":"Max drawdown","architecture":"Architecture","sample":"Sample","training":"training observations","testing":"out-of-sample test observations. Returns include simulated rebalancing fees.","login":"Sign-in required.","minimum":"At least two bots are required.","expired":"Session expired.","unavailable":"Analysis unavailable.","period":"Quantum Fund period","chart":"Chart comparing simulated returns and drawdowns"},"es":{"research":"Investigación · Simulación","history":"Historial","days":"días","busy":"Comparando…","compare":"Comparar modelos","single":"Agente único","equal":"Agentes con igual peso","net":"Rendimiento neto","returns":"Rendimiento","drawdown":"Caída máxima","architecture":"Arquitectura","sample":"Muestra","training":"observaciones de entrenamiento","testing":"observaciones de prueba fuera de muestra. Los rendimientos incluyen comisiones de rebalanceo simuladas.","login":"Debes iniciar sesión.","minimum":"Se necesitan al menos dos bots.","expired":"Sesión caducada.","unavailable":"Análisis no disponible.","period":"Período de Quantum Fund","chart":"Gráfico comparativo de rendimientos simulados y caídas máximas"}} as const;
const display=(n:number,locale:string)=>Number.isFinite(n)?n.toLocaleString(locale,{minimumFractionDigits:2,maximumFractionDigits:2}):"—";
export function QuantumFundPanel({botIds,onExpired}:{botIds:string[];onExpired:()=>void}){const {t,language}=useLanguage();const copy=quantumCopy[language==="en"||language==="es"?language:"fr"];const locale=language==="en"?"en-GB":language==="es"?"es-ES":"fr-FR";
  const auth=useAuth();
  const [days,setDays]=useState(90);
  const [loading,setLoading]=useState(false);
  const [data,setData]=useState<Comparison|null>(null);
  const [error,setError]=useState("");
  async function run(){
    if(!auth.token){setError(copy.login);return}
    setLoading(true);setData(null);setError("");
    try{
      const bots=[...new Set(botIds)].slice(0,6);
      if(bots.length<2)throw new Error(copy.minimum);
      const params=new URLSearchParams({days:String(days),bots:bots.join(",")});
      const response=await fetch("/api/bots/quantum-fund?"+params.toString(),{headers:{Authorization:"Bearer "+auth.token,Accept:"application/json"}});
      if(response.status===401){onExpired();throw new Error(copy.expired)}
      const body=await response.json().catch(()=>({})) as Response;
      if(!response.ok||!body.comparison)throw new Error(body.error||copy.unavailable);
      setData(body.comparison);
    }catch(e){setError(e instanceof Error?e.message:"Analyse indisponible.")}
    finally{setLoading(false)}
  }
  const rows=data?[
    {name:copy.single,...data.strategies.single},
    {name:copy.equal,...data.strategies.equalWeight},
    {name:"Quantum Fund",...data.strategies.quantumFund}
  ]:[];

  return <Card>
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div><Badge>{copy.research}</Badge><h2 className="mt-2 text-xl font-semibold">BitGold Quantum Fund</h2><p className="mt-1 max-w-2xl text-sm text-slate-400">{t("quantumCompare")}</p></div>
      <div className="flex items-end gap-2"><label className="text-xs text-slate-400">{copy.history}<select aria-label={copy.period} className="mt-1 block rounded-lg border border-white/20 bg-[#15171b] px-3 py-2 text-white" value={days} onChange={e=>setDays(Number(e.target.value))}><option value={30}>30 {copy.days}</option><option value={90}>90 {copy.days}</option><option value={180}>180 {copy.days}</option></select></label><Button disabled={loading||botIds.length<2} onClick={run}>{loading?copy.busy:copy.compare}</Button></div>
    </div>
    {error&&<p role="alert" className="mt-4 text-sm text-rose-300">{error}</p>}
    {data&&<div className="mt-5 space-y-5">
      <p className="text-xs text-slate-400">{copy.sample}: {data.trainPoints} {copy.training} · {data.testPoints} {copy.testing}</p>
      <div className="h-64 w-full" role="img" aria-label={copy.chart}>
        <ResponsiveContainer width="100%" height="100%"><BarChart data={rows} margin={{top:10,right:12,left:0,bottom:5}}><CartesianGrid strokeDasharray="3 3" stroke="#334155"/><XAxis dataKey="name" tick={{fill:"#cbd5e1",fontSize:11}}/><YAxis tick={{fill:"#cbd5e1",fontSize:11}} unit=" %"/><Tooltip formatter={(value:number,name:string)=>[display(Number(value),locale)+" %",name==="returnPct"?copy.returns:copy.drawdown]}/><Legend formatter={value=>value==="returnPct"?copy.net+" (%)":copy.drawdown+" (%)"}/><Bar dataKey="returnPct" fill="#c8ff2e" name="returnPct"/><Bar dataKey="maxDrawdownPct" fill="#fb7185" name="maxDrawdownPct"/></BarChart></ResponsiveContainer>
      </div>
      <div className="overflow-x-auto"><table className="w-full min-w-[560px] text-left text-sm"><caption className="pb-2 text-left text-xs text-slate-400">{t("comparisonResults")}</caption><thead><tr className="border-b border-white/10 text-slate-400"><th className="py-2">{copy.architecture}</th><th>{copy.net}</th><th>{copy.drawdown}</th><th>Sharpe</th><th>Sortino</th></tr></thead><tbody>{rows.map(row=><tr key={row.name} className="border-b border-white/10"><th className="py-3">{row.name}</th><td>{display(row.returnPct,locale)} %</td><td>{display(row.maxDrawdownPct,locale)} %</td><td>{display(row.sharpe,locale)}</td><td>{display(row.sortino,locale)}</td></tr>)}</tbody></table></div>
      <div className="rounded-xl border border-white/10 bg-white/5 p-4"><h3 className="text-sm font-semibold">{t("experimentalAllocation")}</h3><div className="mt-3 flex flex-wrap gap-3">{Object.entries(data.strategies.quantumFund.weights).map(([id,weight])=><span key={id} className="rounded-lg border border-white/15 px-3 py-2 text-xs">{id} · {display(weight*100,locale)} %</span>)}</div><p className="mt-2 text-xs text-slate-400">{t("quantumCash")}</p></div>
    </div>}
    <p className="mt-4 text-xs text-slate-500">{t("quantumCaution")}</p>
  </Card>;
}
