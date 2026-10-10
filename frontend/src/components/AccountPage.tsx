import {useEffect,useMemo,useState} from "react";
import {Activity,ArrowLeft,Bot,RefreshCw,ShieldCheck,Wallet} from "lucide-react";
import {Badge,Button,Card} from "./ui";
import {useAuth} from "../auth/AuthContext";
import {activateBot,deactivateBot,useAccountData,type BotDefinition,type BotSubscription} from "../hooks/useAccountData";

type Tab="portfolio"|"activity"|"bots";
const eur=(value:number)=>new Intl.NumberFormat("fr-FR",{style:"currency",currency:"EUR"}).format(value);
const date=(value:string)=>new Date(value).toLocaleString("fr-FR");

function Loading({label}:{label:string}){return <Card aria-busy="true"><p role="status" className="text-slate-400">Chargement de {label}…</p></Card>}
function ErrorBox({message}:{message?:string}){return <Card role="alert"><p className="text-rose-300">{message||"Données indisponibles."}</p></Card>}

function PortfolioView({data}:{data:ReturnType<typeof useAccountData>["portfolio"]["data"]}){
  if(!data)return null;
  return <section className="space-y-4">
    <div><Badge>Simulation</Badge><h1 className="mt-3 text-3xl font-bold">Portefeuille</h1><p className="mt-2 text-sm text-slate-400">Votre patrimoine virtuel BitGold, valorisé en euros.</p></div>
    <div className="grid gap-3 sm:grid-cols-3">
      <Card><p className="text-sm text-slate-400">Solde total</p><p className="mt-2 text-2xl font-bold">{eur(Number(data.total||0))}</p></Card>
      <Card><p className="text-sm text-slate-400">Liquidités</p><p className="mt-2 text-2xl font-bold">{eur(Number(data.cash||0))}</p></Card>
      <Card><p className="text-sm text-slate-400">Investi</p><p className="mt-2 text-2xl font-bold">{eur(Number(data.invested||0))}</p></Card>
    </div>
    <Card>
      <h2 className="text-lg font-semibold">Positions</h2>
      {data.positions?.length?<div className="mt-4 space-y-3">{data.positions.map(position=><div key={position.asset} className="grid grid-cols-[1fr_auto] gap-3 border-b border-white/10 pb-3">
        <div><p className="font-semibold">{position.asset}</p><p className="text-xs text-slate-500">{Number(position.quantity).toLocaleString("fr-FR",{maximumFractionDigits:8})} unités · {Number(position.allocation||0).toFixed(1)} %</p></div>
        <div className="text-right"><p className="font-semibold">{eur(Number(position.value||0))}</p><p className="text-xs text-slate-500">{eur(Number(position.price||0))} / unité</p></div>
      </div>)}</div>:<p className="mt-5 text-sm text-slate-400">Aucune position ouverte.</p>}
    </Card>
    {data.integrity?.ok===false&&<p role="alert" className="text-sm text-rose-300">Contrôle de cohérence du portefeuille non concluant.</p>}
  </section>;
}

function ActivityView({data}:{data:ReturnType<typeof useAccountData>["activity"]["data"]}){
  if(!data)return null;
  return <section className="space-y-4">
    <div><Badge>Journal</Badge><h1 className="mt-3 text-3xl font-bold">Activités</h1><p className="mt-2 text-sm text-slate-400">Transactions et décisions des bots de votre environnement de simulation.</p></div>
    <div className="grid gap-4 lg:grid-cols-2">
      <Card><h2 className="text-lg font-semibold">Transactions</h2>{data.trades?.length?<div className="mt-4 space-y-3">{data.trades.map((trade,index)=><div key={`${trade.created_at}-${index}`} className="border-b border-white/10 pb-3"><div className="flex items-center justify-between gap-3"><p className="font-medium">{trade.side==="buy"?"Achat":"Vente"} {trade.asset}</p><p className={trade.side==="buy"?"text-emerald-300":"text-rose-300"}>{eur(Number(trade.amount_eur||0))}</p></div><p className="mt-1 text-xs text-slate-500">{date(trade.created_at)} · {eur(Number(trade.price_eur||0))} / unité</p></div>)}</div>:<p className="mt-5 text-sm text-slate-400">Aucune transaction.</p>}</Card>
      <Card><h2 className="text-lg font-semibold">Logs bots</h2>{data.botLogs?.length?<div className="mt-4 space-y-3">{data.botLogs.map((log,index)=><div key={`${log.created_at}-${index}`} className="border-b border-white/10 pb-3"><div className="flex items-center justify-between gap-3"><p className="font-medium">{log.bot_type}</p><Badge>{log.action}</Badge></div><p className="mt-2 text-sm text-slate-300">{log.message}</p><p className="mt-1 text-xs text-slate-500">{date(log.created_at)}</p></div>)}</div>:<p className="mt-5 text-sm text-slate-400">Aucun log bot.</p>}</Card>
    </div>
  </section>;
}

function StrategyCompare({bots}:{bots:BotDefinition[]}){
  const focus=bots.filter(bot=>["shield","silver","gold"].includes(bot.id));
  return <Card>
    <h2 className="text-xl font-bold">Comparateur de stratégies</h2>
    <p className="mt-2 text-sm text-slate-400">Comparez le niveau de risque, l’allocation cible et l’univers d’actifs avant d’activer un bot.</p>
    <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[620px] text-left text-sm"><thead className="text-slate-500"><tr><th className="py-2">Bot</th><th>Risque</th><th>Allocation</th><th>Stratégie</th><th>Actifs</th></tr></thead><tbody>{focus.map(bot=><tr key={bot.id} className="border-t border-white/10"><td className="py-3 font-semibold">{bot.name}</td><td>{bot.risk}</td><td>{bot.allocation} %</td><td>{bot.strategy}</td><td>{bot.compatible_assets?.join(", ")}</td></tr>)}</tbody></table></div>
  </Card>;
}

function BotConfig({bot,subscription,token,onDone,onCancel}:{bot:BotDefinition;subscription?:BotSubscription;token:string;onDone:(message:string)=>void;onCancel:()=>void}){
  const [maxTrade,setMaxTrade]=useState(String(subscription?.max_trade_eur??(bot.id==="shield"?250:1000)));
  const [maxPosition,setMaxPosition]=useState(String(subscription?.max_position_eur??5000));
  const [stopLoss,setStopLoss]=useState(String(subscription?.stop_loss_pct??5));
  const [minCash,setMinCash]=useState(String(subscription?.min_cash_pct??20));
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  async function activate(){
    setBusy(true);setError("");
    try{
      await activateBot(token,{botType:bot.id,maxTradeEur:Number(maxTrade),maxPositionEur:Number(maxPosition),stopLossPct:Number(stopLoss),minCashPct:Number(minCash)});
      onDone(`${bot.name} activé en simulation`);
    }catch(e){setError(e instanceof Error?e.message:"Activation impossible.");setBusy(false)}
  }
  async function remove(){
    setBusy(true);setError("");
    try{await deactivateBot(token,bot.id);onDone(`${bot.name} désactivé`)}catch(e){setError(e instanceof Error?e.message:"Désactivation impossible.");setBusy(false)}
  }
  return <Card className="border-violet-400/20">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><Badge>{bot.tier}</Badge><h3 className="mt-2 text-xl font-bold">Configurer {bot.name}</h3><p className="mt-1 text-sm text-slate-400">{bot.summary}</p></div><button type="button" onClick={onCancel} className="text-sm text-slate-400 hover:text-white">Fermer</button></div>
    <div className="mt-5 grid gap-3 sm:grid-cols-2">
      <label className="text-sm">Limite par ordre<input aria-label="Limite par ordre" value={maxTrade} onChange={e=>setMaxTrade(e.target.value)} inputMode="decimal" className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 outline-none focus:border-emerald-400/50"/></label>
      <label className="text-sm">Position maximale<input aria-label="Position maximale" value={maxPosition} onChange={e=>setMaxPosition(e.target.value)} inputMode="decimal" className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 outline-none focus:border-emerald-400/50"/></label>
      <label className="text-sm">Stop loss (%)<input aria-label="Stop loss" value={stopLoss} onChange={e=>setStopLoss(e.target.value)} inputMode="decimal" className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 outline-none focus:border-emerald-400/50"/></label>
      <label className="text-sm">Cash minimum (%)<input aria-label="Cash minimum" value={minCash} onChange={e=>setMinCash(e.target.value)} inputMode="decimal" className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 outline-none focus:border-emerald-400/50"/></label>
    </div>
    <div className="mt-5 flex flex-wrap gap-3"><Button disabled={busy} onClick={activate}>{busy?"Enregistrement…":`Activer ${bot.name}`}</Button>{subscription?.active&&<Button variant="secondary" disabled={busy} onClick={remove}>Désactiver</Button>}</div>
    {error&&<p role="alert" className="mt-3 text-sm text-rose-300">{error}</p>}
  </Card>;
}

function BotsView({data,token,reload}:{data:ReturnType<typeof useAccountData>["bots"]["data"];token:string;reload:()=>void}){
  const [selected,setSelected]=useState<BotDefinition|null>(null);
  const [message,setMessage]=useState("");
  const subscriptions=useMemo(()=>new Map((data?.items||[]).map(item=>[item.bot_type,item])),[data]);
  if(!data)return null;
  const done=(value:string)=>{setMessage(value);setSelected(null);reload()};
  return <section className="space-y-4">
    <div className="flex flex-wrap items-end justify-between gap-3"><div><Badge>Plan {data.plan?.plan||"free"}</Badge><h1 className="mt-3 text-3xl font-bold">Bots IA</h1><p className="mt-2 text-sm text-slate-400">Choisissez une stratégie, ajustez ses garde-fous et activez-la uniquement dans votre portefeuille de simulation.</p></div></div>
    {message&&<Card><p role="status" className="text-emerald-300">{message}</p></Card>}
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{data.catalog?.map(bot=>{const sub=subscriptions.get(bot.id);return <Card key={bot.id} className="flex flex-col">
      <div className="flex items-center justify-between gap-3"><Badge>{bot.tier}</Badge>{sub?.active?<span className="inline-flex items-center gap-1 text-xs text-emerald-300"><ShieldCheck size={14}/> Actif</span>:<span className="text-xs text-slate-500">{bot.plan==="free"?"Free":"Pro"}</span>}</div>
      <h2 className="mt-4 text-xl font-bold">{bot.name}</h2><p className="mt-2 text-sm text-slate-400">{bot.summary}</p>
      <div className="mt-4 space-y-1 text-xs text-slate-500"><p>Risque : {bot.risk}</p><p>Allocation cible : {bot.allocation} %</p><p>Actifs : {bot.compatible_assets?.join(", ")}</p>{sub&&<p>Limite ordre : {eur(Number(sub.max_trade_eur||0))}</p>}</div>
      <Button variant="secondary" className="mt-5" onClick={()=>setSelected(bot)} aria-label={`Configurer ${bot.name}`}>Configurer</Button>
    </Card>})}</div>
    {selected&&<BotConfig bot={selected} subscription={subscriptions.get(selected.id)} token={token} onDone={done} onCancel={()=>setSelected(null)}/>}
    <StrategyCompare bots={data.catalog||[]}/>
  </section>;
}

export function AccountPage({initialTab="portfolio",onBack}:{initialTab?:Tab;onBack:()=>void}){
  const auth=useAuth();
  const [tab,setTab]=useState<Tab>(initialTab);
  const {portfolio,activity,bots,reload}=useAccountData(auth.token);
  useEffect(()=>setTab(initialTab),[initialTab]);
  if(!auth.token)return <main className="mx-auto max-w-7xl px-5 py-8"><Card><h1 className="text-2xl font-bold">Connexion requise</h1><p className="mt-2 text-slate-400">Connectez-vous pour accéder à votre espace privé.</p></Card></main>;
  return <main className="mx-auto max-w-7xl space-y-6 px-5 py-8">
    <div className="flex flex-wrap items-center justify-between gap-3"><button type="button" onClick={onBack} className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white"><ArrowLeft size={16}/> Retour au cockpit</button><Button variant="secondary" onClick={reload}><RefreshCw size={16}/> Actualiser</Button></div>
    <nav aria-label="Espace connecté" className="flex max-w-full flex-wrap gap-2 rounded-2xl border border-white/10 bg-[#15171b]/80 p-2">
      <button type="button" onClick={()=>setTab("portfolio")} aria-pressed={tab==="portfolio"} className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm ${tab==="portfolio"?"bg-emerald-400/15 text-emerald-300":"text-slate-400"}`}><Wallet size={16}/> Portefeuille</button>
      <button type="button" onClick={()=>setTab("activity")} aria-pressed={tab==="activity"} className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm ${tab==="activity"?"bg-emerald-400/15 text-emerald-300":"text-slate-400"}`}><Activity size={16}/> Activités</button>
      <button type="button" onClick={()=>setTab("bots")} aria-pressed={tab==="bots"} className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm ${tab==="bots"?"bg-emerald-400/15 text-emerald-300":"text-slate-400"}`}><Bot size={16}/> Bots IA</button>
    </nav>
    {tab==="portfolio"&&(portfolio.status==="loading"?<Loading label="votre portefeuille"/>:portfolio.status==="error"?<ErrorBox message={portfolio.error}/>:<PortfolioView data={portfolio.data}/>)}
    {tab==="activity"&&(activity.status==="loading"?<Loading label="vos activités"/>:activity.status==="error"?<ErrorBox message={activity.error}/>:<ActivityView data={activity.data}/>)}
    {tab==="bots"&&(bots.status==="loading"?<Loading label="vos bots"/>:bots.status==="error"?<ErrorBox message={bots.error}/>:<BotsView data={bots.data} token={auth.token} reload={reload}/>)}
    <p className="text-center text-xs text-slate-500">Simulation uniquement · aucun ordre ou investissement réel.</p>
  </main>;
}
