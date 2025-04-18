import * as Sentry from '@sentry/node';
import { getEnvs } from './utils/get-envs';

const { SENTRY_DSN } = getEnvs();

const ENV = process.env.ENVIRONMENT;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    tracesSampleRate: ENV === 'production' ? 0.1 : 1,
    environment: ENV,
  });
  // biome-ignore lint/suspicious/noConsole: <explanation>
  console.log(`Sentry initialized in ${process.env.ENVIRONMENT} environment`);
} else {
  // biome-ignore lint/suspicious/noConsole: <explanation>
  console.warn('Sentry DSN not provided, error tracking disabled');
}
