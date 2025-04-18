"use strict";
!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[n]="4d3f4c06-c67d-5026-8a3d-dde9d5c7f4e5")}catch(e){}}();

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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEnvs = getEnvs;
const dotenv = __importStar(require("dotenv"));
dotenv.config();
function getEnvs() {
    const { MONGO_CONNECTION_URL, PORT, JWT_SECRET, JWT_LIFETIME, DATABASE_HOST, DATABASE_USERNAME, DATABASE_PASSWORD, DB_URL, DATABASE_URL, SENTRY_DSN, } = JSON.parse(process.env.APP_ENV);
    return {
        MONGO_CONNECTION_URL,
        PORT,
        JWT_SECRET,
        JWT_LIFETIME,
        DATABASE_HOST,
        DATABASE_USERNAME,
        DATABASE_PASSWORD,
        DB_URL,
        DATABASE_URL,
        SENTRY_DSN: SENTRY_DSN || '',
    };
}
//# sourceMappingURL=get-envs.js.map
//# debugId=4d3f4c06-c67d-5026-8a3d-dde9d5c7f4e5
