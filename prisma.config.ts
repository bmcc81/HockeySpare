import path from "node:path";
import { config } from "dotenv";
import { defineConfig, env } from "prisma/config";

config({ path: path.resolve(__dirname, "apps/api/.env") });

export default defineConfig({
  schema: "apps/api/src/prisma/schema.prisma",
  migrations: {
    path: "apps/api/prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});