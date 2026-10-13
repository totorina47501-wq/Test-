import {test,expect} from "@playwright/test";

// The React preview defaults to the cockpit; showcase=1 explicitly selects
// the public landing in the isolated CI server.
test("partner review landing and bot lab work on desktop and mobile",async({page})=>{
 await page.goto("/react-preview/?showcase=1");
 const tour=page.locator("#visite-guidee");
 await expect(tour).toBeAttached();
 await expect(tour.getByRole("heading",{name:"Découvrez BitGold en quatre étapes."})).toBeVisible();
 await expect(tour.locator('a[href="/bots?testmode=1"]')).toHaveCount(1);
 await expect(tour.locator('a[href="/investir"]')).toHaveCount(1);
 const architecture=page.locator("#architecture");
 await expect(architecture).toBeAttached();
 await expect(architecture.getByRole("heading",{name:"Une séparation explicite entre simulation et services réels."})).toBeVisible();
 await expect(architecture).toContainText("Connecteur crypto réel · désactivé");
 await expect(architecture).toContainText("Les opérations fournisseur échouent volontairement");
 await expect(architecture.locator('a[href="/bots?testmode=1"]')).toHaveCount(1);
 const partner=page.locator("#partenaires");
 await expect(partner).toBeAttached();
 await expect(partner).toContainText("Aucune conservation de cryptoactifs");
 await expect(partner.locator('a[href="/bots?testmode=1"]')).toHaveCount(1);
 // Public bot laboratory is also mounted by the React preview router.
 await page.goto("/react-preview/?view=bots&testmode=1");
 await expect(page.getByRole("heading",{name:"Comparer les bots BitGold"})).toBeVisible();
 await expect(page.getByText("Laboratoire de scénarios des bots")).toBeVisible();
});

test("partner technical review is responsive and retains simulation boundaries",async({page})=>{
 await page.goto("/react-preview/?showcase=1");
 await expect(page.locator('nav[aria-label="Navigation landing"] a[href="#architecture"]')).toHaveCount(1);
 const architecture=page.locator("#architecture");
 await expect(architecture.locator(".partner-review-card")).toHaveCount(4);
 await expect(architecture).toContainText("pas des partenaires confirmés");
 await expect(page.locator("#visite-guidee")).toContainText("Scénarios fictifs publics");
 // A public partner review should never require authentication or overflow its viewport.
 await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+2)).toBe(true);
});
