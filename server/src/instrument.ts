import * as Sentry from "@sentry/node";
import { getEnvs } from "./utils/getEnvs";

const { SENTRY_DSN } = getEnvs();

const ENV = process.env.ENVIRONMENT;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    tracesSampleRate: ENV === "production" ? 0.1 : 1,
    environment: ENV,
  });
  console.log(`Sentry initialized in ${process.env.ENVIRONMENT} environment`);
} else {
  console.warn("Sentry DSN not provided, error tracking disabled");
}
