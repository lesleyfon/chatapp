"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = exports.connectToDB = exports.client = void 0;
const node_postgres_1 = require("drizzle-orm/node-postgres");
const getEnvs_1 = require("./utils/getEnvs");
const pg_1 = require("pg");
const { DB_URL } = (0, getEnvs_1.getEnvs)();
exports.client = new pg_1.Client({
    connectionString: DB_URL,
});
exports.client.connect();
const connectToDB = () => {
    const client = new pg_1.Client({
        connectionString: DB_URL,
    });
    client.connect();
    const db = (0, node_postgres_1.drizzle)(client);
    return db;
};
exports.connectToDB = connectToDB;
exports.db = (0, node_postgres_1.drizzle)(exports.client);
//# sourceMappingURL=db.js.map