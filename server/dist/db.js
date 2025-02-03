"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = exports.connectToDB = exports.client = void 0;
const fs_1 = __importDefault(require("fs"));
const node_postgres_1 = require("drizzle-orm/node-postgres");
const getEnvs_1 = require("./utils/getEnvs");
const pg_1 = require("pg");
const { DB_URL } = (0, getEnvs_1.getEnvs)();
exports.client = new pg_1.Client({
    connectionString: DB_URL,
});
exports.client.connect();
const connectToDB = () => {
    let client;
    if (process.env.ENVIRONMENT === "production") {
        ;
        client = new pg_1.Client({
            connectionString: DB_URL,
            ssl: {
                rejectUnauthorized: false,
                key: fs_1.default.readFileSync("./example.test-key.pem"),
                cert: fs_1.default.readFileSync("./example.test.pem"),
            },
        });
    }
    else {
        client = new pg_1.Client({
            connectionString: DB_URL,
        });
    }
    client.connect(err => {
        if (err) {
            console.log("Error connecting to DB: ", err);
        }
        else {
            console.log("Connected to DB successfully");
        }
    });
    const db = (0, node_postgres_1.drizzle)(client);
    return db;
};
exports.connectToDB = connectToDB;
exports.db = (0, node_postgres_1.drizzle)(exports.client);
//# sourceMappingURL=db.js.map