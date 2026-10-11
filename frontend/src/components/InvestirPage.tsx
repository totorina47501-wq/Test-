import {useEffect,useMemo,useState} from "react";
import {ArrowLeft,ArrowRight,RefreshCw,TrendingDown,TrendingUp} from "lucide-react";
import {Area,AreaChart,ResponsiveContainer,Tooltip,XAxis,YAxis} from "recharts";
import {Badge,Button,Card} from "./ui";
import {useAuth} from "../auth/AuthContext";
import {submitSimulatedTrade,useInvestirMarket,useMarketDetail} from "../hooks/useInvestirMarket";

const ranges=[
  {id:"5m",label:"5 min"},
  {id:"1h",label:"1 h"},
  {id:"24h",label:"24 h"},
  {id:"7d",label:"7 jours"},
  {id:"30d",label:"30 jours"},
  {id:"1y",label:"1 an"},
  {id:"5y",label:"5 ans"}
];

const names:Record<string,string>={
  BTC:"Bitcoin",ETH:"Ethereum",SOL:"Solana",USDC:"USD Coin",LINK:"Chainlink",AVAX:"Avalanche"
};

const eur=(value:number)=>new Intl.NumberFormat("fr-FR",{style:"currency",currency:"EUR"}).format(value);
const compact=(value:number)=>new Intl.NumberFormat("fr-FR",{notation:"compact",maximumFractionDigits:1}).format(value);
const qty=(value:number)=>new Intl.NumberFormat("fr-FR",{maximumFractionDigits:8}).format(value);

export function InvestirPage({onBack,onAuth}:{onBack:()=>void;onAuth:()=>void}){
  const auth=useAuth();
  const market=useInvestirMarket();
  const [selected,setSelected]=useState("BTC");
  const [range,setRange]=useState("24h");
  const [amount,setAmount]=useState("500");
  const [side,setSide]=useState<"buy"|"sell">("buy");
  const [tradeState,setTradeState]=useState<"idle"|"submitting"|"success"|"error">("idle");
  const [tradeMessage,setTradeMessage]=useState("");
  const detail=useMarketDetail(selected,range);

  useEffect(()=>{
    if(market.status==="ready"&&market.data?.length&&!market.data.some(item=>item.symbol===selected)){
      setSelected(market.data[0].symbol);
    }
  },[market.status,market.data,selected]);

  const price=Number(detail.data?.price||market.data?.find(item=>item.symbol===selected)?.price||0);
  const numericAmount=Number(amount.replace(",","."));
  const estimated=Number.isFinite(numericAmount)&&numericAmount>0&&price>0?numericAmount/price:0;
  const chartData=useMemo(()=>{
    const points=detail.data?.history?.points;
    if(!Array.isArray(points))return [];
    const valid=points.map(point=>({timestamp:Number(point.timestamp),price:Number(point.price)}))
      .filter(point=>Number.isFinite(point.timestamp)&&point.timestamp>0&&Number.isFinite(point.price)&&point.price>0)
      .sort((a,b)=>a.timestamp-b.timestamp);
    return valid.filter((point,index)=>index===0||point.timestamp!==valid[index-1].timestamp);
  },[detail.data]);

  async function submitTrade(){
    if(!auth.token){onAuth();return}
    if(!Number.isFinite(numericAmount)||numericAmount<=0||!selected)return;
    setTradeState("submitting");setTradeMessage("");
    try{
      await submitSimulatedTrade(auth.token,side,selected,numericAmount);
      setTradeState("success");
      setTradeMessage(side==="buy"?"Ordre simulé enregistré":"Vente simulée enregistrée");
    }catch(error){
      setTradeState("error");
      setTradeMessage(error instanceof Error?error.message:"Impossible d’enregistrer l’ordre simulé.");
    }
  }

  return <main className="mx-auto max-w-7xl space-y-6 px-5 py-8">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <button type="button" onClick={onBack} className="mb-3 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white"><ArrowLeft size={16}/> Retour au cockpit</button>
        <div className="flex flex-wrap items-center gap-3"><Badge>Marchés · EUR</Badge><span className="text-xs text-slate-500">Simulation uniquement · aucun ordre réel</span></div>
        <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Investir</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Explorez les principaux marchés crypto, comparez les variations et simulez un achat avec les API BitGold existantes.</p>
      </div>
      <Button variant="secondary" onClick={market.reload}><RefreshCw size={16}/> Actualiser</Button>
    </div>

    {market.status==="loading"&&<Card aria-busy="true"><p role="status">Chargement des marchés…</p></Card>}
    {market.status==="error"&&<Card role="alert"><p className="text-rose-300">{market.error}</p><Button className="mt-4" onClick={market.reload}>Réessayer</Button></Card>}
    {market.status==="ready"&&market.data?.length===0&&<Card><p className="text-slate-400">Aucun marché disponible pour le moment.</p></Card>}

    {market.status==="ready"&&Boolean(market.data?.length)&&<>
      <section aria-label="Marchés crypto" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {market.data!.map(item=>{
          const positive=Number(item.change24h)>=0;
          const active=item.symbol===selected;
          return <button key={item.symbol} type="button" onClick={()=>{setSelected(item.symbol);setRange("24h");setTradeState("idle");setTradeMessage("")}} aria-pressed={active} className={`min-w-0 rounded-2xl border p-4 text-left transition-colors ${active?"border-emerald-400/40 bg-emerald-400/10":"border-white/10 bg-[#15171b]/95 hover:bg-white/5"}`}>
            <div className="flex items-center justify-between gap-2"><strong>{names[item.symbol]||item.symbol}</strong><span className="text-xs text-slate-500">{item.symbol}</span></div>
            <span className="mt-3 block text-lg font-bold">{eur(Number(item.price||0))}</span>
            <span className={`mt-1 flex items-center gap-1 text-xs ${positive?"text-emerald-300":"text-rose-300"}`}>{positive?<TrendingUp size={13}/>:<TrendingDown size={13}/>} {positive?"+":""}{Number(item.change24h||0).toFixed(2)} %</span>
          </button>;
        })}
      </section>

      <div className="grid gap-5 xl:grid-cols-[1.7fr_.8fr]">
        <Card>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[.18em] text-emerald-300">{selected} · détail marché</p>
              <h2 className="mt-2 text-2xl font-bold">{detail.data?.name||names[selected]||selected}</h2>
              <p className="mt-1 text-sm text-slate-400">Cours actuel {eur(price)}</p>
            </div>
            <div className="flex max-w-full flex-wrap gap-2" aria-label="Période du graphique">
              {ranges.map(item=><button key={item.id} type="button" onClick={()=>setRange(item.id)} aria-pressed={range===item.id} className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium ${range===item.id?"border-emerald-400/40 bg-emerald-400/15 text-emerald-300":"border-white/10 text-slate-400 hover:bg-white/5"}`}>{item.label}</button>)}
            </div>
          </div>

          {detail.status==="loading"&&<p role="status" className="py-20 text-center text-sm text-slate-400">Chargement du détail…</p>}
          {detail.status==="error"&&<div role="alert" className="py-12 text-center"><p className="text-sm text-rose-300">{detail.error||"Détail indisponible."}</p><Button className="mt-4" onClick={detail.reload}>Réessayer le graphique</Button></div>}
          {detail.status==="ready"&&chartData.length>1?<div className="mt-5 h-72 min-w-0" role="img" aria-label={`Courbe ${selected} ${range}`}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <XAxis dataKey="timestamp" type="number" domain={["dataMin","dataMax"]} tickFormatter={(value)=>new Date(Number(value)).toLocaleDateString("fr-FR",{day:"2-digit",month:"2-digit"})} tick={{fill:"#94a3b8",fontSize:11}}/>
                <YAxis domain={["auto","auto"]} tickFormatter={(value)=>eur(Number(value))} width={82} tick={{fill:"#94a3b8",fontSize:10}}/>
                <Tooltip labelFormatter={(value)=>new Date(Number(value)).toLocaleString("fr-FR")} formatter={(value:number)=>[eur(Number(value)),"Cours"]}/>
                <Area type="monotone" dataKey="price" stroke="#34d399" fill="#34d399" fillOpacity={.08}/>
              </AreaChart>
            </ResponsiveContainer>
          </div>:detail.status==="ready"?<p className="py-20 text-center text-sm text-slate-400">Historique insuffisant pour cette période.</p>:null}

          {detail.status==="ready"&&<div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-white/10 p-3"><p className="text-xs text-slate-500">Variation 24 h</p><p className={`mt-1 font-semibold ${Number(detail.data?.change24h||0)>=0?"text-emerald-300":"text-rose-300"}`}>{Number(detail.data?.change24h||0).toFixed(2)} %</p></div>
            <div className="rounded-xl border border-white/10 p-3"><p className="text-xs text-slate-500">Capitalisation</p><p className="mt-1 font-semibold">{detail.data?.marketCap?compact(Number(detail.data.marketCap))+" €":"—"}</p></div>
            <div className="rounded-xl border border-white/10 p-3"><p className="text-xs text-slate-500">Volume 24 h</p><p className="mt-1 font-semibold">{detail.data?.volume24h?compact(Number(detail.data.volume24h))+" €":"—"}</p></div>
          </div>}
        </Card>

        <Card className="h-fit">
          <p className="text-xs font-semibold uppercase tracking-[.18em] text-violet-300">Simulateur</p>
          <h2 className="mt-2 text-xl font-bold">Simuler une opération</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">L’ordre reste virtuel et utilise le moteur de trading simulé BitGold.</p>
          <div className="mt-4 grid grid-cols-2 gap-2" aria-label="Type d’opération">
            <button type="button" aria-pressed={side==="buy"} onClick={()=>{setSide("buy");setTradeState("idle");setTradeMessage("")}} className={`rounded-xl border px-3 py-2 text-sm font-semibold ${side==="buy"?"border-emerald-400/40 bg-emerald-400/15 text-emerald-300":"border-white/10 text-slate-400"}`}>Acheter</button>
            <button type="button" aria-pressed={side==="sell"} onClick={()=>{setSide("sell");setTradeState("idle");setTradeMessage("")}} className={`rounded-xl border px-3 py-2 text-sm font-semibold ${side==="sell"?"border-rose-400/40 bg-rose-400/15 text-rose-300":"border-white/10 text-slate-400"}`}>Vendre</button>
          </div>
          <label className="mt-5 block text-sm font-medium" htmlFor="invest-amount">Montant en euros</label>
          <div className="mt-2 flex items-center rounded-xl border border-white/15 bg-black/20 px-3">
            <span className="text-slate-500">€</span>
            <input id="invest-amount" aria-label="Montant en euros" inputMode="decimal" value={amount} onChange={event=>{setAmount(event.target.value);setTradeState("idle");setTradeMessage("")}} className="min-w-0 flex-1 bg-transparent px-3 py-3 text-base outline-none" />
          </div>
          <div className="mt-4 rounded-xl bg-white/5 p-4">
            <p className="text-xs text-slate-500">Estimation au cours affiché</p>
            <p className="mt-1 text-lg font-semibold">≈ {qty(estimated)} {selected}</p>
            <p className="mt-1 text-xs text-slate-500">{price>0?eur(price)+" / "+selected:"Cours indisponible"}</p>
          </div>
          <Button className="mt-5 w-full" disabled={tradeState==="submitting"||!estimated} onClick={submitTrade}>{tradeState==="submitting"?"Enregistrement…":auth.token?(side==="buy"?"Acheter en simulation":"Vendre en simulation"):"Se connecter pour simuler"} <ArrowRight size={16}/></Button>
          {tradeMessage&&<p role={tradeState==="error"?"alert":"status"} className={`mt-3 text-sm ${tradeState==="error"?"text-rose-300":"text-emerald-300"}`}>{tradeMessage}</p>}
          <p className="mt-4 text-xs leading-5 text-slate-500">Aucun actif réel n’est acheté. Cette action modifie uniquement votre portefeuille de simulation.</p>
        </Card>
      </div>
    </>}
  </main>;
}
