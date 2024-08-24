import { drizzle } from "drizzle-orm/node-postgres";
import { getEnvs } from "./utils/getEnvs";
import { Client } from "pg";
import { type Client as ClientType, type Connection } from "pg";

const { DB_URL } = getEnvs();

export const client: ClientType | Connection = new Client({
  connectionString: DB_URL,
});

client.connect();

export const connectToDB = () => {
  const client: ClientType | Connection = new Client({
    connectionString: DB_URL,
  });

  client.connect();

  const db = drizzle(client as unknown as never);
  return db;
};


export const db = drizzle(client as unknown as never);
