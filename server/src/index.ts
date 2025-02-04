import express, { NextFunction, Response, Request } from "express";
import { createServer, Server as HTTPServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import cors, { CorsOptions } from "cors";
import { AppSocketBase } from "./web/socket";
import { appRouter } from "./routes/index";
import multer from 'multer';
import dotenv from 'dotenv';

dotenv.config();
const origin: string[] = [];

if(process.env.ENVIRONMENT === "development"){
  const tempOrigin:string[] = JSON.parse(process.env.APP_ENV as string).CORS_ORIGIN;
  origin.push(...tempOrigin);
}
const CorsOptions = {
  origin,
};
// CONSOLE LOG PORT TO SEE WHAT VERCEL IS SETTING AS PORT.
const port = process.env.PORT ? parseInt(process.env.PORT) : 3010;
const url = process.env.ENVIRONMENT === "development" ? "http://localhost:3010": "" ;

class SocketServer {
  port: number;
  corsOptions: CorsOptions;
  app: express.Application;
  httpServer: HTTPServer;
  appRoutes = appRouter;
  constructor(port: number, corsOptions: CorsOptions) {
    const upload = multer({
      dest: 'uploads/',// TODO: DO WE NEED TO CHANGE THIS?
      limits: { fileSize: 1024 * 1024 },
    });
    this.port = port;
    this.corsOptions = corsOptions;
    this.app = express();
    this.app.use(express.json());
    this.app.use(upload.single('file'));

    this.app.use(cors());
    this.app.use((req: Request, res: Response, next: NextFunction): void | Response => {

      res.header("Access-Control-Allow-Origin", origin?.[0] ?? '');
      res.header("Access-Control-Allow-Credentials", "true");
      res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
      res.header("Access-Control-Allow-Headers", "Origin, Content-Type, Accept");

      // Handle preflight requests
      if (req.method === "OPTIONS") {
        return res.sendStatus(200);
      }

      next();
    });
    this.app.use(appRouter);
    this.app.use((_, res: Response) => {
      res.send("Error");
    });
    this.httpServer = createServer(this.app);
    this.setupAppSocketConnection(new SocketIOServer(this.httpServer));
  }

  setupAppSocketConnection(socketInstance: SocketIOServer) {
    new AppSocketBase(socketInstance).socketEvents();
  }

  start() {
    this.httpServer.listen(this.port, () => {
      // eslint-disable-next-line no-console
      console.log(`Server listening to ${url}`);
    });
  }
}

// Usage
const corsOptions = { origin };

const socketServer = new SocketServer(port, corsOptions);
socketServer.start();
