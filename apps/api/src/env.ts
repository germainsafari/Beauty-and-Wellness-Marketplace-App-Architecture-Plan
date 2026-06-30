import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), "../../.env") });
config({ path: resolve(process.cwd(), ".env") });

export const ENV = {
  port: Number(process.env.PORT || 3001),
  databaseUrl: process.env.DATABASE_URL!,
  jwtSecret: process.env.JWT_SECRET || "hafi-dev-secret",
  openaiApiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API || "",
  corsOrigins: process.env.CORS_ORIGINS?.split(",").map((s) => s.trim()).filter(Boolean) ?? [],
};

if (!ENV.databaseUrl) {
  throw new Error("DATABASE_URL is required");
}
