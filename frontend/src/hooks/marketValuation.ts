import type {Dashboard} from "./useBitGoldDashboard";
import type {LiveQuote} from "./useLiveMarket";
// UI-only indicative mark-to-market; never changes the persisted simulation ledger.
export function revalueDashboard(dashboard:Dashboard,quotes:LiveQuote[]):Dashboard{
 const prices=new Map(quotes.filter(q=>Number.isFinite(q.price)&&q.price>0&&q.priceFresh!==false&&(!q.priceUpdatedAt||Date.now()-q.priceUpdatedAt<=30000)).map(q=>[q.symbol,q.price]));
 const positions=dashboard.portfolio.positions.map(p=>{const price=prices.get(p.asset)??p.price;return {...p,price,value:p.quantity*price}});
 const invested=positions.reduce((sum,p)=>sum+p.value,0);
 const total=dashboard.portfolio.cash+invested;
 const normalized=positions.map(p=>({...p,allocation:total>0?p.value/total*100:0}));
 return {...dashboard,portfolio:{...dashboard.portfolio,positions:normalized,invested,total,returnEur:dashboard.portfolio.returnEur+(invested-dashboard.portfolio.invested),returnPct:dashboard.portfolio.returnPct}};
}
