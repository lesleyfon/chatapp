"use strict";
!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[n]="cef5bbd2-6376-5cce-8f7f-6d35239ac318")}catch(e){}}();

var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
const Sentry = __importStar(require("@sentry/node"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const node_http_1 = require("node:http");
const socket_io_1 = require("socket.io");
require("./instrument");
const index_1 = require("./routes/index");
const socket_1 = require("./web/socket");
dotenv_1.default.config();
const origin = [];
if (process.env.ENVIRONMENT === 'development') {
    console.info('Running app in dev mode. Setting CORS options');
    origin.push(...((_a = JSON.parse(process.env.APP_ENV).CORS_ORIGIN) !== null && _a !== void 0 ? _a : []));
}
if (process.env.ENVIRONMENT === 'production') {
    console.info('Running app in production mode. Setting CORS options: ');
    origin.push(...((_b = JSON.parse(process.env.APP_ENV).CORS_ORIGIN) !== null && _b !== void 0 ? _b : []));
    console.info('CORS options set: ', JSON.stringify(origin));
}
const defaultCorsOptions = {
    origin,
    credentials: true,
    exposedHeaders: ['Authorization'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
};
const port = process.env.PORT ? Number.parseInt(process.env.PORT) : 3010;
const url = process.env.ENVIRONMENT === 'development' ? 'http://localhost:3010' : '';
console.log('URL to listen too: ', url);
class SocketServer {
    constructor(port, corsOptions = defaultCorsOptions) {
        this.appRoutes = index_1.appRouter;
        const upload = (0, multer_1.default)({
            dest: 'uploads/',
            limits: { fileSize: 1024 * 1024 * 5 },
        });
        this.port = port;
        this.corsOptions = corsOptions;
        this.app = (0, express_1.default)();
        this.app.use(express_1.default.json());
        this.app.use(upload.single('file'));
        this.app.use((0, cors_1.default)());
        this.app.use((req, res, next) => {
            var _a;
            res.header('Access-Control-Allow-Origin', (_a = origin === null || origin === void 0 ? void 0 : origin[0]) !== null && _a !== void 0 ? _a : '');
            res.header('Access-Control-Allow-Credentials', 'true');
            res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
            res.header('Access-Control-Allow-Headers', 'Origin, Content-Type, Accept');
            if (req.method === 'OPTIONS') {
                return res.sendStatus(200);
            }
            next();
        });
        this.app.use(index_1.appRouter);
        Sentry.setupExpressErrorHandler(this.app);
        this.app.use((err, req, res, _next) => {
            const eventId = Sentry.captureException(err);
            res.statusCode = 500;
            res.json({
                error: true,
                message: err.message,
                sentryId: res.sentry,
                path: req.path,
                eventId,
            });
        });
        this.app.use((req, res) => {
            const eventId = Sentry.captureException(new Error(`Route not found: ${req.path}`));
            res.status(404).json({
                error: true,
                message: `Route not found: ${req.path}`,
                sentryId: res.sentry,
                eventId,
            });
        });
        this.httpServer = (0, node_http_1.createServer)(this.app);
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
const socketServer = new SocketServer(port, defaultCorsOptions);
socketServer.start();
//# sourceMappingURL=index.js.map
//# debugId=cef5bbd2-6376-5cce-8f7f-6d35239ac318
