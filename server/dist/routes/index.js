"use strict";
!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[n]="f8b501ea-8e20-5a76-863a-6da8280d557f")}catch(e){}}();

Object.defineProperty(exports, "__esModule", { value: true });
exports.appRouter = void 0;
const express_1 = require("express");
const auth_1 = require("./auth");
const chats_1 = require("./chats");
class App_Routes {
    constructor() {
        this.router = (0, express_1.Router)();
        this.router.get('/', (_req, res) => {
            res.send('Hello world');
        });
        this.router.use('/api/auth', auth_1.authRouter);
        this.router.use('/api/chats', chats_1.chatRouter);
        this.router.get('/api', this.baseRoute);
    }
    baseRoute(_req, res) {
        res.send('Hello world');
    }
}
exports.appRouter = new App_Routes().router;
//# sourceMappingURL=index.js.map
//# debugId=f8b501ea-8e20-5a76-863a-6da8280d557f
