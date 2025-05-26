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
