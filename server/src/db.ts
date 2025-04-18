import { drizzle } from 'drizzle-orm/node-postgres';
import { Client } from 'pg';

import { getEnvs } from './utils/get-envs';

const { DATABASE_URL } = getEnvs();

export function connectToDB() {
  const client = new Client({
    connectionString: DATABASE_URL,
  });

  client.connect((err) => {
    if (err) {
      // Use error logger instead of console
      throw new Error(`Database connection error: ${err.message}`);
    }
  });

  return drizzle(client as unknown as never);
}

// Initialize a single client instance
const client = new Client({
  connectionString: DATABASE_URL,
  ssl: process.env.ENVIRONMENT === 'production' ? { rejectUnauthorized: false } : undefined,
});

// TODO: Add A retry here/in this file
client.connect();
export const db = drizzle(client as unknown as never);
