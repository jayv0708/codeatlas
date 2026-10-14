import path from "node:path";
import dotenv from "dotenv";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// Load .env early so the Prisma client binds to the right database.
dotenv.config();

// Integration tests always run against the isolated test database when one is
// configured — never against dev data.
if (process.env.DATABASE_URL_TEST) {
  process.env.DATABASE_URL = process.env.DATABASE_URL_TEST;
}

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(process.cwd()),
    },
  },
  test: {
    globals: true,
    environment: "node",
    environmentMatchGlobs: [["**/*.test.tsx", "jsdom"]],
    setupFiles: ["tests/setup.ts"],
    include: ["tests/**/*.test.{ts,tsx}"],
    // Integration tests hit Neon PostgreSQL which can be slow over the network
    testTimeout: 15_000,
  },
});
