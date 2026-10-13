import {test,expect} from "@playwright/test";

// Tests both browser history and the visible in-app back action.
// The isolated preview uses the same React components as the public routes.
test("navigation preserves the right screen across browser back and forward",async({page})=>{
 const errors=[];
 page.on("pageerror",error=>errors.push(error.message));
 await page.goto("/react-preview/");
 await expect(page.getByRole("heading",{name:/Explorez, comprenez et simulez avec BitGold/})).toBeVisible();
 await page.goto("/react-preview/?view=investir");
 await expect(page.getByRole("heading",{name:"Investir",exact:true})).toBeVisible();
 await page.goto("/react-preview/?view=bots");
 await expect(page.getByRole("heading",{name:"Comparer les bots BitGold"})).toBeVisible();
 await page.goBack();
 await expect(page.getByRole("heading",{name:"Investir",exact:true})).toBeVisible();
 await expect(page.getByRole("heading",{name:"Comparer les bots BitGold"})).toHaveCount(0);
 await page.goBack();
 await expect(page.getByRole("heading",{name:/Explorez, comprenez et simulez avec BitGold/})).toBeVisible();
 await page.goForward();
 await expect(page.getByRole("heading",{name:"Investir",exact:true})).toBeVisible();
 expect(errors).toEqual([]);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2)).toBe(true);
});

test("private portfolio and activity never render another private screen for guests",async({page})=>{
 for(const [view,title] of [["portfolio","Portefeuille"],["activity","Activités"]]){
  await page.goto("/react-preview/?view="+view);
  await expect(page.getByText("Connectez-vous depuis l’accueil pour accéder à votre espace privé.")).toBeVisible();
  await expect(page.getByRole("heading",{name:title,exact:true})).toHaveCount(0);
  await page.getByRole("button",{name:"Retour à l’accueil"}).click();
  await expect(page.getByRole("heading",{name:/Explorez, comprenez et simulez avec BitGold/})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2)).toBe(true);
 }
});

test("Investir in-app back returns to the correct landing screen",async({page})=>{
 await page.goto("/react-preview/?view=investir");
 await expect(page.getByRole("heading",{name:"Investir",exact:true})).toBeVisible();
 await page.getByRole("button",{name:/BitGold/,exact:false}).first().click();
 await expect(page.getByRole("heading",{name:/Explorez, comprenez et simulez avec BitGold/})).toBeVisible();
 await expect(page).toHaveURL(/\/react-preview\/?$/);
 await expect(page.locator('nav[aria-label="Navigation principale"] a[aria-current="page"]')).toHaveCount(0);
});
