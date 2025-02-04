"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.appRouter = void 0;
const express_1 = require("express");
const auth_1 = require("./auth");
const chats_1 = require("./chats");
const router = (0, express_1.Router)();
router.use("/api/auth", auth_1.authRouter);
router.use("/api/chats", chats_1.chatRouter);
router.get("/api", (_req, res) => {
    res.send("Hello world");
});
exports.appRouter = router;
//# sourceMappingURL=index.js.map