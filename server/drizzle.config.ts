import type { Config } from "drizzle-kit";
import * as dotenv from "dotenv";

dotenv.config();

const dotenvVars: string = process.env.APP_ENV ?? "";

interface ENV_VARS {
	DB_URL: string;
  DB_ACCOUNT_ID: string;
  DB_DATABASE_ID: string;
  DB_TOKEN: string;
  DB_HOST: string;
  DB_PORT: string;
}
const { DB_ACCOUNT_ID, DB_DATABASE_ID, DB_TOKEN, DB_HOST, DB_PORT }: ENV_VARS = JSON.parse(dotenvVars);
if(!DB_ACCOUNT_ID || !DB_DATABASE_ID || !DB_TOKEN || !DB_HOST || !DB_PORT) {
  throw new Error("DB_ACCOUNT_ID, DB_DATABASE_ID, DB_TOKEN, DB_HOST, DB_PORT are required", {cause: JSON.stringify({
    DB_ACCOUNT_ID,
    DB_DATABASE_ID,
    DB_TOKEN,
    DB_HOST,
    DB_PORT
  })
  });
}

const DB_URL = `postgres://${DB_ACCOUNT_ID}:${DB_TOKEN}@${DB_HOST}:${DB_PORT}/${DB_DATABASE_ID}`;

export default {
  schema: "./src/schema.ts",  
  dialect: "postgresql",
  out: "./drizzle",
  dbCredentials: {    
    url: DB_URL,
  },
  verbose: true,
  strict: true,
} satisfies Config;
