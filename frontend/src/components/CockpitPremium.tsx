import {useMemo,useState} from "react";
import {Card} from "./ui";
import {useCockpitExtras,type MarketPoint} from "../hooks/useCockpitExtras";

const ranges=[
  {id:"5m",label:"5 min"},
  {id:"1h",label:"1 h"},
  {id:"24h",label:"24 h"},
  {id:"7d",label:"7 jours"},
  {id:"30d",label:"30 jours"},
  {id:"1y",label:"1 an"},
  {id:"5y",label:"5 ans"}
];

const eur=(value:number)=>new Intl.NumberFormat("fr-FR",{style:"currency",currency:"EUR"}).format(value);

function CandlestickChart({points}:{points:MarketPoint[]}){
  const candles=useMemo(()=>{
    if(points.length<2)return [];
    const bucket=Math.max(1,Math.ceil(points.length/24));
    const rows=[];
    for(let index=0;index<points.length;index+=bucket){
      const slice=points.slice(index,index+bucket).filter(point=>Number.isFinite(point.price)&&point.price>0);
      if(!slice.length)continue;
      const prices=slice.map(point=>point.price);
      rows.push({
        timestamp:slice[0].timestamp,
        open:prices[0],
        high:Math.max(...prices),
        low:Math.min(...prices),
        close:prices[prices.length-1]
      });
    }
    return rows;
  },[points]);

  if(candles.length<2)return <p className="py-14 text-center text-sm text-slate-400">Données OHLC insuffisantes pour cette période.</p>;

  const low=Math.min(...candles.map(candle=>candle.low));
  const high=Math.max(...candles.map(candle=>candle.high));
  const span=Math.max(high-low,high*0.002,1);
  const width=720;
  const height=260;
  const top=18;
  const bottom=28;
  const plotHeight=height-top-bottom;
  const step=width/candles.length;
  const bodyWidth=Math.max(3,Math.min(14,step*.58));
  const y=(value:number)=>top+(high-value)/span*plotHeight;

  return <div className="overflow-hidden rounded-xl border border-white/10 bg-black/20 p-3">
    <svg role="img" aria-label="Chandeliers OHLC BTC" viewBox={`0 0 ${width} ${height}`} className="h-64 w-full">
      <title>Chandeliers OHLC BTC</title>
      {[0,.25,.5,.75,1].map(ratio=>{
        const yy=top+plotHeight*ratio;
        const value=high-span*ratio;
        return <g key={ratio}><line x1="0" x2={width} y1={yy} y2={yy} stroke="rgba(148,163,184,.14)"/><text x="6" y={yy-4} fill="#94a3b8" fontSize="10">{eur(value)}</text></g>;
      })}
      {candles.map((candle,index)=>{
        const x=step*index+step/2;
        const rising=candle.close>=candle.open;
        const bodyTop=y(Math.max(candle.open,candle.close));
        const bodyBottom=y(Math.min(candle.open,candle.close));
        const bodyHeight=Math.max(2,bodyBottom-bodyTop);
        const tone=rising?"#34d399":"#fb7185";
        return <g key={candle.timestamp}>
          <line x1={x} x2={x} y1={y(candle.high)} y2={y(candle.low)} stroke={tone} strokeWidth="1.5"/>
          <rect x={x-bodyWidth/2} y={bodyTop} width={bodyWidth} height={bodyHeight} rx="1.5" fill={tone}/>
        </g>;
      })}
    </svg>
  </div>;
}

export function CockpitPremium({token,onExpired}:{token:string;onExpired:()=>void}){
  const [range,setRange]=useState("24h");
  const {activity,market}=useCockpitExtras(token,range,onExpired);
  const points=market.data?.history?.points??[];

  return <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.18em] text-emerald-300">Marché authentifié</p>
          <h3 className="mt-2 text-lg font-semibold">Marché BTC</h3>
          <p className="mt-1 text-xs text-slate-400">OHLC calculé à partir des points de prix renvoyés par l’API BitGold.</p>
        </div>
        <div className="flex flex-wrap gap-2" aria-label="Période du marché">
          {ranges.map(item=><button key={item.id} type="button" onClick={()=>setRange(item.id)} aria-pressed={range===item.id} className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${range===item.id?"border-emerald-400/40 bg-emerald-400/15 text-emerald-300":"border-white/10 text-slate-400 hover:bg-white/5 hover:text-white"}`}>{item.label}</button>)}
        </div>
      </div>
      <div className="mt-5">
        {market.status==="loading"&&<p role="status" className="py-14 text-center text-sm text-slate-400">Chargement du marché…</p>}
        {market.status==="error"&&<p role="alert" className="py-14 text-center text-sm text-rose-300">{market.error}</p>}
        {market.status==="ready"&&<CandlestickChart points={points}/>}
      </div>
    </Card>

    <Card>
      <h3 className="text-lg font-semibold">Transactions récentes</h3>
      <p className="mt-1 text-xs text-slate-400">Ordres simulés enregistrés sur votre compte.</p>
      {activity.status==="loading"&&<p role="status" className="py-10 text-sm text-slate-400">Chargement des transactions…</p>}
      {activity.status==="error"&&<p role="alert" className="py-10 text-sm text-rose-300">{activity.error}</p>}
      {activity.status==="ready"&&activity.data?.trades?.length===0&&<p className="py-10 text-sm text-slate-400">Aucune transaction simulée pour le moment.</p>}
      {activity.status==="ready"&&Boolean(activity.data?.trades?.length)&&<div className="mt-4 space-y-3">
        {activity.data!.trades.slice(0,6).map((trade,index)=><div key={`${trade.created_at}-${trade.asset}-${index}`} className="flex items-center justify-between gap-4 border-b border-white/10 pb-3">
          <div>
            <p className="font-medium">{trade.side==="buy"?"Achat":"Vente"} {trade.asset}</p>
            <p className="text-xs text-slate-500">{new Date(trade.created_at).toLocaleString("fr-FR")}</p>
          </div>
          <div className="text-right">
            <p className={`font-semibold ${trade.side==="buy"?"text-emerald-300":"text-rose-300"}`}>{eur(Number(trade.amount_eur||0))}</p>
            <p className="text-xs text-slate-500">@ {eur(Number(trade.price_eur||0))}</p>
          </div>
        </div>)}
      </div>}
    </Card>
  </div>;
}
