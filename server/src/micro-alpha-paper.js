// Pure, simulation-only paper execution. No exchange client or real-order path.
const finitePositive = value => Number.isFinite(value) && value > 0;
export function createPaperAccount({cash=10000, maxDrawdownPct=20}={}) {
  if (!finitePositive(cash) || !finitePositive(maxDrawdownPct) || maxDrawdownPct>100) throw Error("Invalid paper risk configuration");
  return {cash,initialCash:cash,peakEquity:cash,maxDrawdownPct,positions:{},trades:[],seenIds:[],stopped:false};
}
export function paperEquity(account,quotes={}) {
  return account.cash+Object.entries(account.positions).reduce((sum,[asset,quantity])=>sum+quantity*(finitePositive(quotes[asset])?quotes[asset]:0),0);
}
export function executePaperSignal(account,{id,action,asset,amountEur,price,timestamp,feeRate=.0015,spreadRate=0,slippageRate=0,minOrderEur=1,maxOrderEur=50},quotes={}) {
  if (!account || !Array.isArray(account.trades) || !Array.isArray(account.seenIds)) throw Error("Invalid paper account");
  if (typeof id!=="string" || !id.trim() || !/^[A-Z0-9]{2,15}$/.test(asset||"") || !["buy","sell"].includes(action)) throw Error("Invalid paper signal");
  if (account.seenIds.includes(id)) return {account,executed:false,reason:"duplicate"};
  if (![amountEur,price,timestamp,feeRate,spreadRate,slippageRate,minOrderEur,maxOrderEur].every(Number.isFinite) || !finitePositive(amountEur) || !finitePositive(price) || !finitePositive(timestamp) || feeRate<0 || feeRate>=1 || spreadRate<0 || spreadRate>=1 || slippageRate<0 || slippageRate>=1 || minOrderEur<=0 || maxOrderEur<minOrderEur) throw Error("Invalid paper execution parameters");
  const equity=paperEquity(account,{...quotes,[asset]:price});
  const peak=Math.max(account.peakEquity,equity);
  const stopped=account.stopped || (peak-equity)/peak*100>=account.maxDrawdownPct;
  const next={...account,peakEquity:peak,stopped,positions:{...account.positions},trades:[...account.trades],seenIds:[...account.seenIds,id]};
  if (action==="buy" && stopped) return {account:next,executed:false,reason:"drawdown-stop"};
  if (amountEur<minOrderEur || amountEur>maxOrderEur) return {account:next,executed:false,reason:"order-limit"};
  const executionPrice=price*(1+(action==="buy"?1:-1)*(spreadRate/2+slippageRate));
  if (!finitePositive(executionPrice)) throw Error("Invalid execution price");
  const fee=amountEur*feeRate;
  const quantity=amountEur/executionPrice;
  if (action==="buy") {
    if (amountEur+fee>next.cash) return {account:next,executed:false,reason:"insufficient-cash"};
    next.cash-=amountEur+fee;
    next.positions[asset]=(next.positions[asset]||0)+quantity;
  } else {
    if ((next.positions[asset]||0)+1e-12<quantity) return {account:next,executed:false,reason:"insufficient-position"};
    next.positions[asset]-=quantity;
    next.cash+=amountEur-fee;
  }
  next.trades.push({id,action,asset,amountEur,executionPrice,quantity,fee,timestamp,simulation:true});
  return {account:next,executed:true,reason:"paper-only"};
}
