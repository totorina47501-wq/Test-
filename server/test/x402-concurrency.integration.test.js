import test from "node:test";
import assert from "node:assert/strict";
import pg from "pg";
import crypto from "node:crypto";

const {Pool}=pg;
const databaseUrl=process.env.DATABASE_URL;

test("two concurrent consumers cannot settle the same quote twice",{skip:!databaseUrl},async()=>{
  const pool=new Pool({connectionString:databaseUrl,ssl:false});
  const table="x402_concurrency_"+crypto.randomBytes(6).toString("hex");
  await pool.query(`CREATE TABLE ${table}(id UUID PRIMARY KEY,status TEXT NOT NULL DEFAULT 'pending',idempotency_key TEXT,settlement_receipt JSONB)`);
  const id=crypto.randomUUID();
  await pool.query(`INSERT INTO ${table}(id) VALUES($1)`,[id]);
  let providerCalls=0;

  async function consume(key){
    const client=await pool.connect();
    try{
      await client.query("BEGIN");
      const quote=(await client.query(`SELECT * FROM ${table} WHERE id=$1 FOR UPDATE`,[id])).rows[0];
      if(quote.status==="settled"&&quote.idempotency_key===key){await client.query("ROLLBACK");return "idempotent";}
      if(quote.status!=="pending"){await client.query("ROLLBACK");return "used";}
      await client.query(`UPDATE ${table} SET status='verified',idempotency_key=$2 WHERE id=$1`,[id,key]);
      providerCalls+=1;
      await new Promise(resolve=>setTimeout(resolve,40));
      await client.query(`UPDATE ${table} SET status='settled',settlement_receipt=$2 WHERE id=$1`,[id,{transaction:"proof-"+key}]);
      await client.query("COMMIT");
      return "settled";
    }catch(error){
      await client.query("ROLLBACK").catch(()=>{});
      throw error;
    }finally{client.release();}
  }

  try{
    const results=await Promise.all([consume("same-key-123"),consume("same-key-123")]);
    assert.deepEqual(results.sort(),["idempotent","settled"]);
    assert.equal(providerCalls,1);
    const row=(await pool.query(`SELECT status,idempotency_key,settlement_receipt FROM ${table} WHERE id=$1`,[id])).rows[0];
    assert.equal(row.status,"settled");
    assert.equal(row.idempotency_key,"same-key-123");
    assert.equal(row.settlement_receipt.transaction,"proof-same-key-123");
  }finally{
    await pool.query(`DROP TABLE IF EXISTS ${table}`);
    await pool.end();
  }
});

test("a competing different idempotency key is rejected after the first settlement",{skip:!databaseUrl},async()=>{
  const pool=new Pool({connectionString:databaseUrl,ssl:false});
  const table="x402_replay_"+crypto.randomBytes(6).toString("hex");
  await pool.query(`CREATE TABLE ${table}(id UUID PRIMARY KEY,status TEXT NOT NULL DEFAULT 'pending',idempotency_key TEXT)`);
  const id=crypto.randomUUID();
  await pool.query(`INSERT INTO ${table}(id,status,idempotency_key) VALUES($1,'settled','first-key-123')`,[id]);
  try{
    const quote=(await pool.query(`SELECT * FROM ${table} WHERE id=$1`,[id])).rows[0];
    assert.equal(quote.status,"settled");
    assert.notEqual(quote.idempotency_key,"second-key-456");
    assert.equal(quote.status==="settled"&&quote.idempotency_key==="second-key-456",false);
  }finally{
    await pool.query(`DROP TABLE IF EXISTS ${table}`);
    await pool.end();
  }
});
