// Run explicitly during a quiet maintenance window: node server/scripts/apply-history-indexes.mjs
import "dotenv/config";
import pg from "pg";
import {historyIndexes} from "../src/sql-history-indexes.js";
if(!process.env.DATABASE_URL)throw Error("DATABASE_URL required");
const pool=new pg.Pool({connectionString:process.env.DATABASE_URL,ssl:process.env.DATABASE_SSL==="false"?false:{rejectUnauthorized:false}});
try{
 for(const statement of historyIndexes){
  await pool.query(statement);
  console.log("Applied:",statement.match(/idx_[a-z_]+/)[0]);
 }
}finally{await pool.end();}
