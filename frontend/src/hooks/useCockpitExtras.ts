import {useEffect,useState} from "react";

export type TradeActivity={
  side:"buy"|"sell";
  asset:string;
  amount_eur:number;
  price_eur:number;
  quantity:number;
  created_at:string;
};

export type MarketPoint={timestamp:number;price:number};
export type MarketDetail={
  symbol:string;
  name?:string;
  history:{range:string;label:string;points:MarketPoint[]};
};

type LoadState<T>={status:"idle"|"loading"|"ready"|"error";data?:T;error?:string};

async function request<T>(path:string,token:string,signal:AbortSignal,onExpired:()=>void):Promise<T>{
  const response=await fetch(path,{signal,headers:{Authorization:`Bearer ${token}`,Accept:"application/json"}});
  if(response.status===401){onExpired();throw new Error("SESSION_EXPIRED")}
  if(!response.ok){
    const body=await response.json().catch(()=>({}));
    throw new Error(typeof body.error==="string"?body.error:`Erreur API (${response.status})`);
  }
  return response.json() as Promise<T>;
}

export function useCockpitExtras(token:string,range:string,onExpired:()=>void){
  const [activity,setActivity]=useState<LoadState<{trades:TradeActivity[]}>>({status:"idle"});
  const [market,setMarket]=useState<LoadState<MarketDetail>>({status:"idle"});

  useEffect(()=>{
    if(!token){setActivity({status:"idle"});return}
    const controller=new AbortController();
    setActivity({status:"loading"});
    request<{trades:TradeActivity[]}>("/api/activity",token,controller.signal,onExpired)
      .then(data=>{if(!controller.signal.aborted)setActivity({status:"ready",data})})
      .catch((error:unknown)=>{
        if(controller.signal.aborted)return;
        const message=error instanceof Error?error.message:"Erreur inconnue";
        if(message!=="SESSION_EXPIRED")setActivity({status:"error",error:message});
      });
    return()=>controller.abort();
  },[token,onExpired]);

  useEffect(()=>{
    if(!token){setMarket({status:"idle"});return}
    const controller=new AbortController();
    setMarket({status:"loading"});
    request<MarketDetail>(`/api/market/details/BTC?range=${encodeURIComponent(range)}`,token,controller.signal,onExpired)
      .then(data=>{if(!controller.signal.aborted)setMarket({status:"ready",data})})
      .catch((error:unknown)=>{
        if(controller.signal.aborted)return;
        const message=error instanceof Error?error.message:"Erreur inconnue";
        if(message!=="SESSION_EXPIRED")setMarket({status:"error",error:message});
      });
    return()=>controller.abort();
  },[token,range,onExpired]);

  return {activity,market};
}
