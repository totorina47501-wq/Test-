import {test,expect} from "@playwright/test";
test("public discovery catalog is explicitly not tradable",async({request})=>{
 const response=await request.get("/api/market/discovery");
 expect(response.ok()).toBeTruthy();
 const body=await response.json();
 expect(body.mode).toBe("discovery");
 expect(body.assets.length).toBe(24);
 for(const asset of body.assets){expect(asset.tradable).toBe(false);expect(asset.botEligible).toBe(false)}
});
test("discovery catalog does not affect bot catalogue",async({request})=>{
 const response=await request.get("/api/market/discovery");
 expect(response.ok()).toBeTruthy();
 const body=await response.json();
 expect(body.assets.every(asset=>asset.mode==="discovery")).toBe(true);
});
