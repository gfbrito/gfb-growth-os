import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default("3001").transform(Number),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  API_BASE_URL: z.string().url().default("http://localhost:3001"),
  FRONTEND_URL: z.string().url().default("http://localhost:3000"),
  DATABASE_URL: z.string().min(1),
  REDIS_HOST: z.string().default("localhost"),
  REDIS_PORT: z.string().default("6379").transform(Number),
  REDIS_PASSWORD: z.string().optional().default(""),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  COOKIE_SECRET: z.string().min(16),
  EVOLUTION_API_URL: z.string().url().optional(),
  EVOLUTION_API_KEY: z.string().optional(),
  META_GRAPH_API_VERSION: z.string().default("v20.0"),
  STORAGE_LOCAL_PATH: z.string().default("./data/uploads"),
  MEDIA_SERVICE_URL: z.string().url().default("http://localhost:8000"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:", parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
