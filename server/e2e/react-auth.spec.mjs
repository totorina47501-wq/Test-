import { test, expect } from "@playwright/test";
import { generate } from "otplib";

const preview = "/react-preview/";

function uniqueUser(prefix = "react-auth") {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return {
    email: `${prefix}-${suffix}@example.com`,
    password: "Correct-Horse-Battery-42!",
    first_name: "React",
    last_name: "Journey",
    country: "France",
    city: "Paris",
    postal_code: "75001"
  };
}

test("React signup persists the JWT across reload and logout clears the session", async ({ page }) => {
  const user = uniqueUser("react-signup");
  await page.goto(preview);

  await page.getByRole("button", { name: "Se connecter" }).first().click();
  await page.getByRole("button", { name: "Créer un compte" }).click();
  await page.getByLabel("E-mail").fill(user.email);
  await page.getByLabel("Mot de passe").fill(user.password);
  await page.getByLabel("Prénom").fill(user.first_name);
  await page.getByLabel("Nom").fill(user.last_name);
  await page.getByLabel("Pays").fill(user.country);
  await page.getByLabel("Ville").fill(user.city);
  await page.getByLabel("Code postal").fill(user.postal_code);
  await page.getByRole("button", { name: "Créer mon compte" }).click();

  await expect(page.getByText("Session authentifiée · simulation")).toBeVisible();
  await expect.poll(() => page.evaluate(() => localStorage.getItem("bitgold-token"))).toBeTruthy();

  await page.reload();
  await expect(page.getByText("Session authentifiée · simulation")).toBeVisible();

  await page.getByRole("button", { name: "Se déconnecter" }).click();
  await expect.poll(() => page.evaluate(() => localStorage.getItem("bitgold-token"))).toBeNull();
  await expect(page.getByText("Votre espace privé")).toBeVisible();
});

test("React login reports an expired JWT and returns to login cleanly", async ({ page }) => {
  await page.goto(preview);
  await page.evaluate(() => localStorage.setItem("bitgold-token", "invalid.jwt.token"));
  await page.reload();

  await expect(page.getByText("Votre session a expiré. Reconnectez-vous.")).toBeVisible();
  await expect.poll(() => page.evaluate(() => localStorage.getItem("bitgold-token"))).toBeNull();

  await page.getByRole("button", { name: "Se connecter" }).first().click();
  await expect(page.getByRole("dialog", { name: "Authentification BitGold" })).toBeVisible();
});

test("React login completes the existing 2FA challenge without bypassing it", async ({ page, request }) => {
  const user = uniqueUser("react-2fa");
  const signup = await request.post("/api/auth/signup", { data: user });
  expect(signup.status()).toBe(201);
  const signupBody = await signup.json();
  expect(signupBody.token).toBeTruthy();

  const headers = { Authorization: `Bearer ${signupBody.token}` };
  const setup = await request.post("/api/security/2fa/setup", { headers, data: {} });
  expect(setup.status()).toBe(200);
  const setupBody = await setup.json();
  const enable = await request.post("/api/security/2fa/enable", {
    headers,
    data: { code: await generate({ secret: setupBody.secret }) }
  });
  expect(enable.status()).toBe(200);

  await page.goto(preview);
  await page.getByRole("button", { name: "Se connecter" }).first().click();
  await page.getByLabel("E-mail").fill(user.email);
  await page.getByLabel("Mot de passe").fill(user.password);
  await page.getByRole("button", { name: "Connexion", exact: true }).last().click();

  await expect(page.getByText("Vérification en deux étapes")).toBeVisible();
  await page.getByLabel("Code Google Authenticator ou récupération").fill(await generate({ secret: setupBody.secret }));
  await page.getByRole("button", { name: "Vérifier" }).click();

  await expect(page.getByText("Session authentifiée · simulation")).toBeVisible();
  await expect.poll(() => page.evaluate(() => localStorage.getItem("bitgold-token"))).toBeTruthy();
});
