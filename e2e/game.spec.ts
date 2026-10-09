import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Browser, type Page } from "@playwright/test";

async function seriousA11yIssues(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
  return results.violations
    .filter((v) => v.impact === "serious" || v.impact === "critical")
    .map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`);
}

async function newPlayer(browser: Browser, contextOptions = {}) {
  const context = await browser.newContext(contextOptions);
  return context.newPage();
}

test("home page has no serious accessibility issues", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Who In The Room/ })).toBeVisible();
  expect(await seriousA11yIssues(page)).toEqual([]);
});

test("link previews are filled in for room invites", async ({ request }) => {
  const html = await (await request.get("/?room=ABCD")).text();
  expect(html).toContain('property="og:title" content="Join my game! Room ABCD');
  expect(html).toMatch(/property="og:image" content="http:\/\/localhost:\d+\/og\.jpg"/);
});

test("three players play a full round", async ({ browser, page: host, contextOptions }) => {
  // Host creates the room.
  await host.goto("/");
  await host.getByLabel("Your name").fill("Hana Host");
  await host.getByRole("button", { name: /Create a room/ }).click();
  const code = (await host.locator(".room-code").textContent())!.trim();
  expect(code).toMatch(/^[A-Z]{4}$/);

  // Two friends join from the invite link.
  const guests: Page[] = [];
  for (const name of ["Gita Guest", "Ravi Rao"]) {
    const page = await newPlayer(browser, contextOptions);
    await page.goto(`/?room=${code}`);
    await page.getByLabel("Your name").fill(name);
    await page.getByRole("button", { name: "Join", exact: true }).click();
    await expect(page.getByRole("heading", { name: /Waiting for Hana Host/ })).toBeVisible();
    guests.push(page);
  }
  const players = [host, ...guests];

  // Host sets up the game; guests see the chosen theme.
  await expect(host.getByText("3 online")).toBeVisible();
  expect(await seriousA11yIssues(host)).toEqual([]);
  await host.getByRole("button", { name: /Trek & Hiking/ }).click();
  await host.getByRole("radio", { name: /Savage/ }).click();
  await expect(guests[0].getByText(/Trek & Hiking.*Savage/)).toBeVisible();
  await host.getByRole("button", { name: /Start game/ }).click();

  for (let i = 1; i <= 10; i++) {
    for (const p of players) {
      await expect(p.getByText(`Question ${i}/10`)).toBeVisible({ timeout: 15_000 });
    }
    if (i === 1) expect(await seriousA11yIssues(host)).toEqual([]);
    // Everyone picks the guest Gita, so she is the unanimous answer.
    for (const [n, p] of players.entries()) {
      const pick = p.getByRole("group", { name: "Pick a player" }).getByRole("button", { name: /Gita Guest/ });
      await pick.click();
      // The last vote ends the question at once, so only earlier voters see the locked-in state.
      if (n < players.length - 1) await expect(pick).toHaveAttribute("aria-pressed", "true");
    }
    await expect(host.getByRole("heading", { name: "🗳️ Who voted for whom" })).toBeVisible();
    await expect(host.getByRole("heading", { level: 1, name: "Gita Guest" })).toBeVisible();
    await expect(host.locator(".vote-row.win .voter")).toHaveCount(3);
  }

  // Final screen with podium and a share card for everyone.
  for (const p of players) {
    await expect(p.getByText("Winner of the round")).toBeVisible({ timeout: 15_000 });
    await expect(p.getByRole("img", { name: /Result card/ })).toBeVisible();
  }
  await expect(host.getByRole("button", { name: /Play another round/ })).toBeVisible();
  await expect(guests[0].getByText("Waiting for the host to start another round…")).toBeVisible();
  expect(await seriousA11yIssues(host)).toEqual([]);
});

test("a refreshed player goes straight back into their room", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Your name").fill("Rita Refresh");
  await page.getByRole("button", { name: /Create a room/ }).click();
  const code = (await page.locator(".room-code").textContent())!.trim();

  await page.reload();
  await expect(page.locator(".room-code")).toHaveText(code);
  await expect(page.getByText("Rita Refresh")).toBeVisible();
});
