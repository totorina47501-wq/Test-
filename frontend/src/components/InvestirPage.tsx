import {CryptoAssetMark} from "./CryptoAssetMark";
import {CryptoDiscoveryPanel} from "./CryptoDiscoveryPanel";
import {useLanguage} from "../i18n";
import {ReactOnboarding} from "./ReactOnboarding";
import {useEffect,useMemo,useRef,useState} from "react";
import {ArrowLeft,ArrowRight,RefreshCw,TrendingDown,TrendingUp} from "lucide-react";
import {Area,AreaChart,ResponsiveContainer,Tooltip,XAxis,YAxis} from "recharts";
import {Badge,Button,Card} from "./ui";
import {useAuth} from "../auth/AuthContext";
import {TradeSessionExpiredError,submitSimulatedTrade,useInvestirMarket,useMarketDetail} from "../hooks/useInvestirMarket";
import {notifyTradeCompleted} from "../hooks/tradeEvents";

const ranges=[
  {id:"5m",label:"5 min"},
  {id:"1h",label:"1 h"},
  {id:"24h",label:"24 h"},
  {id:"7d",label:"7d"},
  {id:"30d",label:"30d"},
  {id:"1y",label:"1y"},
  {id:"5y",label:"5y"}
];

const names:Record<string,string>={
  BTC:"Bitcoin",ETH:"Ethereum",SOL:"Solana",USDC:"USD Coin",LINK:"Chainlink",AVAX:"Avalanche",ADA:"Cardano",XRP:"XRP",LTC:"Litecoin",DOT:"Polkadot"
};

const eur=(value:number,locale:string)=>new Intl.NumberFormat(locale,{style:"currency",currency:"EUR"}).format(value);
const compact=(value:number,locale:string)=>new Intl.NumberFormat(locale,{notation:"compact",maximumFractionDigits:1}).format(value);
const qty=(value:number,locale:string)=>new Intl.NumberFormat(locale,{maximumFractionDigits:8}).format(value);
const formatChartTick=(timestamp:number,range:string,locale:string)=>{
  const date=new Date(timestamp);
  if(range==="5m"||range==="1h"||range==="24h")return date.toLocaleTimeString(locale,{hour:"2-digit",minute:"2-digit"});
  if(range==="1y"||range==="5y")return date.toLocaleDateString(locale,{month:"short",year:"2-digit"});
  return date.toLocaleDateString(locale,{day:"2-digit",month:"2-digit"});
};

export function InvestirPage({onBack,onAuth}:{onBack:()=>void;onAuth:()=>void}){
  const auth=useAuth();
  const {t,language}=useLanguage();
  const locale=language==="pt-BR"?"pt-BR":language;
  const market=useInvestirMarket();
  const [selected,setSelected]=useState(()=>{const requested=new URLSearchParams(window.location.search).get("asset")?.toUpperCase()||"BTC";return /^[A-Z0-9]{2,12}$/.test(requested)?requested:"BTC"});
  const [range,setRange]=useState("24h");
  const [amount,setAmount]=useState("500");
  const [side,setSide]=useState<"buy"|"sell">("buy");
  const [tradeState,setTradeState]=useState<"idle"|"submitting"|"success"|"error">("idle");
  const [tradeMessage,setTradeMessage]=useState("");
  const tradePending=useRef(false);
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
    if(tradePending.current)return;
    if(!Number.isFinite(numericAmount)||numericAmount<=0||!selected||price<=0){setTradeState("error");setTradeMessage(t("invalidAmount"));return;}
    tradePending.current=true;
    const submittedSide=side;
    const submittedAsset=selected;
    setTradeState("submitting");setTradeMessage("");
    try{
      await submitSimulatedTrade(auth.token,submittedSide,submittedAsset,numericAmount);
      market.reload();
      notifyTradeCompleted();
      setTradeState("success");
      setTradeMessage(`${submittedSide==="buy"?t("buy"):t("sell")} ${submittedAsset} ${t("tradeRecorded")}`);
    }catch(error){
      if(error instanceof TradeSessionExpiredError)auth.expireSession();
      setTradeState("error");
      setTradeMessage(error instanceof Error?error.message:t("tradeFailure"));
    }finally{
      tradePending.current=false;
    }
  }

  return <main className="mx-auto max-w-7xl space-y-6 px-5 py-8">{auth.status==="authenticated"&&<ReactOnboarding/>}
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <button type="button" onClick={onBack} className="mb-3 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white"><ArrowLeft size={16}/> {t("back")}</button>
        <div className="flex flex-wrap items-center gap-3"><Badge>{t("market")} · EUR</Badge><span className="text-xs text-slate-500">{t("simulation")}</span></div>
        <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">{t("invest")}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">{t("market")} · {t("explore")}. {t("investIntro")}</p>
      </div>
      <Button variant="secondary" onClick={market.reload}><RefreshCw size={16}/> {t("refresh")}</Button>
    </div>

    {market.status==="loading"&&<Card aria-busy="true"><p role="status">{t("loadingMarkets")}</p></Card>}
    {market.status==="error"&&<Card role="alert"><p className="text-rose-300">{market.error}</p><Button className="mt-4" onClick={market.reload}>{t("retry")}</Button></Card>}
    {market.status==="ready"&&market.data?.length===0&&<Card><p className="text-slate-400">{t("noMarkets")}</p></Card>}

    {market.status==="ready"&&Boolean(market.data?.length)&&<>
      <section aria-label={t("market")} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {market.data!.map(item=>{
          const positive=Number(item.change24h)>=0;
          const active=item.symbol===selected;
          return <button key={item.symbol} type="button" onClick={()=>{setSelected(item.symbol);setRange("24h");setTradeState("idle");setTradeMessage("")}} aria-pressed={active} className={`min-w-0 rounded-2xl border p-4 text-left transition-colors ${active?"border-lime-400/40 bg-lime-400/10":"border-white/10 bg-[#15171b]/95 hover:bg-white/5"}`}>
            <div className="flex items-center justify-between gap-2"><div className="flex min-w-0 items-center gap-2"><CryptoAssetMark symbol={item.symbol} size={30}/><strong className="truncate">{names[item.symbol]||item.symbol}</strong></div><span className="text-xs text-slate-500">{item.symbol}</span></div>
            <span className="mt-3 block text-lg font-bold">{eur(Number(item.price||0),locale)}</span>
            <span className={`mt-1 flex items-center gap-1 text-xs ${positive?"text-lime-300":"text-rose-300"}`}>{positive?<TrendingUp size={13}/>:<TrendingDown size={13}/>} {positive?"+":""}{Number(item.change24h||0).toFixed(2)} %</span>
          </button>;
        })}
      </section>

      <div className="grid gap-5 xl:grid-cols-[1.7fr_.8fr]">
        <Card>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[.18em] text-lime-300">{selected} · {t("marketDetail")}</p>
              <h2 className="mt-2 text-2xl font-bold">{detail.data?.name||names[selected]||selected}</h2>
              <p className="mt-1 text-sm text-slate-400">{t("currentPrice")} {eur(price,locale)}</p>
            </div>
            <div className="flex max-w-full flex-wrap gap-2" aria-label={t("chartPeriod")}>
              {ranges.map(item=><button key={item.id} type="button" onClick={()=>setRange(item.id)} aria-pressed={range===item.id} className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium ${range===item.id?"border-lime-400/40 bg-lime-400/15 text-lime-300":"border-white/10 text-slate-400 hover:bg-white/5"}`}>{item.id==="7d"?`7 ${t("days")}`:item.id==="30d"?`30 ${t("days")}`:item.id==="1y"?`1 ${t("year")}`:item.id==="5y"?`5 ${t("years")}`:item.label}</button>)}
            </div>
          </div>

          {detail.status==="loading"&&<p role="status" className="py-20 text-center text-sm text-slate-400">{t("loadingDetail")}</p>}
          {detail.status==="error"&&<div role="alert" className="py-12 text-center"><p className="text-sm text-rose-300">{detail.error||t("priceUnavailable")}</p><Button className="mt-4" onClick={detail.reload}>{t("retryChart")}</Button></div>}
          {detail.status==="ready"&&chartData.length>1?<div className="mt-5 h-72 min-w-0" role="img" aria-label={`Courbe ${selected} ${range}`}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <XAxis dataKey="timestamp" type="number" domain={["dataMin","dataMax"]} tickFormatter={(value)=>formatChartTick(Number(value),range,locale)} tick={{fill:"#94a3b8",fontSize:11}}/>
                <YAxis domain={["auto","auto"]} tickFormatter={(value)=>eur(Number(value),locale)} width={82} tick={{fill:"#94a3b8",fontSize:10}}/>
                <Tooltip labelFormatter={(value)=>new Date(Number(value)).toLocaleString(locale)} formatter={(value:number)=>[eur(Number(value),locale),t("priceLabel")]}/>
                <Area type="monotone" dataKey="price" stroke="#c8ff2e" fill="#c8ff2e" fillOpacity={.08}/>
              </AreaChart>
            </ResponsiveContainer>
          </div>:detail.status==="ready"?<p className="py-20 text-center text-sm text-slate-400">{t("insufficientHistory")}</p>:null}

          {detail.status==="ready"&&<div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-white/10 p-3"><p className="text-xs text-slate-500">{t("change24h")}</p><p className={`mt-1 font-semibold ${Number(detail.data?.change24h||0)>=0?"text-lime-300":"text-rose-300"}`}>{Number(detail.data?.change24h||0).toFixed(2)} %</p></div>
            <div className="rounded-xl border border-white/10 p-3"><p className="text-xs text-slate-500">{t("marketCap")}</p><p className="mt-1 font-semibold">{detail.data?.marketCap?compact(Number(detail.data.marketCap),locale)+" €":"—"}</p></div>
            <div className="rounded-xl border border-white/10 p-3"><p className="text-xs text-slate-500">{t("volume24h")}</p><p className="mt-1 font-semibold">{detail.data?.volume24h?compact(Number(detail.data.volume24h),locale)+" €":"—"}</p></div>
          </div>}
        </Card>

        <Card className="h-fit">
          <p className="text-xs font-semibold uppercase tracking-[.18em] text-violet-300">{t("simulator")}</p>
          <h2 className="mt-2 text-xl font-bold">{t("simulateTrade")}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">{t("virtualOrder")}</p>
          <div className="mt-4 grid grid-cols-2 gap-2" aria-label={t("tradeType")}>
            <button type="button" aria-pressed={side==="buy"} onClick={()=>{setSide("buy");setTradeState("idle");setTradeMessage("")}} className={`rounded-xl border px-3 py-2 text-sm font-semibold ${side==="buy"?"border-lime-400/40 bg-lime-400/15 text-lime-300":"border-white/10 text-slate-400"}`}>{t("buy")}</button>
            <button type="button" aria-pressed={side==="sell"} onClick={()=>{setSide("sell");setTradeState("idle");setTradeMessage("")}} className={`rounded-xl border px-3 py-2 text-sm font-semibold ${side==="sell"?"border-rose-400/40 bg-rose-400/15 text-rose-300":"border-white/10 text-slate-400"}`}>{t("sell")}</button>
          </div>
          <label className="mt-5 block text-sm font-medium" htmlFor="invest-amount">{t("amountEur")}</label>
          <div className="mt-2 flex items-center rounded-xl border border-white/15 bg-black/20 px-3">
            <span className="text-slate-500">€</span>
            <input id="invest-amount" aria-label={t("amountEur")} inputMode="decimal" value={amount} onChange={event=>{setAmount(event.target.value);setTradeState("idle");setTradeMessage("")}} className="min-w-0 flex-1 bg-transparent px-3 py-3 text-base outline-none" />
          </div>
          <div className="mt-4 rounded-xl bg-white/5 p-4">
            <p className="text-xs text-slate-500">{t("estimate")}</p>
            <p className="mt-1 text-lg font-semibold">≈ {qty(estimated,locale)} {selected}</p>
            <p className="mt-1 text-xs text-slate-500">{price>0?eur(price,locale)+" / "+selected:t("priceUnavailable")}</p>
          </div>
          <Button className="mt-5 w-full" disabled={tradeState==="submitting"||!estimated} onClick={submitTrade}>{tradeState==="submitting"?t("saving"):auth.token?(side==="buy"?t("buySimulation"):t("sellSimulation")):t("signInSimulate")} <ArrowRight size={16}/></Button>
          {tradeState==="error"&&<div className="mt-3 flex flex-wrap gap-3 text-sm"><a href="/portefeuille?action=crediter" className="font-semibold text-lime-300 underline underline-offset-4">{t("creditFunds")}</a><a href="/portefeuille" className="text-slate-300 underline underline-offset-4">{t("viewAssets")}</a></div>}
          {tradeMessage&&<p role={tradeState==="error"?"alert":"status"} className={`mt-3 text-sm ${tradeState==="error"?"text-rose-300":"text-lime-300"}`}>{tradeMessage}</p>}
          {tradeState==="success"&&<div className="mt-3 flex flex-wrap gap-3 text-sm"><a href="/portefeuille" className="text-lime-300 underline underline-offset-4">{t("viewPortfolio")}</a><a href="/activite" className="text-lime-300 underline underline-offset-4">{t("viewActivity")}</a></div>}
          <p className="mt-4 text-xs leading-5 text-slate-500">{t("noRealAssets")}</p>
        </Card>
      </div>
    </>}
  <CryptoDiscoveryPanel/></main>;
}
