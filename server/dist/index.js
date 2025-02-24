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
const multer_1 = __importDefault(require("multer"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const origin = [];
if (process.env.ENVIRONMENT === "development") {
    console.log("Running app in dev mode");
    const tempOrigin = JSON.parse(process.env.APP_ENV).CORS_ORIGIN;
    origin.push(...tempOrigin);
}
const CorsOptions = {
    origin,
};
const port = process.env.PORT ? parseInt(process.env.PORT) : 3010;
const url = process.env.ENVIRONMENT === "development" ? "http://localhost:3010" : "";
console.log("URL to listen too: ", url);
class SocketServer {
    constructor(port, corsOptions) {
        this.appRoutes = index_1.appRouter;
        const upload = (0, multer_1.default)({
            dest: 'uploads/',
            limits: { fileSize: 1024 * 1024 },
        });
        this.port = port;
        this.corsOptions = corsOptions;
        this.app = (0, express_1.default)();
        this.app.use(express_1.default.json());
        this.app.use(upload.single('file'));
        this.app.use((0, cors_1.default)());
        this.app.use((req, res, next) => {
            var _a;
            res.header("Access-Control-Allow-Origin", (_a = origin === null || origin === void 0 ? void 0 : origin[0]) !== null && _a !== void 0 ? _a : '');
            res.header("Access-Control-Allow-Credentials", "true");
            res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
            res.header("Access-Control-Allow-Headers", "Origin, Content-Type, Accept");
            if (req.method === "OPTIONS") {
                return res.sendStatus(200);
            }
            next();
        });
        this.app.use(index_1.appRouter);
        this.app.use((_, res) => {
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
            console.log(`Server listening to ${url}`);
        });
    }
}
const corsOptions = { origin };
const socketServer = new SocketServer(port, corsOptions);
socketServer.start();
//# sourceMappingURL=index.js.map