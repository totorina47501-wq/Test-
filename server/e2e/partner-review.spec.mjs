import {test,expect} from "@playwright/test";

// The React preview defaults to the cockpit; showcase=1 explicitly selects
// the public landing in the isolated CI server.
test("partner review landing and bot lab work on desktop and mobile",async({page})=>{
 await page.goto("/react-preview/?showcase=1");
 const partner=page.locator("#partenaires");
 await expect(partner).toBeAttached();
 await expect(partner).toContainText("Aucune conservation de cryptoactifs");
 await expect(partner.locator('a[href="/bots?testmode=1"]')).toHaveCount(1);
 // Public bot laboratory is also mounted by the React preview router.
 await page.goto("/react-preview/?view=bots&testmode=1");
 await expect(page.getByRole("heading",{name:"Comparer les bots BitGold"})).toBeVisible();
 await expect(page.getByText("Laboratoire de scénarios des bots")).toBeVisible();
});
