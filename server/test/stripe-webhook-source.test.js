import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const source=readFileSync(new URL("../src/index.js",import.meta.url),"utf8");
const webhook=source.split('app.post("/api/stripe/webhook"')[1]?.split("// Northflank terminates TLS")[0];
test("Stripe webhook requires commercial approval and signature before writes",()=>{
 assert.ok(webhook,"webhook handler exists");
 assert.ok(webhook.indexOf("assertPaidSimulationEnabled()")<webhook.indexOf("stripe.webhooks.constructEvent"));
 assert.ok(webhook.indexOf("stripe.webhooks.constructEvent")<webhook.indexOf("pool.connect()"));
});
test("Stripe event persistence is transactional and idempotent",()=>{
 assert.match(source,/CREATE TABLE IF NOT EXISTS stripe_webhook_events\s*\(/);
 assert.match(webhook,/ON CONFLICT DO NOTHING RETURNING event_id/);
 for(const statement of ['client.query("BEGIN")','client.query("COMMIT")','client.query("ROLLBACK")'])assert.ok(webhook.includes(statement));
});
test("Subscription access cannot be granted by checkout alone or past_due",()=>{
 assert.match(webhook,/Checkout completion alone does not prove an active, paid subscription/);
 assert.match(webhook,/\["active","trialing"\]\.includes\(subscription\.status\)/);
 assert.match(webhook,/stripe_customer_id=\$4/);
});
