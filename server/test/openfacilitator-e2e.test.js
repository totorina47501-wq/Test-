import test from "node:test";
import assert from "node:assert/strict";
import { createOpenFacilitator } from "../src/openfacilitator.js";
import { buildPaymentRequirements } from "../src/x402-quote.js";

function mockFetch(calls){
  return async(url,options={})=>{
    const body=options.body?JSON.parse(options.body):null;
    calls.push({url,body});
    const endpoint=new URL(url).pathname;
    const valid=body?.paymentPayload?.accepted?.network===body?.paymentRequirements?.network
      && body?.paymentPayload?.accepted?.asset===body?.paymentRequirements?.asset
      && body?.paymentPayload?.accepted?.amount===body?.paymentRequirements?.amount;
    if(endpoint==="/verify")return new Response(JSON.stringify({isValid:valid}),{status:valid?200:400});
    if(endpoint==="/settle")return new Response(JSON.stringify({success:valid,transaction:"testnet-proof"}),{status:valid?200:400});
    return new Response("{}",{status:404});
  };
}

test("x402 testnet verify then settle records a transaction proof",async()=>{
  const calls=[];
  const rail=createOpenFacilitator({base:"https://testnet.invalid",enabled:true,settlementEnabled:true,fetchImpl:mockFetch(calls)});
  const requirements=buildPaymentRequirements({protocolVersion:2,network:"eip155:84532",amountAtomic:"1000000",asset:"asset-testnet",payTo:"recipient-testnet"});
  const payload={accepted:requirements,mandate:"test-only"};
  assert.equal((await rail.verify(payload,requirements)).isValid,true);
  const settled=await rail.settle(payload,requirements);
  assert.equal(settled.success,true);
  assert.equal(settled.transaction,"testnet-proof");
  assert.deepEqual(calls.map(x=>new URL(x.url).pathname),["/verify","/settle"]);
});

test("x402 testnet rejects amount, network or asset tampering",async()=>{
  for(const field of ["amount","network","asset"]){
    const rail=createOpenFacilitator({base:"https://testnet.invalid",enabled:true,settlementEnabled:true,fetchImpl:mockFetch([])});
    const requirements=buildPaymentRequirements({protocolVersion:2,network:"eip155:84532",amountAtomic:"1000000",asset:"asset-testnet",payTo:"recipient-testnet"});
    const accepted={...requirements,[field]:field==="amount"?"2000000":field==="network"?"eip155:1":"other-asset"};
    await assert.rejects(()=>rail.verify({accepted},requirements));
  }
});
