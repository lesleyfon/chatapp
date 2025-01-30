"use strict";
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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserSchema = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importStar(require("jsonwebtoken"));
const getEnvs_1 = require("../utils/getEnvs");
const db_1 = require("../db");
const schema_1 = require("../schema");
const drizzle_orm_1 = require("drizzle-orm");
const http_status_codes_1 = require("http-status-codes");
const { JWT_LIFETIME, JWT_SECRET } = (0, getEnvs_1.getEnvs)();
class UserSchema {
    constructor() {
        this.db = (0, db_1.connectToDB)();
    }
    async createUser({ name, password, email, }) {
        try {
            const hashedPassword = await this.hashPassword({ password });
            const response = await this.db
                .insert(schema_1.user)
                .values({ name, password: hashedPassword, email })
                .returning({
                id: schema_1.user.pk_user_id,
                name: schema_1.user.name,
                email: schema_1.user.email,
            });
            return {
                name,
                email,
                password: hashedPassword,
                id: response[0].id,
                pk_user_id: response[0].id
            };
        }
        catch (err) {
            if (typeof err === "object" && Object.keys(err).length) {
                throw new Error(JSON.stringify(err));
            }
        }
        return;
    }
    async getUser({ email }) {
        try {
            const userExist = await this.db.select().from(schema_1.user).where((0, drizzle_orm_1.eq)(schema_1.user.email, email));
            if (userExist.length === 0) {
                return undefined;
            }
            return userExist[0];
        }
        catch (err) {
            if (typeof err === "object" && Object.keys(err).length) {
                throw new Error(JSON.stringify(err));
            }
            return err;
        }
    }
    async getAuthUser({ email, password }) {
        var _a, _b;
        const userExist = await this.db.select().from(schema_1.user).where((0, drizzle_orm_1.eq)(schema_1.user.email, email));
        if (userExist.length === 0) {
            return { code: http_status_codes_1.StatusCodes.NOT_FOUND, message: "User does not exist" };
        }
        const dbUser = Object.assign(Object.assign({}, userExist[0]), { pk_user_id: userExist[0].pk_user_id });
        const isPasswordCorrect = await this.comparePassword({
            password,
            encryptedPassword: dbUser === null || dbUser === void 0 ? void 0 : dbUser.password,
        });
        if (!isPasswordCorrect) {
            return {
                message: "Incorrect password",
                code: http_status_codes_1.StatusCodes.UNAUTHORIZED,
            };
        }
        const token = await this.createJWT({
            name: (_a = dbUser.name) !== null && _a !== void 0 ? _a : "",
            email: dbUser === null || dbUser === void 0 ? void 0 : dbUser.email,
            userId: dbUser.pk_user_id
        });
        return {
            user: {
                id: dbUser.pk_user_id,
                pk_user_id: dbUser.pk_user_id,
                name: (_b = dbUser.name) !== null && _b !== void 0 ? _b : "",
                email: dbUser.email,
                password: dbUser.password,
            },
            token,
        };
    }
    async createJWT({ name, email, userId }) {
        const token = jsonwebtoken_1.default.sign({
            userId,
            name: name,
            email: email,
        }, JWT_SECRET, { expiresIn: JWT_LIFETIME });
        return token;
    }
    async decodeJWT(token) {
        try {
            if (!token) {
                return;
            }
            const response = await jsonwebtoken_1.default.verify(token, JWT_SECRET);
            return response;
        }
        catch (err) {
            if (err instanceof jsonwebtoken_1.TokenExpiredError) {
                return {
                    message: "Unauthorized",
                    code: http_status_codes_1.StatusCodes.UNAUTHORIZED,
                };
            }
            return undefined;
        }
    }
    async comparePassword({ encryptedPassword, password, }) {
        const isMatch = await bcrypt_1.default.compare(password, encryptedPassword);
        return isMatch;
    }
    async hashPassword({ password }) {
        const salt = await bcrypt_1.default.genSalt(10);
        const passwordHash = await bcrypt_1.default.hash(password, salt);
        return passwordHash;
    }
}
exports.UserSchema = UserSchema;
//# sourceMappingURL=Auth.model.js.map