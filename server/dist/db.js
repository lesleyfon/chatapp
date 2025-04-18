"use strict";
!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[n]="482c66b2-9513-5c9e-9b9e-b22b4899bf1f")}catch(e){}}();

Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
exports.connectToDB = connectToDB;
const node_postgres_1 = require("drizzle-orm/node-postgres");
const pg_1 = require("pg");
const get_envs_1 = require("./utils/get-envs");
const { DATABASE_URL } = (0, get_envs_1.getEnvs)();
function connectToDB() {
    const client = new pg_1.Client({
        connectionString: DATABASE_URL,
    });
    client.connect((err) => {
        if (err) {
            throw new Error(`Database connection error: ${err.message}`);
        }
    });
    return (0, node_postgres_1.drizzle)(client);
}
const client = new pg_1.Client({
    connectionString: DATABASE_URL,
    ssl: process.env.ENVIRONMENT === 'production' ? { rejectUnauthorized: false } : undefined,
});
client.connect();
exports.db = (0, node_postgres_1.drizzle)(client);
//# sourceMappingURL=db.js.map
//# debugId=482c66b2-9513-5c9e-9b9e-b22b4899bf1f
