import fs from 'fs';
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
  let client:ClientType | Connection;
  if(process.env.ENVIRONMENT === "production"){;
    client = new Client({
      connectionString: DB_URL,
      ssl: {
        rejectUnauthorized: false,
        key: fs.readFileSync("./example.test-key.pem"),
        cert: fs.readFileSync("./example.test.pem"),
      },
    });
  }else{
    client = new Client({
      connectionString: DB_URL,
    });
  }

  client.connect(err =>{
    if(err){
      console.log("Error connecting to DB: ", err);
    }else{
      console.log("Connected to DB successfully");
    }
  });

  const db = drizzle(client as unknown as never);
  return db;
};


export const db = drizzle(client as unknown as never);
