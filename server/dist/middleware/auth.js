"use strict";
!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[n]="5eecccb7-4a7b-5c61-9780-1742ad8f0b9d")}catch(e){}}();

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthMiddleware = void 0;
const drizzle_orm_1 = require("drizzle-orm");
const http_status_codes_1 = require("http-status-codes");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const auth_model_1 = require("../model/auth.model");
const schema_1 = require("../schema");
class AuthMiddleware extends auth_model_1.UserSchema {
    constructor() {
        super();
        this.authenticateRequests = this.authenticateRequests.bind(this);
        this.authenticateUserLoginMiddleware = this.authenticateUserLoginMiddleware.bind(this);
    }
    async authenticateRequests(req, res, next) {
        const authorization = req.headers.authorization;
        if (!authorization || !authorization.includes('Bearer')) {
            return res.status(http_status_codes_1.StatusCodes.UNAUTHORIZED).json({
                reason: 'Unauthorized',
                code: http_status_codes_1.StatusCodes.UNAUTHORIZED,
            });
        }
        const token = authorization.split(' ')[1];
        const user = jsonwebtoken_1.default.decode(token);
        if (!user) {
            return res.status(http_status_codes_1.StatusCodes.UNAUTHORIZED).json({
                reason: 'Unauthorized',
                code: http_status_codes_1.StatusCodes.UNAUTHORIZED,
            });
        }
        const userExist = await this.getUser({ email: user.email });
        if (userExist === undefined) {
            return res.status(http_status_codes_1.StatusCodes.UNAUTHORIZED).json({
                reason: 'Unauthorized',
                code: http_status_codes_1.StatusCodes.UNAUTHORIZED,
            });
        }
        req.user = {
            pk_user_id: user.userId,
            email: user.email,
            name: user.name,
        };
        next();
        return;
    }
    async authenticateUserLoginMiddleware(req, res, next) {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({
                reason: 'Bad Request email and password are required',
                code: http_status_codes_1.StatusCodes.BAD_REQUEST,
            });
        }
        const response = await this.getAuthUser({ email, password });
        if (response.code) {
            return res.status(response.code).json(response);
        }
        req.user = response.user;
        req.token = response.token;
        return next();
    }
    async authenticateUserRegisterMiddleware(req, res, next) {
        const { email, password, name, timezone, created_at } = req.body;
        if (!email || !password || !name) {
            return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({
                reason: 'Bad Request email name, and password are required to register',
            });
        }
        if (!timezone || !created_at) {
            return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({
                reason: 'Bad Request timezone, and created_at are required to register',
            });
        }
        const userExist = await this.db.select().from(schema_1.user).where((0, drizzle_orm_1.eq)(schema_1.user.email, email));
        if (userExist.length > 0) {
            return res.status(http_status_codes_1.StatusCodes.FORBIDDEN).json({
                reason: 'User with email already exist. Try another email',
                code: http_status_codes_1.StatusCodes.FORBIDDEN,
            });
        }
        const userObj = await this.createUser({
            email,
            password,
            name,
            timezone,
            created_at,
        });
        if (!userExist) {
            return res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json({
                reason: 'Error occurred while creating a new user',
                code: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR,
            });
        }
        req.user = {
            name,
            email,
            userId: userObj === null || userObj === void 0 ? void 0 : userObj.id,
            timezone: userObj === null || userObj === void 0 ? void 0 : userObj.timezone,
        };
        req.token = await this.createJWT({ name, email, userId: userObj === null || userObj === void 0 ? void 0 : userObj.id });
        return next();
    }
}
exports.AuthMiddleware = AuthMiddleware;
exports.default = AuthMiddleware;
//# sourceMappingURL=auth.js.map
//# debugId=5eecccb7-4a7b-5c61-9780-1742ad8f0b9d
