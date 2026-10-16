import test from "node:test";import assert from "node:assert/strict";import {encodeFrame} from "../src/market-browser-ws.js";
test("WebSocket text frames contain market JSON",()=>{const frame=encodeFrame({type:"market",markets:[{symbol:"BTC",price:100}]});assert.equal(frame[0],129);assert.deepEqual(JSON.parse(frame.subarray(2).toString()),{type:"market",markets:[{symbol:"BTC",price:100}]})});
test("WebSocket supports payloads larger than 125 bytes",()=>{const frame=encodeFrame({data:"a".repeat(200)});assert.equal(frame[1],126);assert.equal(frame.readUInt16BE(2),211)});
