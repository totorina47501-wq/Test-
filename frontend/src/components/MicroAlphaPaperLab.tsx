import {useMemo,useState} from "react";
import {Badge,Button,Card} from "./ui";

// Local educational sandbox only: never calls an API or changes a user's portfolio.
type Trade={id:string;action:"buy"|"sell";amount:number;quantity:number;fee:number;price:number};
const eur=(n:number)=>new Intl.NumberFormat("fr-FR",{style:"currency",currency:"EUR"}).format(n);
const initialCash=1000;
export function MicroAlphaPaperLab(){
 const [cash,setCash]=useState(initialCash);
 const [quantity,setQuantity]=useState(0);
 const [price,setPrice]=useState("50000");
 const [amount,setAmount]=useState("20");
 const [feePct,setFeePct]=useState("0.15");
 const [drawdownLimit,setDrawdownLimit]=useState("20");
 const [peak,setPeak]=useState(initialCash);
 const [trades,setTrades]=useState<Trade[]>([]);
 const [feedback,setFeedback]=useState("");
 const p=Number(price),a=Number(amount),feeRate=Number(feePct)/100,limit=Number(drawdownLimit);
 const valid=Number.isFinite(p)&&p>0&&Number.isFinite(a)&&a>=1&&a<=50&&Number.isFinite(feeRate)&&feeRate>=0&&feeRate<1&&Number.isFinite(limit)&&limit>0&&limit<=100;
 const equity=cash+quantity*(Number.isFinite(p)&&p>0?p:0);
 const currentPeak=Math.max(peak,equity);
 const drawdown=currentPeak>0?100*(1-equity/currentPeak):0;
 const stopped=drawdown>=limit;
 const pnl=equity-initialCash;
 const reset=()=>{setCash(initialCash);setQuantity(0);setPeak(initialCash);setTrades([]);setFeedback("Simulation réinitialisée.");};
 const execute=(action:"buy"|"sell")=>{
  if(!valid){setFeedback("Paramètres invalides : prix positif, ordre de 1 à 50 €, frais de 0 à moins de 100 %, drawdown de 0 à 100 %.");return;}
  if(action==="buy"&&stopped){setFeedback("Achat bloqué par la limite de drawdown.");return;}
  const fee=a*feeRate,units=a/p;
  if(action==="buy"&&a+fee>cash+1e-9){setFeedback("Liquidités virtuelles insuffisantes.");return;}
  if(action==="sell"&&units>quantity+1e-10){setFeedback("Position virtuelle insuffisante.");return;}
  setPeak(currentPeak);setCash(v=>v+(action==="buy"?-a-fee:a-fee));setQuantity(v=>Math.max(0,v+(action==="buy"?units:-units)));
  setTrades(v=>[{id:String(v.length+1),action,amount:a,quantity:units,fee,price:p},...v]);setFeedback(action==="buy"?"Achat virtuel enregistré.":"Vente virtuelle enregistrée.");
 };
 const history=useMemo(()=>trades.slice(0,8),[trades]);
 return <Card className="space-y-4" aria-label="Micro Alpha laboratoire virtuel">
  <div><Badge>Micro Alpha · laboratoire local</Badge><h2 className="mt-2 text-xl font-semibold">Tester des micro-ordres fictifs</h2><p className="mt-1 text-xs text-slate-400">Scénario pédagogique indépendant : cours saisi manuellement, aucun flux de marché, aucun compte débité, aucune API et aucun ordre réel. Ne représente pas les performances des bots.</p></div>
  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><label className="text-sm">Cours fictif BTC (€)<input aria-label="Cours fictif BTC" type="number" min="0.01" step="0.01" value={price} onChange={e=>setPrice(e.target.value)} className="mt-1 w-full rounded-xl border border-white/15 bg-[#15171b] p-2"/></label><label className="text-sm">Ordre virtuel (€)<input aria-label="Ordre virtuel" type="number" min="1" max="50" step="0.01" value={amount} onChange={e=>setAmount(e.target.value)} className="mt-1 w-full rounded-xl border border-white/15 bg-[#15171b] p-2"/></label><label className="text-sm">Frais (%)<input aria-label="Frais simulés" type="number" min="0" max="99" step="0.01" value={feePct} onChange={e=>setFeePct(e.target.value)} className="mt-1 w-full rounded-xl border border-white/15 bg-[#15171b] p-2"/></label><label className="text-sm">Arrêt drawdown (%)<input aria-label="Seuil drawdown" type="number" min="0.01" max="100" step="0.01" value={drawdownLimit} onChange={e=>setDrawdownLimit(e.target.value)} className="mt-1 w-full rounded-xl border border-white/15 bg-[#15171b] p-2"/></label></div>
  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><div><p className="text-xs text-slate-400">Liquidités fictives</p><strong>{eur(cash)}</strong></div><div><p className="text-xs text-slate-400">Valorisation fictive</p><strong>{eur(equity)}</strong></div><div><p className="text-xs text-slate-400">Résultat net fictif</p><strong>{eur(pnl)}</strong></div><div><p className="text-xs text-slate-400">Drawdown courant</p><strong>{drawdown.toFixed(2)} %</strong></div></div>
  <p className="text-xs text-slate-400">Position BTC : {quantity.toLocaleString("fr-FR",{maximumFractionDigits:8})} · Peak fictif : {eur(currentPeak)} · {stopped?"Arrêt des nouveaux achats":"Achats permis sous réserve des limites"}</p>
  <div className="flex flex-wrap gap-2"><Button disabled={!valid||stopped} onClick={()=>execute("buy")}>Acheter virtuellement</Button><Button variant="secondary" disabled={!valid} onClick={()=>execute("sell")}>Vendre virtuellement</Button><Button variant="secondary" onClick={reset}>Réinitialiser le laboratoire</Button></div>
  {feedback&&<p role="status" className="text-sm text-lime-300">{feedback}</p>}
  <h3 className="font-semibold">Journal fictif ({trades.length})</h3>{history.length?<ul className="space-y-2 text-sm">{history.map(t=><li key={t.id} className="flex flex-wrap justify-between gap-2 border-b border-white/10 py-2"><span>{t.action==="buy"?"Achat":"Vente"} BTC · {eur(t.amount)} à {eur(t.price)}</span><span>Frais {eur(t.fee)}</span></li>)}</ul>:<p className="text-sm text-slate-400">Aucun ordre fictif. Les données disparaissent au rechargement.</p>}
  <p className="text-xs text-slate-500">Ce démonstrateur local est distinct du moteur serveur Micro Alpha. Il n'implique aucune exécution automatisée, persistance ou signal de trading.</p>
 </Card>;
}
