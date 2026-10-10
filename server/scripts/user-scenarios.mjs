// Isolated user journey: never point this at a deployed service or real funds.
import assert from "node:assert/strict";
import crypto from "node:crypto";

const base="http://127.0.0.1:3000";
const email=`scenario-${crypto.randomUUID()}@example.invalid`;
const password=crypto.randomBytes(24).toString("hex");
async function request(path,{method="GET",token,body,headers={}}={}){
  const response=await fetch(base+path,{method,headers:{...headers,...(token?{Authorization:`Bearer ${token}`}:{}),...(body?{"Content-Type":"application/json"}:{})},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(20000)});
  let json;try{json=await response.json()}catch{json={}};
  return {status:response.status,data:json};
}
async function main(){
  const health=await request("/api/health");assert.equal(health.status,200,"health");
  const demoPlans=await request("/api/plans/demo");assert.equal(demoPlans.status,200,"demo plan catalog");
  assert.equal(demoPlans.data.mode,"simulation","subscriptions marked as simulation");
  assert.equal(demoPlans.data.requiresPayment,false,"demo subscriptions require no external provider");
  assert.equal(demoPlans.data.plans?.find(plan=>plan.id==="free")?.maxActiveBots,1,"Free bot cap");
  const signup=await request("/api/auth/signup",{method:"POST",body:{email,password,first_name:"Scenario",last_name:"Test",country:"France",city:"Paris",postal_code:"75001"}});
  assert.equal(signup.status,201,`signup: ${JSON.stringify(signup.data)}`);
  assert.ok(signup.data.token,"signup token");
  const badLogin=await request("/api/auth/login",{method:"POST",body:{email,password:password+"-wrong"}});
  assert.equal(badLogin.status,401,"wrong password must be rejected");
  const login=await request("/api/auth/login",{method:"POST",body:{email,password}});
  assert.equal(login.status,200,"login");assert.ok(login.data.token,"login token");
  const token=login.data.token;
  const denied=await request("/api/portfolio");assert.equal(denied.status,401,"protected portfolio");
  const dashboard=await request("/api/dashboard",{token});assert.equal(dashboard.status,200,"authenticated dashboard");
  const analytics=await request("/api/dashboard/analytics",{token});assert.equal(analytics.status,200,"authenticated dashboard analytics");
  const malformed=await request("/api/dashboard",{token:"invalid.jwt.token"});assert.equal(malformed.status,401,"invalid token rejected");
  const initial=await request("/api/portfolio",{token});assert.equal(initial.status,200,"initial portfolio");
  assert.ok(Number(initial.data.cash)>=20,"demo cash available");
  const buy=await request("/api/trades",{method:"POST",token,body:{side:"buy",asset:"BTC",amount:10}});
  assert.equal(buy.status,201,`demo buy: ${JSON.stringify(buy.data)}`);
  const afterBuy=await request("/api/portfolio",{token});assert.equal(afterBuy.status,200,"portfolio after buy");
  assert.ok(Number(afterBuy.data.cash)<Number(initial.data.cash),"buy debits cash");
  const sell=await request("/api/trades",{method:"POST",token,body:{side:"sell",asset:"BTC",amount:5}});
  assert.equal(sell.status,201,`demo sell: ${JSON.stringify(sell.data)}`);
  const afterSell=await request("/api/portfolio",{token});assert.equal(afterSell.status,200,"portfolio after sell");
  assert.equal(afterSell.data.integrity?.reconciliation?.ok,true,"trade history matches portfolio quantities");
  assert.equal(afterSell.data.integrity?.reconciliation?.tradeCount,2,"reconciliation includes all trades");
  assert.ok(Number(afterSell.data.cash)>Number(afterBuy.data.cash),"sell credits cash");
  // Invalid orders must never change demo balances or holdings.
  const beforeRejected=await request("/api/portfolio",{token});
  assert.equal(beforeRejected.status,200,"portfolio before rejected orders");
  for(const invalid of [
    {side:"buy",asset:"BTC",amount:-1},
    {side:"buy",asset:"BTC",amount:0},
    {side:"buy",asset:"BTC",amount:1e12},
    {side:"sell",asset:"BTC",amount:1e12},
    {side:"buy",asset:"INVALID",amount:10},
  ]){
    const rejected=await request("/api/trades",{method:"POST",token,body:invalid});
    assert.equal(rejected.status,400,`invalid order must fail: ${JSON.stringify(invalid)}`);
  }
  const afterRejected=await request("/api/portfolio",{token});
  assert.equal(afterRejected.status,200,"portfolio after rejected orders");
  assert.ok(Math.abs(Number(afterRejected.data.cash)-Number(beforeRejected.data.cash))<0.000001,"rejected orders preserve cash");
  const holdingsByAsset=(portfolio)=>Object.fromEntries((portfolio.holdings||[]).map(h=>[h.asset,Number(h.quantity)]));
  assert.deepEqual(holdingsByAsset(afterRejected.data),holdingsByAsset(beforeRejected.data),"rejected orders preserve holdings");
  // Replayed requests must never debit twice, even when sent concurrently.
  const beforeIdempotent=await request("/api/portfolio",{token});
  const idempotencyKey=`scenario_${crypto.randomUUID().replaceAll("-","")}`;
  const identical={method:"POST",token,headers:{"Idempotency-Key":idempotencyKey},body:{side:"buy",asset:"BTC",amount:7}};
  const responses=await Promise.all([request("/api/trades",identical),request("/api/trades",identical)]);
  assert.deepEqual(responses.map(r=>r.status).sort(),[200,201],"concurrent duplicate orders replay exactly once");
  assert.equal(responses[0].data.tradeId,responses[1].data.tradeId,"duplicate responses refer to same trade");
  const afterIdempotent=await request("/api/portfolio",{token});
  assert.ok(Math.abs((Number(beforeIdempotent.data.cash)-Number(afterIdempotent.data.cash))-7)<0.00001,"concurrent retry debits once");
  const conflict=await request("/api/trades",{method:"POST",token,headers:{"Idempotency-Key":idempotencyKey},body:{side:"buy",asset:"BTC",amount:8}});
  assert.equal(conflict.status,409,"reused key with different payload is rejected");
  const afterConflict=await request("/api/portfolio",{token});
  assert.ok(Math.abs(Number(afterConflict.data.cash)-Number(afterIdempotent.data.cash))<0.00001,"conflicting retry does not debit");
  const activity=await request("/api/activity",{token});assert.equal(activity.status,200,"activity");
  assert.ok(activity.data.trades?.some(t=>t.side==="buy"&&t.asset==="BTC"),"buy recorded");
  assert.ok(activity.data.trades?.some(t=>t.side==="sell"&&t.asset==="BTC"),"sell recorded");
  console.log("PASS: health, signup, wrong-password rejection, login/JWT, protected dashboard/analytics, invalid-token rejection, demo buy/sell, portfolio, activity");
}
main().catch(e=>{console.error("USER SCENARIO FAILED:",e);process.exitCode=1});
