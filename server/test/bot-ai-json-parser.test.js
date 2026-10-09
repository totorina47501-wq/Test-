import test from "node:test";
import assert from "node:assert/strict";
import {parseJson} from "../src/bot-ai-engine.js";

test("parses plain provider JSON",()=>{assert.deepEqual(parseJson('{"bias":"hold","confidence":0.5}'),{bias:"hold",confidence:0.5});});
test("parses fenced JSON with newlines",()=>{assert.deepEqual(parseJson('```json\n{"bias":"buy",\n"asset":"BTC"}\n```'),{bias:"buy",asset:"BTC"});});
test("parses fenced JSON with whitespace",()=>{assert.deepEqual(parseJson(' \n```\n{"bias":"sell"}\n``` \n'),{bias:"sell"});});
test("parses explanatory response containing JSON",()=>{assert.deepEqual(parseJson('Result: {"bias":"hold"}.'),{bias:"hold"});});
test("fails closed for malformed and empty JSON",()=>{for(const value of ["", "not json", "```json\n{broken}\n```"])assert.throws(()=>parseJson(value));});
