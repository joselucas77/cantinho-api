import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  engine: "classic", // Diz ao Prisma para conectar direto ao Supabase tradicional
  datasource: {
    url: env("DATABASE_URL"),
  },
});