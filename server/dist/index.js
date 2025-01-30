"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const socket_1 = require("./web/socket");
const index_1 = require("./routes/index");
const CorsOptions = {
    origin: ["http://localhost:5173", "http://localhost:3010/auth/login"],
};
class SocketServer {
    constructor(port, corsOptions) {
        this.appRoutes = index_1.appRouter;
        this.port = port;
        this.corsOptions = corsOptions;
        this.app = (0, express_1.default)();
        this.app.use(express_1.default.json());
        this.app.use((0, cors_1.default)());
        this.app.use((req, res, next) => {
            res.header("Access-Control-Allow-Origin", "http://localhost:5173");
            res.header("Access-Control-Allow-Credentials", "true");
            res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
            res.header("Access-Control-Allow-Headers", "Origin, Content-Type, Accept");
            if (req.method === "OPTIONS") {
                return res.sendStatus(200);
            }
            return next();
        });
        this.app.use(index_1.appRouter);
        this.app.use((_req, res) => {
            res.send("Error");
        });
        this.httpServer = (0, http_1.createServer)(this.app);
        this.setupAppSocketConnection(new socket_io_1.Server(this.httpServer));
    }
    setupAppSocketConnection(socketInstance) {
        new socket_1.AppSocketBase(socketInstance).socketEvents();
    }
    start() {
        this.httpServer.listen(this.port, () => {
            console.log(`Server listening to http://localhost:${this.port}`);
        });
    }
}
const corsOptions = {
    origin: ["http://localhost:5173"],
};
const socketServer = new SocketServer(3010, corsOptions);
socketServer.start();
//# sourceMappingURL=index.js.map