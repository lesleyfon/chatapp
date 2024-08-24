import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";
config({ path: ".env" });

interface ENV_VARS {
	DB_URL: string;
}
const dotenvVars: string = process.env.APP_ENV ?? "";
const { DB_URL }: ENV_VARS = JSON.parse(dotenvVars);
export default defineConfig({
  schema: "./src/schema.ts",
  dialect: "postgresql",
  out: "./drizzle",
  dbCredentials: {
    url: DB_URL,
  },
  verbose: true,
  strict: true,
});
