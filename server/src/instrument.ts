
import * as Sentry from "@sentry/node";
import { getEnvs } from "./utils/getEnvs";

const { SENTRY_DSN } = getEnvs();

Sentry.init({
  dsn: SENTRY_DSN,
  tracesSampleRate: 1.0,
  environment: process.env.ENVIRONMENT,
})

