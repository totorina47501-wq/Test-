import {test,expect} from "@playwright/test";

// Smoke checks only: a logged-in browser E2E is covered by the existing auth suites.
test("Quantum Fund requires authentication",async({request})=>{
 const res=await request.get("/api/bots/quantum-fund?days=30");
 expect([401,403]).toContain(res.status());
});
