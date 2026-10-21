import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const source=readFileSync(new URL("../src/index.js",import.meta.url),"utf8");
const webhook=source.split('app.post("/api/stripe/webhook"')[1]?.split("// Northflank terminates TLS")[0];
test("Stripe subscriptions guard against older event timestamps",()=>{
 assert.match(source,/ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_subscription_event_created BIGINT NOT NULL DEFAULT 0/);
 assert.match(webhook,/Number\.isSafeInteger\(eventCreated\)/);
 assert.match(webhook,/stripe_subscription_event_created <= \$6/);
 assert.match(webhook,/stripe_subscription_event_created <= \$5/);
 assert.match(webhook,/stripe_customer_id=\$4/);
 assert.match(webhook,/ON CONFLICT DO NOTHING RETURNING event_id/);
});
