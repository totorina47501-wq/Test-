import {createPaperAccount,executePaperSignal,paperEquity} from "./micro-alpha-paper.js";

// Transactional paper accounts: no shared wallet, exchange or real payment connection.
export async function paperSnapshot(client,userId){
 const result=await client.query("SELECT state FROM micro_alpha_accounts WHERE user_id=$1",[userId]);
 const account=result.rows[0]?.state||createPaperAccount({cash:1000});
 return {account,equity:paperEquity(account),valuation:"cash-only-without-fresh-quotes",simulation:true};
}
export async function applyPersistentPaperSignal(client,userId,signal){
 await client.query("BEGIN");
 try{
  await client.query("INSERT INTO micro_alpha_accounts(user_id,state) VALUES($1,$2::jsonb) ON CONFLICT(user_id) DO NOTHING",[userId,JSON.stringify(createPaperAccount({cash:1000}))]);
  const row=await client.query("SELECT state FROM micro_alpha_accounts WHERE user_id=$1 FOR UPDATE",[userId]);
  // A manually supplied price is explicitly a scenario quote, never a live market quote.
  const result=executePaperSignal(row.rows[0].state,{...signal,asset:"BTC",timestamp:Date.now(),feeRate:.0015,minOrderEur:1,maxOrderEur:50});
  await client.query("UPDATE micro_alpha_accounts SET state=$2::jsonb,updated_at=NOW() WHERE user_id=$1",[userId,JSON.stringify(result.account)]);
  await client.query("COMMIT");
  return {...result,simulation:true,quoteSource:"manual-scenario"};
 }catch(e){await client.query("ROLLBACK");throw e;}
}
export async function resetPersistentPaper(client,userId){
 await client.query("BEGIN");
 try{
  await client.query("INSERT INTO micro_alpha_accounts(user_id,state) VALUES($1,$2::jsonb) ON CONFLICT(user_id) DO NOTHING",[userId,JSON.stringify(createPaperAccount({cash:1000}))]);
  await client.query("SELECT user_id FROM micro_alpha_accounts WHERE user_id=$1 FOR UPDATE",[userId]);
  await client.query("UPDATE micro_alpha_accounts SET state=$2::jsonb,updated_at=NOW() WHERE user_id=$1",[userId,JSON.stringify(createPaperAccount({cash:1000}))]);
  await client.query("COMMIT");
  return {simulation:true,reset:true};
 }catch(e){await client.query("ROLLBACK");throw e;}
}
