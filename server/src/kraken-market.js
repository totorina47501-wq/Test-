// Public market-data only. Never used to execute orders or change bot strategies.
export const KRAKEN_PAIRS=Object.freeze({BTC:"BTC/EUR",ETH:"ETH/EUR",SOL:"SOL/EUR",LINK:"LINK/EUR",AVAX:"AVAX/EUR",ADA:"ADA/EUR",XRP:"XRP/EUR",LTC:"LTC/EUR",DOT:"DOT/EUR"});
const PAIR_SYMBOLS=Object.fromEntries(Object.entries(KRAKEN_PAIRS).map(([symbol,pair])=>[pair,symbol]));
export function parseKrakenTicker(message,now=Date.now()){
  if(message?.channel!=="ticker"||!Array.isArray(message.data))return [];
  return message.data.flatMap(row=>{
    const symbol=PAIR_SYMBOLS[row?.symbol];const price=Number(row?.last);
    if(!symbol||!Number.isFinite(price)||price<=0)return [];
    const change24h=Number(row?.change_pct);
    return [{symbol,price,priceUpdatedAt:now,change24h:Number.isFinite(change24h)?change24h:null}];
  });
}
export function createKrakenFeed({WebSocketImpl=globalThis.WebSocket,now=Date.now,connect=true}={}){
  const quotes=new Map();let socket=null;let retry=null;let attempt=0;let stopped=false;
  const endpoint="wss://ws.kraken.com/v2";
  function start(){
    if(stopped||!WebSocketImpl)return;
    try{socket=new WebSocketImpl(endpoint)}catch{schedule();return}
    socket.addEventListener("open",()=>{attempt=0;socket.send(JSON.stringify({method:"subscribe",params:{channel:"ticker",symbol:Object.values(KRAKEN_PAIRS),snapshot:true}}))});
    socket.addEventListener("message",event=>{try{for(const quote of parseKrakenTicker(JSON.parse(String(event.data)),now()))quotes.set(quote.symbol,quote)}catch{/* invalid upstream payload */}});
    socket.addEventListener("close",schedule);
    socket.addEventListener("error",()=>{try{socket.close()}catch{}});
  }
  function schedule(){if(stopped||retry)return;retry=setTimeout(()=>{retry=null;start()},Math.min(30000,1000*2**Math.min(attempt++,5)));retry.unref?.()}
  if(connect)start();
  return {
    quote(symbol,maxAgeMs=30000){const q=quotes.get(symbol);return q&&now()-q.priceUpdatedAt<=maxAgeMs?q:null},
    overlay(rows){return rows.map(row=>{const quote=this.quote(row.symbol);return quote?{...row,price:quote.price,priceFresh:true,priceUpdatedAt:quote.priceUpdatedAt,change24h:quote.change24h??row.change24h,priceSource:"Kraken"}:{...row,priceSource:"CoinGecko"}})},
    stop(){stopped=true;clearTimeout(retry);try{socket?.close()}catch{}}
  };
}
