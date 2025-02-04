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
    const tempOrigin = JSON.parse(process.env.APP_ENV).CORS_ORIGIN;
    origin.push(...tempOrigin);
}
const app = (0, express_1.default)();
const upload = (0, multer_1.default)({
    dest: 'uploads/',
    limits: { fileSize: 1024 * 1024 },
});
app.use(express_1.default.json());
app.use(upload.single('file'));
app.use((0, cors_1.default)());
app.use((req, res, next) => {
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
app.use(index_1.appRouter);
app.use((_, res) => {
    res.send("Error");
});
const httpServer = (0, http_1.createServer)(app);
const socketServer = new socket_io_1.Server(httpServer);
new socket_1.AppSocketBase(socketServer).socketEvents();
exports.default = app;
if (process.env.ENVIRONMENT === "development") {
    const port = process.env.PORT ? parseInt(process.env.PORT) : 3010;
    httpServer.listen(port, () => {
        console.log(`Server listening on port ${port}`);
    });
}
//# sourceMappingURL=index.js.map