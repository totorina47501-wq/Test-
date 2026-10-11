import {useCallback,useEffect,useState} from "react";
import {onTradeCompleted} from "./tradeEvents";

export type Position={asset:string;quantity:number;price:number;value:number;allocation:number};
export type Trade={side:"buy"|"sell";asset:string;amount_eur:number;price_eur:number;quantity:number;created_at:string};
export type BotLog={bot_type:string;action:string;asset?:string|null;message:string;created_at:string};
export type Portfolio={cash:number;invested:number;total:number;positions:Position[];trades:Trade[];integrity?:{ok:boolean}};
export type BotDefinition={id:string;name:string;tier:string;plan:string;risk:string;allocation:number;summary:string;strategy:string;compatible_assets:string[]};
export type BotSubscription={bot_type:string;active:boolean;max_trade_eur:number;max_position_eur:number;stop_loss_pct:number;min_cash_pct:number;last_run?:string|null};
export type BotsData={catalog:BotDefinition[];items:BotSubscription[];activity:BotLog[];plan:{plan:string}};
export type ActivityData={trades:Trade[];botLogs:BotLog[]};

export class SessionExpiredError extends Error { constructor(){super("Session expirée. Reconnectez-vous.");this.name="SessionExpiredError"} }
type State<T>={status:"loading"|"ready"|"error";data?:T;error?:string};

async function api<T>(path:string,token:string,init:RequestInit={}):Promise<T>{
  const response=await fetch(path,{...init,headers:{Accept:"application/json",Authorization:`Bearer ${token}`,...(init.headers||{})}});
  const body=await response.json().catch(()=>({}));
  if(response.status===401)throw new SessionExpiredError();
  if(!response.ok)throw new Error(typeof body.error==="string"?body.error:`Erreur API (${response.status})`);
  return body as T;
}

export function useAccountData(token:string,onExpired:()=>void){
  const [portfolio,setPortfolio]=useState<State<Portfolio>>({status:"loading"});
  const [activity,setActivity]=useState<State<ActivityData>>({status:"loading"});
  const [bots,setBots]=useState<State<BotsData>>({status:"loading"});

  const [refreshKey,setRefreshKey]=useState(0);
  const reload=useCallback(()=>setRefreshKey(value=>value+1),[]);
  useEffect(()=>onTradeCompleted(reload),[reload]);
  useEffect(()=>{
    if(!token){setPortfolio({status:"loading"});setActivity({status:"loading"});setBots({status:"loading"});return}
    const controller=new AbortController();
    let expired=false;
    const handleError=(e:unknown)=>{if(e instanceof SessionExpiredError&&!expired){expired=true;onExpired()}return e instanceof Error?e.message:"Données indisponibles"};
    setPortfolio(previous=>previous.data?previous:{status:"loading"});setActivity(previous=>previous.data?previous:{status:"loading"});setBots(previous=>previous.data?previous:{status:"loading"});
    api<Portfolio>("/api/portfolio",token,{signal:controller.signal}).then(data=>{if(!controller.signal.aborted)setPortfolio({status:"ready",data})}).catch((e:unknown)=>{if(!controller.signal.aborted)setPortfolio({status:"error",error:handleError(e)})});
    api<ActivityData>("/api/activity",token,{signal:controller.signal}).then(data=>{if(!controller.signal.aborted)setActivity({status:"ready",data})}).catch((e:unknown)=>{if(!controller.signal.aborted)setActivity({status:"error",error:handleError(e)})});
    api<BotsData>("/api/bots",token,{signal:controller.signal}).then(data=>{if(!controller.signal.aborted)setBots({status:"ready",data})}).catch((e:unknown)=>{if(!controller.signal.aborted)setBots({status:"error",error:handleError(e)})});
    return()=>controller.abort();
  },[token,onExpired,refreshKey]);
  return {portfolio,activity,bots,reload};
}

export async function activateBot(token:string,payload:{botType:string;maxTradeEur:number;maxPositionEur:number;stopLossPct:number;minCashPct:number}){
  return api<{ok:boolean}>("/api/bots/subscriptions",token,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
}
export async function deactivateBot(token:string,botType:string){
  return api<{ok:boolean}>(`/api/bots/subscriptions/${encodeURIComponent(botType)}`,token,{method:"DELETE"});
}
