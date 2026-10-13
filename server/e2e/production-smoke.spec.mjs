import { test, expect } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const prod = process.env.BITGOLD_PROD_URL || "https://p01--service-bitgold--dvn9t2gvmtgx.code.run";
test.use({ baseURL: prod, storageState: { cookies: [], origins: [] } });

test("guest homepage and login modal", async ({ page }) => {
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  const response = await page.goto("/", { waitUntil: "domcontentloaded" });
  expect(response?.status()).toBe(200);
  await expect(page.locator("main h1").first()).toBeVisible();
  await page.getByRole("button", { name: /Se connecter/i }).first().click();
  const dialog = page.getByRole("dialog", { name: "Authentification BitGold" });
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  expect(errors).toEqual([]);
});

test("guest Investir page loads", async ({ page }) => {
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  const response = await page.goto("/investir", { waitUntil: "domcontentloaded" });
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("navigation", { name: "Navigation principale" }).getByRole("link", { name: "Investir" })).toBeVisible();
  expect(errors).toEqual([]);
});

test("expired JWT is rejected on live production", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("bitgold-token", "invalid.jwt.token"));
  const response = await page.goto("/", { waitUntil: "domcontentloaded" });
  expect(response?.status()).toBe(200);
  await expect.poll(() => page.evaluate(() => localStorage.getItem("bitgold-token"))).toBeNull();
  await expect(page.locator("main h1").first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Se connecter" }).first()).toBeVisible();
});

test("live landing displays decoded bots, portfolio and activity screenshots", async ({ page }) => {
  const response = await page.goto(prod + "/", { waitUntil: "domcontentloaded" });
  expect(response?.status()).toBe(200);
  await expect(page.locator(".bg-landing")).toBeVisible();
  for (const file of ["bots-auth-demo.png", "portfolio-auth-demo.png", "activity-auth-demo.png"]) {
    const asset = await page.request.get(prod + "/showcase/" + file);
    expect(asset.status(), file + " must be deployed").toBe(200);
    expect(asset.headers()["content-type"], file + " must be PNG").toMatch(/image\/png/i);
    const image = page.locator('img.landing-real-capture[src="/showcase/' + file + '"]').first();
    await image.scrollIntoViewIfNeeded();
    await expect(image).toBeVisible();
    await expect.poll(() => image.evaluate(el => el.complete && el.naturalWidth > 0 && el.naturalHeight > 0)).toBe(true);
  }
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2);
  expect(overflow, "landing must not overflow horizontally").toBe(false);
});


test("live partner walkthrough has simulation disclosures and guided journey",async({page})=>{
 const response=await page.goto("/",{waitUntil:"domcontentloaded"});
 expect(response?.status()).toBe(200);
 const journey=page.locator("#parcours-demo");
 await expect(journey).toBeVisible();
 await expect(journey.locator(".demo-journey-item")).toHaveCount(5);
 await expect(journey).toContainText("aucun paiement réel");
 await expect(journey.locator('a[href="/bots?testmode=1"]')).toHaveCount(1);
 const progress=journey.getByRole("progressbar",{name:"Progression de la démonstration"});
 await expect(progress).toHaveAttribute("value","0");
 await journey.getByRole("checkbox",{name:"Exploré"}).first().check();
 await expect(progress).toHaveAttribute("value","1");
 await journey.getByRole("button",{name:"Réinitialiser le parcours"}).click();
 await expect(progress).toHaveAttribute("value","0");
 expect(await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+2)).toBe(false);
});


async function captureProductionScreen(page,testInfo,name){
  if(process.env.BITGOLD_CAPTURE_UI!=="true")return;
  const dir="test-results/production-navigation";
  await mkdir(dir,{recursive:true});
  await page.screenshot({path:`${dir}/${testInfo.project.name}-${name}.png`,animations:"disabled",fullPage:true});
}

test("live navigation keeps the correct screen through back and forward",async({page},testInfo)=>{
  const errors=[];
  page.on("pageerror",error=>errors.push(error.message));
  let response=await page.goto("/",{waitUntil:"domcontentloaded"});
  expect(response?.status()).toBe(200);
  await expect(page.locator("main h1").first()).toBeVisible();
  await captureProductionScreen(page,testInfo,"home");

  response=await page.goto("/investir",{waitUntil:"domcontentloaded"});
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading",{name:"Investir",exact:true})).toBeVisible();
  await expect(page).toHaveURL(/\/investir(?:[?#]|$)/);
  await captureProductionScreen(page,testInfo,"investir");

  response=await page.goto("/bots",{waitUntil:"domcontentloaded"});
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading",{name:"Comparer les bots BitGold"})).toBeVisible();
  await expect(page).toHaveURL(/\/bots(?:[?#]|$)/);
  await captureProductionScreen(page,testInfo,"bots-public");

  await page.goBack({waitUntil:"domcontentloaded"});
  await expect(page.getByRole("heading",{name:"Investir",exact:true})).toBeVisible();
  await expect(page.getByRole("heading",{name:"Comparer les bots BitGold"})).toHaveCount(0);
  await expect(page).toHaveURL(/\/investir(?:[?#]|$)/);

  await page.goBack({waitUntil:"domcontentloaded"});
  await expect(page.locator("main h1").first()).toBeVisible();
  await expect(page).not.toHaveURL(/\/investir(?:[?#]|$)/);

  await page.goForward({waitUntil:"domcontentloaded"});
  await expect(page.getByRole("heading",{name:"Investir",exact:true})).toBeVisible();

  for(const route of ["/portefeuille","/activite"]){
    response=await page.goto(route,{waitUntil:"domcontentloaded"});
    expect(response?.status(),route).toBe(200);
    await expect(page.getByRole("heading",{name:"Connexion requise"})).toBeVisible();
    await expect(page).toHaveURL(new RegExp(route+"(?:[?#]|$)"));
    await captureProductionScreen(page,testInfo,route.slice(1)+"-guest-lock");
  }
  await page.goBack({waitUntil:"domcontentloaded"});
  await expect(page).toHaveURL(/\/portefeuille(?:[?#]|$)/);
  await expect(page.getByRole("heading",{name:"Connexion requise"})).toBeVisible();
  expect(errors).toEqual([]);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2)).toBe(true);
});
