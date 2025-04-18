import * as dotenv from 'dotenv';

import type { ENV_VARS } from '../types';

dotenv.config();

export function getEnvs() {
  const {
    MONGO_CONNECTION_URL,
    PORT,
    JWT_SECRET,
    JWT_LIFETIME,
    DATABASE_HOST,
    DATABASE_USERNAME,
    DATABASE_PASSWORD,
    DB_URL,
    DATABASE_URL,
    SENTRY_DSN,
  }: ENV_VARS = JSON.parse(process.env.APP_ENV as string);

  return {
    MONGO_CONNECTION_URL,
    PORT,
    JWT_SECRET,
    JWT_LIFETIME,
    DATABASE_HOST,
    DATABASE_USERNAME,
    DATABASE_PASSWORD,
    DB_URL,
    DATABASE_URL,
    SENTRY_DSN: SENTRY_DSN || '',
  };
}
