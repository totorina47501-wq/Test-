export const TRADE_COMPLETED_EVENT="bitgold:simulated-trade-completed";

export function notifyTradeCompleted(){
  window.dispatchEvent(new Event(TRADE_COMPLETED_EVENT));
}

export function onTradeCompleted(refresh:()=>void){
  window.addEventListener(TRADE_COMPLETED_EVENT,refresh);
  return ()=>window.removeEventListener(TRADE_COMPLETED_EVENT,refresh);
}
