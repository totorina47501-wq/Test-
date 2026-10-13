import test from "node:test";
import assert from "node:assert/strict";
import {subscriptionUpdate,applyVerifiedStripeEvent} from "../src/stripe-webhook-events.js";
const evt=(id,type,obj)=>({id,type,data:{object:obj}});
test("rejects invalid events and ignores unrecognized events",()=>{
 assert.throws(()=>subscriptionUpdate({id:"bad",type:"unknown"}));
 assert.equal(subscriptionUpdate(evt("evt_abc","invoice.created",{})),null);
 assert.equal(subscriptionUpdate(evt("evt_abc","checkout.session.completed",{mode:"subscription",payment_status:"unpaid",metadata:{userId:"1",plan:"pro"}})),null);
});
test("checkout requires paid subscription and bounded owner",()=>{
 const e=evt("evt_abc","checkout.session.completed",{mode:"subscription",payment_status:"paid",customer:"cus_1",subscription:"sub_1",metadata:{userId:"7",plan:"pro"}});
 assert.equal(subscriptionUpdate(e).plan,"pro");
 assert.equal(subscriptionUpdate({...e,data:{object:{...e.data.object,metadata:{userId:"invalid",plan:"pro"}}}}),null);
});
test("subscription update rejects past_due and canceled access",()=>{
 assert.equal(subscriptionUpdate(evt("evt_x","customer.subscription.updated",{customer:"cus_1",id:"sub_1",status:"past_due",metadata:{plan:"elite"}})).plan,"free");
 assert.equal(subscriptionUpdate(evt("evt_y","customer.subscription.deleted",{customer:"cus_1",id:"sub_1",status:"active",metadata:{plan:"pro"}})).subscription,null);
});
test("durable event key avoids applying duplicate events",async()=>{
 let events=new Set(),writes=0;
 const client={async query(sql,args){if(sql.startsWith("INSERT INTO")){if(events.has(args[0]))return {rowCount:0};events.add(args[0]);return {rowCount:1}}if(sql.startsWith("UPDATE users"))writes++;return {rowCount:1}},release(){}};
 const pool={async connect(){return client}};
 const e=evt("evt_test_123","customer.subscription.deleted",{customer:"cus_1",id:"sub_1",metadata:{userId:"7",plan:"pro"}});
 assert.equal((await applyVerifiedStripeEvent(pool,e)).applied,true);
 assert.equal((await applyVerifiedStripeEvent(pool,e)).duplicate,true);
 assert.equal(writes,1);
});
