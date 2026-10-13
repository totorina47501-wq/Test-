// Pre-contract provider boundary. No network access, no credentials and no real orders.
export const PROVIDERS = Object.freeze(["venga", "bitpanda"]);
export const LIVE_DISABLED = "LIVE_CRYPTO_NOT_AUTHORIZED";
const CAPABILITIES = Object.freeze({userProvisioning:"unverified",kyc:"unverified",custody:"unverified",fiatDeposits:"unverified",fiatWithdrawals:"unverified",quote:"unverified",buy:"unverified",sell:"unverified",swaps:"unverified",webhook:"unverified"});
const ACTIONS = Object.freeze(["createCustomer","startKyc","getBalances","getQuote","submitOrder","getOrder","getTransactions","createDeposit","requestWithdrawal","processWebhook"]);
function disabled(){throw Object.assign(new Error("Real crypto operations are disabled pending partner contract, compliance approval and audited integration"),{code:LIVE_DISABLED})}
export function providerConfig(env=process.env){const selected=env.CRYPTO_PROVIDER||"none";if(!["none",...PROVIDERS].includes(selected))throw new Error("Invalid crypto provider");return Object.freeze({selected,enabled:false,mode:"precontract"})}
export function createProviderAdapter(provider){if(!PROVIDERS.includes(provider))throw new Error("Unsupported crypto provider");return Object.freeze({provider,mode:"precontract",capabilities:CAPABILITIES,...Object.fromEntries(ACTIONS.map(action=>[action,async()=>disabled()]))})}
export function assertRealTradingDisabled(){throw Object.assign(new Error("Real-money crypto trading is not available"),{code:LIVE_DISABLED})}

// Deterministic sandbox contract fixture, NOT a partner sandbox or a live API.
// Every record is in-memory, non-persistent and explicitly marked synthetic.
export function createContractFixture({provider="bitpanda",clock=()=>Date.now()}={}){
 if(!PROVIDERS.includes(provider))throw new Error("Unsupported crypto provider");
 const events=new Map();const orders=new Map();const deliveries=new Set();
 const validId=v=>typeof v==="string"&&/^[a-zA-Z0-9_-]{4,80}$/.test(v);
 return Object.freeze({
  provider,mode:"fixture-only",realMoney:false,
  previewQuote({userId,asset,side,amount}){
   if(!validId(userId)||!["BTC","ETH"].includes(asset)||!["buy","sell"].includes(side)||!Number.isFinite(amount)||amount<=0)throw Object.assign(new Error("Invalid synthetic quote"),{code:"FIXTURE_INVALID"});
   const issuedAt=clock();return Object.freeze({quoteId:"fixture-"+userId+"-"+issuedAt,provider,asset,side,amount,currency:"EUR",fee:0,issuedAt,expiresAt:issuedAt+30_000,synthetic:true});
  },
  submitOrder({userId,idempotencyKey,quote}){
   if(!validId(userId)||!validId(idempotencyKey)||!quote||quote.synthetic!==true||quote.provider!==provider||quote.quoteId!=="fixture-"+userId+"-"+quote.issuedAt)throw Object.assign(new Error("Invalid synthetic order"),{code:"FIXTURE_INVALID"});
   if(clock()>quote.expiresAt)throw Object.assign(new Error("Expired synthetic quote"),{code:"FIXTURE_QUOTE_EXPIRED"});
   const key=userId+":"+idempotencyKey;const fingerprint=JSON.stringify([quote.quoteId,quote.asset,quote.side,quote.amount]);
   if(orders.has(key)){const old=orders.get(key);if(old.fingerprint!==fingerprint)throw Object.assign(new Error("Idempotency conflict"),{code:"FIXTURE_CONFLICT"});return old.order}
   const order=Object.freeze({id:"fixture-order-"+(orders.size+1),userId,provider,asset:quote.asset,side:quote.side,amount:quote.amount,status:"pending",synthetic:true});
   orders.set(key,{fingerprint,order});return order;
  },
  ingestEvent({eventId,orderId,userId,status,signatureVerified=false}){
   if(!signatureVerified||!validId(eventId)||!validId(userId)||!["settled","rejected"].includes(status))throw Object.assign(new Error("Unverified synthetic event"),{code:"FIXTURE_EVENT_REJECTED"});
   if(deliveries.has(eventId))return Object.freeze({duplicate:true,applied:false});
   const found=[...orders.values()].find(x=>x.order.id===orderId&&x.order.userId===userId);
   if(!found)throw Object.assign(new Error("Unknown synthetic order"),{code:"FIXTURE_ORDER_UNKNOWN"});
   if(events.has(orderId))throw Object.assign(new Error("Final state cannot change"),{code:"FIXTURE_FINAL"});
   deliveries.add(eventId);events.set(orderId,status);return Object.freeze({duplicate:false,applied:true,status,synthetic:true});
  },
  reconcile({userId,orderId}){if(!validId(userId))throw new Error("Invalid user");const found=[...orders.values()].find(x=>x.order.id===orderId&&x.order.userId===userId);if(!found)throw Object.assign(new Error("Not found"),{code:"FIXTURE_ORDER_UNKNOWN"});return Object.freeze({...found.order,status:events.get(orderId)||"pending"})}
 });
}
