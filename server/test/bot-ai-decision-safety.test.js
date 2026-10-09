import test from "node:test";
import assert from "node:assert/strict";
import {evaluateBot} from "../src/bot-ai-engine.js";

const portfolio={total:1000,cash:1000,positions:[]};
const history=[{timestamp:1,price:100},{timestamp:2,price:102},{timestamp:3,price:105},{timestamp:4,price:110},{timestamp:5,price:114},{timestamp:6,price:119}];

test("AI bot holds without a valid market quote",async()=>{
 const decision=await evaluateBot({type:"gold",market:[{symbol:"BTC",price:0,change24h:9}],histories:{BTC:history},portfolio});
 assert.equal(decision.action,"hold");
 assert.equal(decision.fraction,0);
 assert.deepEqual(Object.keys(decision.forecasts),[]);
});

test("AI bot never ranks an asset with too little price history",async()=>{
 const decision=await evaluateBot({type:"gold",market:[{symbol:"BTC",price:119,change24h:10}],histories:{BTC:history.slice(0,3)},portfolio});
 assert.equal(decision.action,"hold");
 assert.equal(decision.fraction,0);
 assert.equal(decision.selected,null);
 assert.deepEqual(Object.keys(decision.forecasts),[]);
});

test("AI bot ranks only assets with sufficient valid history",async()=>{
 const decision=await evaluateBot({type:"silver",market:[{symbol:"BTC",price:119,change24h:9},{symbol:"ETH",price:3000,change24h:50}],histories:{BTC:history,ETH:history.slice(0,2)},portfolio});
 assert.deepEqual(Object.keys(decision.forecasts),["BTC"]);
 assert.ok(["hold","buy","sell"].includes(decision.action));
 assert.notEqual(decision.asset,"ETH");
});

test("AI bot ignores NaN, infinity and negative quotes",async()=>{
 const market=[{symbol:"BTC",price:NaN},{symbol:"ETH",price:Infinity},{symbol:"SOL",price:-2}];
 const decision=await evaluateBot({type:"shield",market,histories:{BTC:history,ETH:history,SOL:history},portfolio});
 assert.equal(decision.action,"hold");
 assert.deepEqual(Object.keys(decision.forecasts),[]);
});
