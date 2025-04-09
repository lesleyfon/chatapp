"use strict";
!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[n]="f2ac3de4-d059-573a-8114-e1b2bde7827d")}catch(e){}}();

Object.defineProperty(exports, "__esModule", { value: true });
exports.db = exports.connectToDB = void 0;
const node_postgres_1 = require("drizzle-orm/node-postgres");
const pg_1 = require("pg");
const getEnvs_1 = require("./utils/getEnvs");
const { DATABASE_URL } = (0, getEnvs_1.getEnvs)();
const connectToDB = () => {
    const client = new pg_1.Client({
        connectionString: DATABASE_URL,
    });
    client.connect((err) => {
        if (err) {
            throw new Error(`Database connection error: ${err.message}`);
        }
    });
    return (0, node_postgres_1.drizzle)(client);
};
exports.connectToDB = connectToDB;
const client = new pg_1.Client({
    connectionString: DATABASE_URL,
    ssl: process.env.ENVIRONMENT === "production"
        ? { rejectUnauthorized: false }
        : undefined,
});
client.connect();
exports.db = (0, node_postgres_1.drizzle)(client);
//# sourceMappingURL=db.js.map
//# debugId=f2ac3de4-d059-573a-8114-e1b2bde7827d
