"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = exports.connectToDB = void 0;
const node_postgres_1 = require("drizzle-orm/node-postgres");
const getEnvs_1 = require("./utils/getEnvs");
const pg_1 = require("pg");
const { DB_URL } = (0, getEnvs_1.getEnvs)();
const connectToDB = () => {
    let client;
    if (process.env.ENVIRONMENT === "production") {
        client = new pg_1.Client({
            connectionString: DB_URL,
            ssl: {
                rejectUnauthorized: false
            }
        });
    }
    else {
        client = new pg_1.Client({
            connectionString: DB_URL,
        });
    }
    client.connect(err => {
        if (err) {
            throw new Error(`Database connection error: ${err.message}`);
        }
    });
    return (0, node_postgres_1.drizzle)(client);
};
exports.connectToDB = connectToDB;
const client = new pg_1.Client({
    connectionString: DB_URL,
    ssl: process.env.ENVIRONMENT === "production"
        ? { rejectUnauthorized: false }
        : undefined
});
client.connect();
exports.db = (0, node_postgres_1.drizzle)(client);
//# sourceMappingURL=db.js.map