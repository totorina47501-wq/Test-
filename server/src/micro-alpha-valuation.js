import {paperEquity} from "./micro-alpha-paper.js";

// Explicit hypothetical mark-to-market only. This never accepts a cached or unverified quote as live.
export function scenarioValuation(account,price){
 if(!account||!Number.isFinite(account.cash)||!Number.isFinite(account.initialCash)||account.initialCash<=0||!account.positions||typeof account.positions!=="object")throw Error("Invalid paper account");
 if(typeof price!=="number"||!Number.isFinite(price)||price<=0||price>10000000)throw Error("Invalid scenario price");
 const positions=Object.entries(account.positions);
 if(positions.some(([asset,quantity])=>asset!=="BTC"||!Number.isFinite(quantity)||quantity<0))throw Error("Unsupported paper position");
 const equity=paperEquity(account,{BTC:price});
 const pnlEur=equity-account.initialCash;
 const pnlPct=pnlEur/account.initialCash*100;
 const exposureEur=(account.positions.BTC||0)*price;
 if(![equity,pnlEur,pnlPct,exposureEur].every(Number.isFinite))throw Error("Invalid scenario valuation");
 return {simulation:true,valuation:"manual-scenario-only",marketVerified:false,priceSource:"user-input",priceEur:price,cashEur:account.cash,btcQuantity:account.positions.BTC||0,exposureEur,equityEur:equity,pnlEur,pnlPct};
}

export function verifiedMarketValuation(account,quote,now=Date.now(),maxAgeMs=60000){
 if(!quote||quote.symbol!=="BTC"||quote.priceFresh!==true||typeof quote.priceUpdatedAt!=="number"||!Number.isFinite(quote.priceUpdatedAt)||!Number.isFinite(now)||quote.priceUpdatedAt>now||now-quote.priceUpdatedAt>maxAgeMs)throw Error("Fresh BTC market quote unavailable");
 const price=quote.price;
 const base=scenarioValuation(account,price);
 return {...base,valuation:"verified-market-snapshot",marketVerified:true,priceSource:"CoinGecko",priceUpdatedAt:quote.priceUpdatedAt,verifiedAt:now};
}
