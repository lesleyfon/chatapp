import * as Sentry from '@sentry/node';
import cors, { type CorsOptions } from 'cors';
import dotenv from 'dotenv';
import express, { type NextFunction, type Request, type Response } from 'express';
import multer from 'multer';
import { type Server as HTTPServer, createServer } from 'node:http';
import { Server as SocketIOServer } from 'socket.io';

import './instrument';
import { appRouter } from './routes/index';
import { AppSocketBase } from './web/socket';

// Extend Express Response type to include Sentry property
declare module 'express' {
  interface Response {
    sentry?: string;
  }
}

dotenv.config();

const origin: string[] = [];

if (process.env.ENVIRONMENT === 'development') {
  // biome-ignore lint/suspicious/noConsole: <explanation>
  console.info('Running app in dev mode. Setting CORS options');
  origin.push(...(JSON.parse(process.env.APP_ENV as string).CORS_ORIGIN ?? []));
}

if (process.env.ENVIRONMENT === 'production') {
  // biome-ignore lint/suspicious/noConsole: <explanation>
  console.info('Running app in production mode. Setting CORS options: ');
  origin.push(...(JSON.parse(process.env.APP_ENV as string).CORS_ORIGIN ?? []));
  // biome-ignore lint/suspicious/noConsole: <explanation>
  console.info('CORS options set: ', JSON.stringify(origin));
}

const defaultCorsOptions: CorsOptions = {
  origin,
  credentials: true,
  exposedHeaders: ['Authorization'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
};
// CONSOLE LOG PORT TO SEE WHAT VERCEL IS SETTING AS PORT.
const port = process.env.PORT ? Number.parseInt(process.env.PORT) : 3010;
const url = process.env.ENVIRONMENT === 'development' ? 'http://localhost:3010' : '';

// biome-ignore lint/suspicious/noConsole: <explanation>
console.log('URL to listen too: ', url);

class SocketServer {
  port: number;
  corsOptions: CorsOptions;
  app: express.Application;
  httpServer: HTTPServer;
  appRoutes = appRouter;

  constructor(port: number, corsOptions: CorsOptions = defaultCorsOptions) {
    const upload = multer({
      dest: 'uploads/', // TODO: DO WE NEED TO CHANGE THIS?
      limits: { fileSize: 1024 * 1024 * 5 },
    });

    this.port = port;
    this.corsOptions = corsOptions;
    this.app = express();
    this.app.use(express.json());
    this.app.use(upload.single('file'));

    // Middlewares
    this.app.use(cors());
    this.app.use((req: Request, res: Response, next: NextFunction): Response | void => {
      res.header('Access-Control-Allow-Origin', origin?.[0] ?? '');
      res.header('Access-Control-Allow-Credentials', 'true');
      res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Origin, Content-Type, Accept');

      // Handle preflight requests
      if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
      }

      next();
    });
    this.app.use(appRouter);

    // The error handler must be registered before any other error middleware and after all controllers
    Sentry.setupExpressErrorHandler(this.app);

    // Error handling middleware
    this.app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
      // Log the error to Sentry
      const eventId = Sentry.captureException(err);

      // The error id is attached to `res.sentry` to be returned and optionally displayed to the user for support.
      res.statusCode = 500;
      res.json({
        error: true,
        message: err.message,
        sentryId: res.sentry,
        path: req.path,
        eventId,
      });
    });

    // 404 handler - must be after all other routes
    this.app.use((req: Request, res: Response) => {
      const eventId = Sentry.captureException(new Error(`Route not found: ${req.path}`));
      res.status(404).json({
        error: true,
        message: `Route not found: ${req.path}`,
        sentryId: res.sentry,
        eventId,
      });
    });

    this.httpServer = createServer(this.app);
    this.setupAppSocketConnection(new SocketIOServer(this.httpServer));
  }

  setupAppSocketConnection(socketInstance: SocketIOServer) {
    new AppSocketBase(socketInstance).socketEvents();
  }

  start() {
    this.httpServer.listen(this.port, () => {
      // biome-ignore lint/suspicious/noConsole: <explanation>
      console.log(`Server listening to ${url}`);
    });
  }
}

// Usage

const socketServer = new SocketServer(port, defaultCorsOptions);
socketServer.start();
