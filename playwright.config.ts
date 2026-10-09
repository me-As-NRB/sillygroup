import { defineConfig, devices } from "@playwright/test";

const PORT = 4173;

export default defineConfig({
  testDir: "e2e",
  timeout: 120_000,
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
    // No fade-ins: keeps contrast scans and clicks deterministic.
    contextOptions: { reducedMotion: "reduce" },
    // Locally use the installed Edge; CI installs Playwright's Chromium.
    ...(process.env.CI ? {} : { channel: "msedge" })
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], ...(process.env.CI ? {} : { channel: "msedge" }) } },
    { name: "mobile", use: { ...devices["Pixel 7"], ...(process.env.CI ? {} : { channel: "msedge" }) } }
  ],
  webServer: {
    command: "npm run build && node dist/server.js",
    url: `http://localhost:${PORT}/health`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    // Short reveal so a full 10-question round finishes quickly; no AI in tests.
    env: { PORT: String(PORT), REVEAL_MS: "2500", OPENROUTER_API_KEY: "", ANTHROPIC_API_KEY: "" }
  }
});
