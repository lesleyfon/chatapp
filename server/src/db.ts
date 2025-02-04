import { drizzle } from "drizzle-orm/node-postgres";
import { getEnvs } from "./utils/getEnvs";
import { Client } from "pg";
import { type Client as ClientType, type Connection } from "pg";

const { DB_URL } = getEnvs();

export const connectToDB = () => {
  let client: ClientType | Connection;
  
  if (process.env.ENVIRONMENT === "production") {
    client = new Client({
      connectionString: DB_URL,
      ssl: {
        rejectUnauthorized: false // This allows self-signed certificates
      }
    });
  } else {
    client = new Client({
      connectionString: DB_URL,
    });
  }

  client.connect(err => {
    if (err) {
      // Use error logger instead of console
      throw new Error(`Database connection error: ${err.message}`);
    }
  });

  return drizzle(client as unknown as never);
};

// Initialize a single client instance
const client = new Client({
  connectionString: DB_URL,
  ssl: process.env.ENVIRONMENT === "production" 
    ? { rejectUnauthorized: false }
    : undefined
});

client.connect();
export const db = drizzle(client as unknown as never);
