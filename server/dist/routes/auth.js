"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = exports.AuthRouter = void 0;
const express_1 = require("express");
const Auth_model_1 = require("../model/Auth.model");
const http_status_codes_1 = require("http-status-codes");
const auth_1 = __importDefault(require("../middleware/auth"));
class AuthRouter extends auth_1.default {
    constructor() {
        super();
        this.router = (0, express_1.Router)();
        this.userModels = new Auth_model_1.UserSchema();
        this.register = this.register.bind(this);
        this.authenticateUserRegisterMiddleware = this.authenticateUserRegisterMiddleware.bind(this);
        this.authenticateUserLoginMiddleware = this.authenticateUserLoginMiddleware.bind(this);
        this.router.post("/register", this.authenticateUserRegisterMiddleware, (req, res) => this.register(req, res));
        this.router.post("/login", this.authenticateUserLoginMiddleware, (req, res) => this.login(req, res));
    }
    async register(req, res) {
        const user = req.user;
        const token = req.token;
        res.status(http_status_codes_1.StatusCodes.CREATED).json({ user, token, userId: req.user.pk_user_id });
    }
    async login(req, res) {
        const { password, email } = req.body;
        if (!email || !password) {
            throw res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).send("Please provide email and password");
        }
        res.status(http_status_codes_1.StatusCodes.OK).json({
            user: {
                name: req.user.name,
                email: req.user.email,
                userId: req.user.pk_user_id
            },
            token: req.token,
        });
    }
}
exports.AuthRouter = AuthRouter;
exports.authRouter = new AuthRouter().router;
//# sourceMappingURL=auth.js.map