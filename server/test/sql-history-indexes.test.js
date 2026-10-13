import test from "node:test";
import assert from "node:assert/strict";
import {historyIndexes} from "../src/sql-history-indexes.js";

test("history indexes are idempotent and scoped to the user",()=>{
 assert.equal(historyIndexes.length,5);
 for(const sql of historyIndexes){
  assert.match(sql,/^CREATE INDEX IF NOT EXISTS idx_[a-z0-9_]+ ON [a-z0-9_]+\(user_id,/);
  assert.doesNotMatch(sql,/\b(?:DROP|DELETE|UPDATE|INSERT)\b/i);
 }
});
