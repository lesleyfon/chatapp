"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthMiddleware = void 0;
const http_status_codes_1 = require("http-status-codes");
const Auth_model_1 = require("../model/Auth.model");
const schema_1 = require("../schema");
const drizzle_orm_1 = require("drizzle-orm");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
class AuthMiddleware extends Auth_model_1.UserSchema {
    constructor() {
        super();
        this.authenticateRequests = this.authenticateRequests.bind(this);
        this.authenticateUserLoginMiddleware = this.authenticateUserLoginMiddleware.bind(this);
    }
    async authenticateRequests(req, res, next) {
        const authorization = req.headers["authorization"];
        if (!authorization || !authorization.includes("Bearer")) {
            return res.status(http_status_codes_1.StatusCodes.UNAUTHORIZED).json({
                message: "Unauthorized",
                code: http_status_codes_1.StatusCodes.UNAUTHORIZED,
            });
        }
        const token = authorization.split(" ")[1];
        const user = jsonwebtoken_1.default.decode(token);
        if (!user) {
            return res.status(http_status_codes_1.StatusCodes.UNAUTHORIZED).json({
                message: "Unauthorized",
                code: http_status_codes_1.StatusCodes.UNAUTHORIZED,
            });
        }
        const userExist = await this.getUser({ email: user.email });
        if (userExist === undefined) {
            return res.status(http_status_codes_1.StatusCodes.UNAUTHORIZED).json({
                message: "Unauthorized",
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
                message: `Bad Request email and password are required`,
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
        const { email, password, name } = req.body;
        if (!email || !password || !name) {
            return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({
                message: `Bad Request email name, and password are required to register`,
            });
        }
        const userExist = await this.db.select().from(schema_1.user).where((0, drizzle_orm_1.eq)(schema_1.user.email, email));
        if (userExist.length > 0) {
            return res.status(http_status_codes_1.StatusCodes.FORBIDDEN).json({
                message: "User with email already exist. Try another email",
                code: http_status_codes_1.StatusCodes.FORBIDDEN,
            });
        }
        const userObj = await this.createUser({
            email,
            password,
            name,
        });
        if (!userExist) {
            return res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json({
                message: "Error occurred while creating a new user",
                code: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR,
            });
        }
        req.user = {
            name,
            email,
            password: userObj === null || userObj === void 0 ? void 0 : userObj.password,
            userId: userObj === null || userObj === void 0 ? void 0 : userObj.id,
        };
        req.token = await this.createJWT({ name, email });
        return next();
    }
}
exports.AuthMiddleware = AuthMiddleware;
exports.default = AuthMiddleware;
//# sourceMappingURL=auth.js.map