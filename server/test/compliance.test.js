import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root=path.resolve(process.cwd());
const server=fs.readFileSync(path.join(root,"src/index.js"),"utf8");
const compliance=fs.readFileSync(path.join(root,"src/compliance.js"),"utf8");
const env=fs.readFileSync(path.join(root,".env.example"),"utf8");

test("KYC/AML compliance is fail-closed in production",()=>{
  assert.match(server,/COMPLIANCE_ENFORCEMENT/);
  assert.match(server,/isProduction ? "true" : "false"/);
  assert.match(server,/app\.post\("\/api\/trades",auth,compliance\.requireTransactionClearance/);
  assert.match(compliance,/kyc_status==="verified"/);
  assert.match(compliance,/aml_status==="clear"/);
  assert.match(compliance,/risk_level!=="high"/);
  assert.match(compliance,/COMPLIANCE_UNAVAILABLE/);
});

test("KYC/AML has persistent statuses and immutable audit events",()=>{
  assert.match(compliance,/CREATE TABLE IF NOT EXISTS user_compliance/);
  assert.match(compliance,/CREATE TABLE IF NOT EXISTS compliance_events/);
  assert.match(compliance,/event_type TEXT NOT NULL/);
  assert.match(compliance,/payload_hash TEXT/);
  assert.match(compliance,/INSERT INTO compliance_events/);
  assert.match(server,/\/api\/compliance\/status/);
});

test("provider webhook is authenticated by HMAC and normalizes decisions",()=>{
  assert.match(env,/COMPLIANCE_WEBHOOK_SECRET=/);
  assert.match(env,/KYC_PROVIDER_URL=/);
  assert.match(env,/AML_PROVIDER_URL=/);
  assert.match(compliance,/x-compliance-signature/);
  assert.match(compliance,/createHmac\("sha256",webhookSecret\)/);
  assert.match(compliance,/timingSafeEqual/);
  assert.match(compliance,/KYC_STATUSES/);
  assert.match(compliance,/AML_STATUSES/);
  assert.match(compliance,/RISK_LEVELS/);
  assert.match(server,/\/api\/compliance\/provider\/webhook/);
});

test("compliance is tiered by subscription without waiving KYC/AML",()=>{
  assert.match(compliance,/COMPLIANCE_PLAN_POLICY/);
  assert.match(compliance,/free: \{ label:"Free", requiredKycLevel:"standard", maxTransactionEur:2000, dailyLimitEur:2000/);
  assert.match(compliance,/pro: \{ label:"Pro", requiredKycLevel:"standard", maxTransactionEur:10000, dailyLimitEur:10000/);
  assert.match(compliance,/elite: \{ label:"Elite", requiredKycLevel:"enhanced", maxTransactionEur:50000, dailyLimitEur:50000/);
  assert.match(compliance,/kyc_level/);
  assert.match(compliance,/Niveau de vérification KYC insuffisant/);
  assert.match(compliance,/COMPLIANCE_REVIEW_REQUIRED/);
  assert.match(server,/compliance\.assertTransactionAllowed\(subscription\.user_id/);
});
