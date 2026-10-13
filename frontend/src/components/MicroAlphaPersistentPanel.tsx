import {useCallback,useEffect,useState} from "react";
import {Badge,Button,Card} from "./ui";
type Account={cash:number;initialCash:number;positions:Record<string,number>;trades:Array<{id:string;action:string;amountEur:number;fee:number;executionPrice:number}>};
const eur=(n:number)=>new Intl.NumberFormat("fr-FR",{style:"currency",currency:"EUR"}).format(n);
export function MicroAlphaPersistentPanel({token,onExpired}:{token:string;onExpired:()=>void}){
 const [account,setAccount]=useState<Account|null>(null);
 const [price,setPrice]=useState("50000");
 const [amount,setAmount]=useState("20");
 const [busy,setBusy]=useState(false);
 const [valuation,setValuation]=useState<{equityEur:number;pnlEur:number;pnlPct:number;exposureEur:number;marketVerified:boolean;priceUpdatedAt?:number;priceSource?:string}|null>(null);
 const [message,setMessage]=useState("");
 const load=useCallback(async()=>{
  setValuation(null);
  const response=await fetch("/api/micro-alpha/account",{headers:{Authorization:"Bearer "+token}});
  if(response.status===401){onExpired();return;}
  if(!response.ok)throw Error("Simulation indisponible");
  const data=await response.json();setAccount(data.account);
 },[token,onExpired]);
 useEffect(()=>{let active=true;load().catch(()=>{if(active)setMessage("Impossible de charger la simulation persistante.")});return()=>{active=false}},[load]);
 const execute=async(action:"buy"|"sell"|"reset")=>{
  setBusy(true);setMessage("");
  try{
   const response=await fetch(action==="reset"?"/api/micro-alpha/reset":"/api/micro-alpha/signals",{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+token},body:JSON.stringify(action==="reset"?{}:{id:crypto.randomUUID(),action,amountEur:Number(amount),price:Number(price)})});
   if(response.status===401){onExpired();return;}
   if(!response.ok)throw Error("Opération fictive refusée.");
   const data=await response.json();
   await load();
   setMessage(action==="reset"?"Compte fictif réinitialisé.":data.executed?"Ordre fictif enregistré.":`Ordre non exécuté : ${data.reason}`);
  }catch(e){setMessage(e instanceof Error?e.message:"Erreur de simulation");}finally{setBusy(false);}
 };
 const evaluate=async()=>{
  setBusy(true);setMessage("");setValuation(null);
  try{
   const response=await fetch("/api/micro-alpha/scenario-valuation",{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+token},body:JSON.stringify({price:Number(price)})});
   if(response.status===401){onExpired();return;}
   if(!response.ok)throw Error("Valorisation fictive indisponible.");
   const data=await response.json();
   if(data.marketVerified!==false||data.valuation!=="manual-scenario-only")throw Error("Source de valorisation non reconnue.");
   setValuation(data);
  }catch(e){setMessage(e instanceof Error?e.message:"Erreur de scénario");}finally{setBusy(false);}
 };
 const evaluateMarket=async()=>{
  setBusy(true);setMessage("");setValuation(null);
  try{
   const response=await fetch("/api/micro-alpha/market-valuation",{headers:{Authorization:"Bearer "+token,"Cache-Control":"no-store"}});
   if(response.status===401){onExpired();return;}
   if(response.status===503)throw Error("Cours BTC frais indisponible : aucune performance de marché affichée.");
   if(!response.ok)throw Error("Valorisation de marché indisponible.");
   const data=await response.json();
   if(data.marketVerified!==true||data.valuation!=="verified-market-snapshot"||!Number.isFinite(data.priceUpdatedAt))throw Error("Cotations non vérifiées.");
   setValuation(data);
  }catch(e){setMessage(e instanceof Error?e.message:"Erreur de cotation");}finally{setBusy(false);}
 };
 const valid=Number.isFinite(Number(price))&&Number(price)>0&&Number(price)<=10000000&&Number.isFinite(Number(amount))&&Number(amount)>=1&&Number(amount)<=50;
 return <Card className="space-y-3" aria-label="Micro Alpha persistant">
  <div><Badge>Micro Alpha V3 · simulation sauvegardée</Badge><h2 className="mt-2 text-xl font-semibold">Compte fictif personnel</h2><p className="mt-1 text-xs text-slate-400">Historique sauvegardé séparément de votre portefeuille. Cours BTC saisi manuellement : scénario pédagogique, pas un prix de marché. Aucun ordre réel.</p></div>
  <p className="text-sm">Liquidités fictives : <strong>{account?eur(account.cash):"Chargement..."}</strong> · BTC fictif : {Number(account?.positions?.BTC||0).toLocaleString("fr-FR",{maximumFractionDigits:8})}</p>
  <div className="grid gap-3 sm:grid-cols-2"><label className="text-sm">Cours BTC de scénario (€)<input aria-label="Cours BTC de scénario" type="number" min="0.01" value={price} onChange={e=>setPrice(e.target.value)} className="mt-1 w-full rounded-xl border border-white/15 bg-[#15171b] p-2"/></label><label className="text-sm">Micro-ordre (€)<input aria-label="Micro-ordre persistant" type="number" min="1" max="50" value={amount} onChange={e=>setAmount(e.target.value)} className="mt-1 w-full rounded-xl border border-white/15 bg-[#15171b] p-2"/></label></div>
  <div className="flex flex-wrap gap-2"><Button variant="secondary" disabled={busy||!account} onClick={evaluateMarket}>Actualiser la valeur au marché</Button><Button variant="secondary" disabled={!valid||busy||!account} onClick={evaluate}>Évaluer le scénario fictif</Button></div>
  {valuation&&<section aria-label="Valorisation hypothétique" className="rounded-xl border border-white/15 p-3 text-sm"><strong>{valuation.marketVerified?"Valorisation BTC au dernier cours vérifié (simulation)":"Scénario hypothétique uniquement — aucun cours de marché vérifié"}</strong><p>Valeur fictive : {eur(valuation.equityEur)} · Exposition BTC : {eur(valuation.exposureEur)}</p><p>Gain/perte hypothétique : {eur(valuation.pnlEur)} ({valuation.pnlPct.toFixed(2)} %)</p><p className="text-xs text-slate-400">{valuation.marketVerified?`Source ${valuation.priceSource} · cours reçu ${new Date(valuation.priceUpdatedAt||0).toLocaleString("fr-FR")} · photographie instantanée, pas un rendement historique garanti.`:"Résultat au cours saisi par vous, sans historique de marché ni rendement réel."}</p></section>}
  <div className="flex flex-wrap gap-2"><Button disabled={!valid||busy||!account} onClick={()=>execute("buy")}>Acheter (simulation sauvegardée)</Button><Button variant="secondary" disabled={!valid||busy||!account} onClick={()=>execute("sell")}>Vendre (simulation sauvegardée)</Button><Button variant="secondary" disabled={busy||!account} onClick={()=>execute("reset")}>Réinitialiser compte sauvegardé</Button></div>
  {message&&<p role="status" className="text-sm text-lime-300">{message}</p>}
  <h3 className="font-semibold">Historique personnel fictif ({account?.trades?.length||0})</h3>
  {(account?.trades||[]).length?<ul className="space-y-1 text-sm">{[...(account?.trades||[])].reverse().slice(0,10).map(t=><li key={t.id}>{t.action==="buy"?"Achat":"Vente"} BTC · {eur(t.amountEur)} · frais {eur(t.fee)}</li>)}</ul>:<p className="text-xs text-slate-400">Aucun micro-ordre sauvegardé.</p>}
  <p className="text-xs text-slate-500">La valorisation de marché est disponible uniquement avec un cours BTC frais vérifié. Aucun historique durable de performance ou drawdown officiel.</p>
 </Card>;
}
