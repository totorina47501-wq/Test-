import {useCallback,useEffect,useState} from "react";

export type MarketRow={
  symbol:string;
  price:number;
  change24h:number;
  marketCap?:number|null;
  volume24h?:number|null;
};

export type MarketPoint={timestamp:number;price:number};
export type MarketDetail=MarketRow&{
  name?:string;
  source?:string;
  history:{range:string;label:string;min:number;max:number;points:MarketPoint[]};
};

type AsyncState<T>={status:"loading"|"ready"|"error";data?:T;error?:string};

async function readJson<T>(response:Response):Promise<T>{
  const data=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error(typeof data.error==="string"?data.error:`Erreur API (${response.status})`);
  return data as T;
}

export function useInvestirMarket(){
  const [market,setMarket]=useState<AsyncState<MarketRow[]>>({status:"loading"});
  const reload=useCallback(()=>{
    setMarket({status:"loading"});
    fetch("/api/market",{headers:{Accept:"application/json"}})
      .then(response=>readJson<{markets:MarketRow[]}>(response))
      .then(data=>setMarket({status:"ready",data:Array.isArray(data.markets)?data.markets:[]}))
      .catch((error:unknown)=>setMarket({status:"error",error:error instanceof Error?error.message:"Marchés indisponibles."}));
  },[]);
  useEffect(()=>{reload()},[reload]);
  return {...market,reload};
}

export function useMarketDetail(symbol:string,range:string){
  const [state,setState]=useState<AsyncState<MarketDetail>>({status:"loading"});
  const [retryKey,setRetryKey]=useState(0);
  const reload=useCallback(()=>setRetryKey(value=>value+1),[]);
  useEffect(()=>{
    if(!symbol)return;
    const controller=new AbortController();
    setState({status:"loading"});
    fetch(`/api/market/details/${encodeURIComponent(symbol)}?range=${encodeURIComponent(range)}`,{signal:controller.signal,headers:{Accept:"application/json"}})
      .then(response=>readJson<MarketDetail>(response))
      .then(data=>{if(!controller.signal.aborted)setState({status:"ready",data})})
      .catch((error:unknown)=>{
        if(controller.signal.aborted)return;
        setState({status:"error",error:error instanceof Error?error.message:"Détail indisponible."});
      });
    return()=>controller.abort();
  },[symbol,range,retryKey]);
  return {...state,reload};
}

export async function submitSimulatedTrade(token:string,side:"buy"|"sell",asset:string,amount:number){
  const response=await fetch("/api/trades",{
    method:"POST",
    headers:{
      Authorization:`Bearer ${token}`,
      "Content-Type":"application/json",
      Accept:"application/json"
    },
    body:JSON.stringify({side,asset,amount})
  });
  return readJson<{ok:boolean;tradeId:number}>(response);
}
