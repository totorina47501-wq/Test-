// Shared browser market feed: reconnect with backoff, REST fallback stays authoritative.
import {useEffect} from "react";
export type LiveQuote={symbol:string;price:number;change24h?:number;priceUpdatedAt?:number;priceFresh?:boolean;priceSource?:string};
export function useLiveMarket(onQuotes:(rows:LiveQuote[])=>void){
 useEffect(()=>{
  if(typeof WebSocket==="undefined")return;
  let active=true;let socket:WebSocket|null=null;let retry:ReturnType<typeof setTimeout>|undefined;let attempt=0;
  const connect=()=>{
   if(!active||document.visibilityState==="hidden")return;
   socket=new WebSocket((location.protocol==="https:"?"wss:":"ws:")+"//"+location.host+"/api/market/ws");
   socket.onopen=()=>{attempt=0};
   socket.onmessage=(event:MessageEvent)=>{
    try{const data=JSON.parse(String(event.data));if(data?.type==="market"&&Array.isArray(data.markets))onQuotes(data.markets.filter((row:LiveQuote)=>typeof row.symbol==="string"&&Number.isFinite(row.price)&&row.price>0&&row.priceFresh===true&&typeof row.priceUpdatedAt==="number"&&Date.now()-row.priceUpdatedAt>=0&&Date.now()-row.priceUpdatedAt<=30000))}catch{/* invalid frame */}
   };
   socket.onclose=()=>{if(active&&document.visibilityState!=="hidden")retry=setTimeout(connect,Math.min(30000,1000*2**Math.min(attempt++,5)))};
   socket.onerror=()=>socket?.close();
  };
  const visibility=()=>{if(document.visibilityState==="hidden"){clearTimeout(retry);socket?.close()}else if(active&&(!socket||socket.readyState>=WebSocket.CLOSING)){clearTimeout(retry);connect()}};
  document.addEventListener("visibilitychange",visibility);connect();
  return()=>{active=false;clearTimeout(retry);document.removeEventListener("visibilitychange",visibility);socket?.close()};
 },[onQuotes]);
}
