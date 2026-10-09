/// <reference types="vitest/config" />
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const GAME_PORT = Number(process.env.GAME_PORT) || 3000;

export default defineConfig({
  root: "client",
  plugins: [react()],
  build: {
    outDir: "../dist/client",
    emptyOutDir: true,
    sourcemap: true
  },
  server: {
    port: 5173,
    // In development the game server runs separately; forward its socket traffic.
    proxy: {
      "/socket.io": { target: `http://localhost:${GAME_PORT}`, ws: true }
    }
  },
  test: {
    root: ".",
    include: ["tests/**/*.test.ts"],
    environment: "node"
  }
});
