import express, { NextFunction, Response, Request } from "express";
import { createServer, Server as HTTPServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import cors, { CorsOptions } from "cors";
import { AppSocketBase } from "./web/socket";
import { appRouter } from "./routes/index";

const CorsOptions = {
  origin: ["http://localhost:5173", "http://localhost:3010/auth/login"],
};

class SocketServer {
  port: number;
  corsOptions: CorsOptions;
  app: express.Application;
  httpServer: HTTPServer;
  appRoutes = appRouter;
  constructor(port: number, corsOptions: CorsOptions) {
    this.port = port;
    this.corsOptions = corsOptions;
    this.app = express();
    this.app.use(express.json());

    this.app.use(cors());
    this.app.use((req: Request, res: Response, next: NextFunction) => {

      res.header("Access-Control-Allow-Origin", "http://localhost:5173");
      res.header("Access-Control-Allow-Credentials", "true");
      res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
      res.header("Access-Control-Allow-Headers", "Origin, Content-Type, Accept");

      // Handle preflight requests
      if (req.method === "OPTIONS") {
        return res.sendStatus(200);
      }
			

      return next();
    });
    this.app.use(appRouter);
    this.app.use((_req: Request, res: Response) => {
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
      console.log(`Server listening to http://localhost:${this.port}`);
    });
  }
}

// Usage
const corsOptions = {
  origin: ["http://localhost:5173"],
};

const socketServer = new SocketServer(3010, corsOptions);
socketServer.start();
