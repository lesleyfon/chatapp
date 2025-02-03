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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEnvs = getEnvs;
const dotenv = __importStar(require("dotenv"));
dotenv.config();
function getEnvs() {
    const { MONGO_CONNECTION_URL, PORT, JWT_SECRET, JWT_LIFETIME, DATABASE_HOST, DATABASE_USERNAME, DATABASE_PASSWORD, DB_URL, } = JSON.parse(process.env.APP_ENV);
    if (process.env.ENVIRONMENT === "development") {
        console.log("Line 28:in the conditional if(process.env.ENVIRONMENT === 'development')");
        return {
            MONGO_CONNECTION_URL,
            PORT,
            JWT_SECRET,
            JWT_LIFETIME,
            DATABASE_HOST,
            DATABASE_USERNAME,
            DATABASE_PASSWORD,
            DB_URL,
        };
    }
    console.log("Line 41: process.env.ENVIRONMENT ", process.env.ENVIRONMENT);
    console.log("Line 42: MONGO_CONNECTION_URL", MONGO_CONNECTION_URL);
    return {
        MONGO_CONNECTION_URL,
        PORT,
        JWT_SECRET,
        JWT_LIFETIME,
        DATABASE_HOST,
        DATABASE_USERNAME,
        DATABASE_PASSWORD,
    };
}
//# sourceMappingURL=getEnvs.js.map