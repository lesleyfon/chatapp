import * as dotenv from "dotenv";
dotenv.config();

interface ENV_VARS {
	MONGO_CONNECTION_URL: string;
	PORT: string;
	JWT_SECRET: string;
	JWT_LIFETIME: string;
	DATABASE_HOST: string;
	DATABASE_USERNAME: string;
	DATABASE_PASSWORD: string;
	DB_URL: string;
}

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
    console.log("Line 28:in the conditional if(process.env.ENVIRONMENT === 'development')");
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

  console.log("Line 41: process.env.ENVIRONMENT ", process.env.ENVIRONMENT);
  console.log("Line 42: DB_URL", DB_URL);
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

