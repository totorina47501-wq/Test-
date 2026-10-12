import test from "node:test";
import assert from "node:assert/strict";
import {compareQuantumFund} from "../src/quantum-fund-lab.js";
const curve=(rate)=>Array.from({length:45},(_,i)=>({timestamp:Date.UTC(2026,0,i+1),equity:1000*Math.pow(1+rate,i)}));
test("compares three simulated architectures out of sample",()=>{
 const result=compareQuantumFund({agents:{alpha:curve(.01),beta:curve(.003)},feeRate:.001});
 assert.equal(result.simulationOnly,true);
 assert.equal(result.trainPoints+result.testPoints,44);
 assert.ok(Number.isFinite(result.strategies.quantumFund.returnPct));
 assert.equal(result.strategies.single.agent,"alpha");
});
test("rejects misaligned timestamps",()=>{
 const a=curve(.01),b=curve(.02);b[3].timestamp+=1;
 assert.throws(()=>compareQuantumFund({agents:{a,b}}),/timestamps/);
});
test("rejects invalid settings",()=>assert.throws(()=>compareQuantumFund({agents:{a:curve(.01),b:curve(.02)},feeRate:-1}),/parameters/));
