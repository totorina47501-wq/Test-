import {test,expect} from "@playwright/test";

// The homepage tabs are already keyboard-operable. Keep that behavior and
// their ARIA relationships covered in both desktop and mobile CI projects.
test("React homepage tabs preserve keyboard focus and valid ARIA panel links",async({page})=>{
  await page.goto("/react-preview/");
  const all=page.getByRole("tab",{name:"Tous les espaces"});
  const tools=page.getByRole("tab",{name:"Outils"});
  await expect(all).toHaveAttribute("aria-selected","true");
  await expect(tools).toHaveAttribute("aria-selected","false");

  const links=await page.getByRole("tablist",{name:"Sélection de vue"}).evaluate(list=>{
    return Array.from(list.querySelectorAll('[role="tab"]')).map(tab=>{
      const panel=document.getElementById(tab.getAttribute("aria-controls")||"");
      return {tabId:tab.id,controls:tab.getAttribute("aria-controls"),panelId:panel?.id,labelledBy:panel?.getAttribute("aria-labelledby")};
    });
  });
  expect(links).toHaveLength(2);
  expect(new Set(links.map(link=>link.tabId)).size).toBe(links.length);
  for(const link of links){
    expect(link.controls).toBeTruthy();
    expect(link.panelId).toBe(link.controls);
    expect(link.labelledBy).toBe(link.tabId);
  }

  await all.focus();
  await all.press("ArrowRight");
  await expect(tools).toBeFocused();
  await expect(tools).toHaveAttribute("aria-selected","true");
  await expect(page.getByRole("tabpanel")).toContainText("Investir");
  await expect(page.getByRole("tabpanel")).not.toContainText("Portefeuille");

  await tools.press("Home");
  await expect(all).toBeFocused();
  await expect(all).toHaveAttribute("aria-selected","true");
  await expect(page.getByRole("tabpanel")).toContainText("Portefeuille");

  await all.press("End");
  await expect(tools).toBeFocused();
  await tools.press("ArrowLeft");
  await expect(all).toBeFocused();
  await all.press("ArrowLeft");
  await expect(tools).toBeFocused();
});
