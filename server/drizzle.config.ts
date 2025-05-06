import * as dotenv from 'dotenv';
import type { Config } from 'drizzle-kit';

dotenv.config();

const dotenvVars: string = process.env.APP_ENV ?? '';

interface ENV_VARS {
  DB_URL: string;
  DB_ACCOUNT_ID: string;
  DB_DATABASE_ID: string;
  DB_TOKEN: string;
  DB_HOST: string;
  DB_PORT: string;
  DATABASE_URL: string;
}

const isDevEnv = process.env.ENVIRONMENT === 'development';
let DB_URL = '';

if (isDevEnv) {
  const { DB_ACCOUNT_ID, DB_DATABASE_ID, DB_TOKEN, DB_HOST, DB_PORT, DATABASE_URL }: ENV_VARS =
    JSON.parse(dotenvVars);
  if (!DB_ACCOUNT_ID || !DB_DATABASE_ID || !DB_TOKEN || !DB_HOST || !DB_PORT) {
    throw new Error('DB_ACCOUNT_ID, DB_DATABASE_ID, DB_TOKEN, DB_HOST, DB_PORT are required', {
      cause: JSON.stringify({
        DB_ACCOUNT_ID,
        DB_DATABASE_ID,
        DB_TOKEN,
        DB_HOST,
        DB_PORT,
      }),
    });
  }

  DB_URL = DATABASE_URL;
} else {
  const { DB_URL: ENV_DB_URL }: ENV_VARS = JSON.parse(dotenvVars);
  DB_URL = ENV_DB_URL;
}

export default {
  schema: './src/schema.ts',
  dialect: 'postgresql',
  out: './drizzle',
  dbCredentials: {
    url: DB_URL,
  },
  verbose: true,
  strict: true,
} satisfies Config;
