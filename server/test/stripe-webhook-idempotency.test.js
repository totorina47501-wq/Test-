import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const src=fs.readFileSync(new URL("../src/index.js",import.meta.url),"utf8");
const route=src.slice(src.indexOf('app.post("/api/stripe/webhook"'),src.indexOf("// Northflank terminates TLS"));
test("webhook requires release gate before verifying signature",()=>{
 assert.ok(route.indexOf("assertPaidSimulationEnabled()")<route.indexOf("stripe.webhooks.constructEvent"));
});
test("Stripe events are transactionally deduplicated before any entitlement write",()=>{
 assert.match(src,/CREATE TABLE IF NOT EXISTS stripe_webhook_events\(event_id TEXT PRIMARY KEY/);
 assert.ok(route.indexOf('client.query("BEGIN")')<route.indexOf("INSERT INTO stripe_webhook_events"));
 assert.ok(route.indexOf("INSERT INTO stripe_webhook_events")<route.indexOf("UPDATE users SET"));
 assert.match(route,/ON CONFLICT DO NOTHING RETURNING event_id/);
 assert.match(route,/if\(!inserted.rowCount\)/);
 assert.match(route,/client.query\("ROLLBACK"\)/);
});
test("checkout cannot upgrade plan and past_due cannot grant entitlements",()=>{
 const checkout=route.slice(route.indexOf('if(event.type==="checkout.session.completed")'),route.indexOf('if(event.type==="customer.subscription.updated"'));
 assert.doesNotMatch(checkout,/SET plan=/);
 assert.doesNotMatch(route,/past_due/);
 assert.match(route,/stripe_customer_id=\$4/);
});
