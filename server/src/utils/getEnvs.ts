import * as dotenv from "dotenv";
dotenv.config();
import { ENV_VARS } from "../types";

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
  }: ENV_VARS = JSON.parse(process.env.APP_ENV as string);

  if(process.env.ENVIRONMENT === "development"){

    return {
      MONGO_CONNECTION_URL,
      PORT,
      JWT_SECRET,
      JWT_LIFETIME,
      DATABASE_HOST,
      DATABASE_USERNAME,
      DATABASE_PASSWORD,
      DB_URL,
    };
  }

  return {
    MONGO_CONNECTION_URL,
    PORT,
    JWT_SECRET,
    JWT_LIFETIME,
    DATABASE_HOST,
    DATABASE_USERNAME,
    DATABASE_PASSWORD,
    DB_URL
  };
}

