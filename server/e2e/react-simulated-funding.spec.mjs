import {test,expect} from "@playwright/test";

test.beforeEach(async({page})=>{
 await page.route(/api\/bots\/executions\/history/,route=>route.fulfill({contentType:"application/json",body:JSON.stringify({executions:[]})}));
 await page.route(/api\/bots\/decisions\/history/,route=>route.fulfill({contentType:"application/json",body:JSON.stringify({decisions:[]})}));
});

test("virtual funding updates the portfolio without collecting payment credentials",async({page})=>{
 await page.addInitScript(()=>localStorage.setItem("bitgold-token","funding-e2e-token"));
 let cash=10000;
 let portfolioReads=0;
 let fundingPayload=null;
 await page.route("**/api/portfolio",route=>{
  portfolioReads+=1;
  return route.fulfill({contentType:"application/json",body:JSON.stringify({cash,invested:0,total:cash,positions:[],trades:[],integrity:{ok:true}})});
 });
 await page.route("**/api/activity",route=>route.fulfill({contentType:"application/json",body:JSON.stringify({trades:[],botLogs:[]})}));
 await page.route("**/api/bots",route=>route.fulfill({contentType:"application/json",body:JSON.stringify({plan:{plan:"free"},items:[],activity:[],catalog:[]})}));
 await page.route("**/api/wallet/simulated-deposits",async route=>{
  if(route.request().method()!=="POST")return route.fulfill({contentType:"application/json",body:JSON.stringify({items:[]})});
  fundingPayload=route.request().postDataJSON();
  cash+=Number(fundingPayload.amount);
  return route.fulfill({status:201,contentType:"application/json",body:JSON.stringify({ok:true,duplicate:false,cash,simulation:true})});
 });
 await page.goto("/react-preview/?view=portfolio");
 await expect(page.getByRole("heading",{name:"Portefeuille",exact:true})).toBeVisible();
 await expect(page.getByRole("heading",{name:"Créditer mes liquidités"})).toBeVisible();
 await expect(page.getByText(/Aucun débit réel, aucune donnée de carte demandée/)).toBeVisible();
 await page.getByLabel("PayPal").check();
 await page.getByLabel("Montant en euros").fill("250");
 await page.getByRole("button",{name:"Confirmer le crédit fictif"}).click();
 await expect(page.getByRole("status")).toContainText("Votre portefeuille virtuel a été crédité");
 await expect.poll(()=>fundingPayload).not.toBeNull();
 expect(fundingPayload).toMatchObject({method:"paypal",amount:250});
 expect(fundingPayload.requestKey).toMatch(/^[A-Za-z0-9_-]{12,100}$/);
 expect(Object.keys(fundingPayload).sort()).toEqual(["amount","method","requestKey"]);
 await expect.poll(()=>portfolioReads).toBeGreaterThan(1);
 expect(cash).toBe(10250);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2)).toBe(true);
});
