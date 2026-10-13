import test from "node:test";
import assert from "node:assert/strict";
import {observedPerformance,recordMarketValuation,marketHistory,clearMarketHistory} from "../src/micro-alpha-history.js";
const verified=(stamp,equity)=>({valuation:"verified-market-snapshot",marketVerified:true,priceSource:"CoinGecko",priceUpdatedAt:stamp,priceEur:50000,equityEur:equity,pnlEur:equity-1000,exposureEur:50});
function db(){
 const rows=new Map();
 return {rows,async query(sql,params=[]){
  if(sql.startsWith("INSERT INTO micro_alpha_valuations")){const [id,ts,price,equity,pnl]=params;rows.set(id+":"+ts,{observedAt:new Date(ts).toISOString(),priceUpdatedAt:ts,priceEur:price,equityEur:equity,pnlEur:pnl,userId:id});return {rows:[{price_updated_at:new Date(ts)}]};}
  if(sql.startsWith("SELECT observed_at"))return {rows:[...rows.values()].filter(x=>x.userId===params[0]).sort((a,b)=>b.priceUpdatedAt-a.priceUpdatedAt).slice(0,params[1])};
  if(sql.startsWith("DELETE FROM micro_alpha_valuations")){for(const [key,value] of rows)if(value.userId===params[0])rows.delete(key);return {rows:[]};}
  throw Error("unexpected SQL "+sql);
 }};
}
test("records only verified quotes, per user, deduplicates quote timestamps and calculates observed drawdown",async()=>{
 const client=db();
 await assert.rejects(recordMarketValuation(client,1,{...verified(1000,1000),marketVerified:false}),/Unverified/);
 await recordMarketValuation(client,1,verified(1000,1000));
 await recordMarketValuation(client,1,verified(2000,1200));
 await recordMarketValuation(client,1,verified(3000,900));
 await recordMarketValuation(client,1,verified(3000,900));
 await recordMarketValuation(client,2,verified(3000,2000));
 const one=await marketHistory(client,1);const two=await marketHistory(client,2);
 assert.equal(one.sampleCount,3);
 assert.equal(one.maxObservedDrawdownPct,25);
 assert.equal(two.sampleCount,1);
 assert.equal(two.maxObservedDrawdownPct,null);
 assert.equal(one.points[2].equityEur,900);
 await clearMarketHistory(client,1);
 assert.equal((await marketHistory(client,1)).sampleCount,0);
 assert.equal((await marketHistory(client,2)).sampleCount,1);
});
test("history is empty without observations and rejects broken equity",()=>{
 assert.equal(observedPerformance([]).maxObservedDrawdownPct,null);
 assert.throws(()=>observedPerformance([{equityEur:-3}]),/Invalid equity/);
});
