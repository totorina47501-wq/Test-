import test from "node:test";
import assert from "node:assert/strict";
import {applyPersistentPaperSignal,paperSnapshot,resetPersistentPaper} from "../src/micro-alpha-store.js";
import {createPaperAccount} from "../src/micro-alpha-paper.js";
function fakeDb(){
 const rows=new Map();const calls=[];
 return {rows,calls,async query(sql,params=[]){
  calls.push({sql,params});
  if(sql==="BEGIN"||sql==="COMMIT"||sql==="ROLLBACK")return {rows:[]};
  if(sql.startsWith("INSERT INTO micro_alpha_accounts")){if(!rows.has(params[0]))rows.set(params[0],JSON.parse(params[1]));return {rows:[]};}
  if(sql.startsWith("SELECT state"))return {rows:rows.has(params[0])?[{state:rows.get(params[0])}]:[]};
  if(sql.startsWith("SELECT user_id"))return {rows:[{user_id:params[0]}]};
  if(sql.startsWith("UPDATE micro_alpha_accounts")){rows.set(params[0],JSON.parse(params[1]));return {rows:[]};}
  throw Error("Unexpected SQL "+sql);
 }};
}
const signal={id:"persistent-signal-001",action:"buy",amountEur:20,price:50000};
test("paper account persists per user and deduplicates within locked transaction",async()=>{
 const db=fakeDb();
 const a=await applyPersistentPaperSignal(db,11,signal);
 assert.equal(a.executed,true);assert.equal(a.account.trades.length,1);
 const duplicate=await applyPersistentPaperSignal(db,11,signal);
 assert.equal(duplicate.reason,"duplicate");
 assert.equal((await paperSnapshot(db,11)).account.trades.length,1);
 assert.equal((await paperSnapshot(db,22)).account.trades.length,0);
 assert.ok(db.calls.some(x=>x.sql.includes("FOR UPDATE")));
 assert.ok(db.calls.some(x=>x.sql==="COMMIT"));
});
test("paper rejects over-limit and insufficient holdings without changing cash",async()=>{
 const db=fakeDb();
 assert.equal((await applyPersistentPaperSignal(db,1,{...signal,id:"too-large-00001",amountEur:60})).reason,"order-limit");
 assert.equal((await applyPersistentPaperSignal(db,1,{...signal,id:"sell-empty-0001",action:"sell"})).reason,"insufficient-position");
 assert.equal((await paperSnapshot(db,1)).account.cash,1000);
});
test("paper reset is user-isolated",async()=>{
 const db=fakeDb();
 await applyPersistentPaperSignal(db,1,signal);
 await applyPersistentPaperSignal(db,2,{...signal,id:"other-user-0001"});
 await resetPersistentPaper(db,1);
 assert.equal((await paperSnapshot(db,1)).account.trades.length,0);
 assert.equal((await paperSnapshot(db,2)).account.trades.length,1);
});
test("paper storage rolls back on malformed signal",async()=>{
 const db=fakeDb();
 await assert.rejects(applyPersistentPaperSignal(db,1,{...signal,price:-1}),/Invalid/);
 assert.ok(db.calls.some(x=>x.sql==="ROLLBACK"));
});
