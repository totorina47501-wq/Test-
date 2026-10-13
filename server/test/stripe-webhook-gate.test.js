import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {commercialRelease} from "../src/commercial-release.js";
const src=fs.readFileSync(path.resolve(path.dirname(fileURLToPath(import.meta.url)),"../src/index.js"),"utf8");
const start=src.indexOf('app.post("/api/stripe/webhook"');
const end=src.indexOf("// Northflank terminates TLS",start);
const handler=src.slice(start,end);

test("Stripe webhook rejects unapproved launch before signature processing and database writes",()=>{
 assert.ok(start>=0&&end>start);
 const gate=handler.indexOf("assertPaidSimulationEnabled()");
 const signature=handler.indexOf("stripe.webhooks.constructEvent");
 const write=handler.indexOf('client.query("UPDATE users SET plan');
 assert.ok(gate>=0&&signature>gate&&write>signature,"gate must precede signature and all writes");
 assert.match(handler,/return res\.status\(503\)/);
});

test("Stripe webhook remains signed, rejects invalid signatures and avoids leaking secrets",()=>{
 assert.match(handler,/stripe\.webhooks\.constructEvent/);
 assert.match(handler,/return res\.status\(400\)/);
 assert.doesNotMatch(handler,/res\.json\([^\n]*stripeSecretKey/);
});

test("unapproved release stays disabled with Stripe secrets present",()=>{
 const status=commercialRelease({STRIPE_SECRET_KEY:"sk_test_fake",STRIPE_WEBHOOK_SECRET:"whsec_fake"});
 assert.equal(status.paidSimulation,false);
 assert.equal(status.realCrypto,false);
});
