"use strict";
!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[n]="517eeea5-a546-5cbe-9625-c8237a73c3fa")}catch(e){}}();

Object.defineProperty(exports, "__esModule", { value: true });
exports.privateMessages = exports.messages = exports.chatMembers = exports.privateChats = exports.user = exports.chats = void 0;
const mysql_core_1 = require("drizzle-orm/mysql-core");
const pg_core_1 = require("drizzle-orm/pg-core");
const bytea = (0, pg_core_1.customType)({
    dataType() {
        return 'bytea';
    },
});
exports.chats = (0, pg_core_1.pgTable)('chats', {
    pk_chats_id: (0, pg_core_1.serial)('pk_chats_id').primaryKey(),
    chat_name: (0, pg_core_1.text)('chat_name'),
    createdAt: (0, pg_core_1.timestamp)('created_at', { mode: 'string' }).notNull(),
    timezone: (0, pg_core_1.text)('timezone').notNull(),
});
exports.user = (0, pg_core_1.pgTable)('chat_user', {
    pk_user_id: (0, pg_core_1.serial)('pk_user_id').primaryKey(),
    name: (0, pg_core_1.text)('name'),
    email: (0, pg_core_1.text)('email'),
    password: (0, pg_core_1.text)('password'),
    created_at: (0, pg_core_1.timestamp)('created_at', { mode: 'string' }).notNull(),
    updated_at: (0, pg_core_1.timestamp)('updated_at', { mode: 'string' }).notNull().defaultNow(),
    timezone: (0, pg_core_1.text)('timezone').notNull(),
});
exports.privateChats = (0, pg_core_1.pgTable)('private_chat', {
    pk_private_chat_id: (0, pg_core_1.serial)('pk_private_chat_id').primaryKey(),
    sender_id: (0, pg_core_1.integer)('sender_id')
        .references(() => exports.user.pk_user_id, { onDelete: 'cascade' })
        .notNull(),
    recipient_id: (0, pg_core_1.integer)('recipient_id')
        .references(() => exports.user.pk_user_id, { onDelete: 'cascade' })
        .notNull(),
    created_at: (0, pg_core_1.timestamp)('created_at', { mode: 'string' }).notNull(),
    timezone: (0, pg_core_1.text)('timezone').notNull(),
});
exports.chatMembers = (0, pg_core_1.pgTable)('chat_members', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    fk_chat_id: (0, pg_core_1.integer)('fk_chat_id')
        .references(() => exports.chats.pk_chats_id, { onDelete: 'cascade' })
        .notNull(),
    fk_user_id: (0, pg_core_1.integer)('fk_user_id')
        .references(() => exports.user.pk_user_id, { onDelete: 'cascade' })
        .notNull(),
    added_at: (0, pg_core_1.timestamp)('added_at', { mode: 'string' }).notNull(),
    timezone: (0, pg_core_1.text)('timezone').notNull(),
}, (table) => ({
    compositePK: (0, mysql_core_1.primaryKey)({ columns: [table.fk_chat_id, table.fk_user_id] }),
}));
exports.messages = (0, pg_core_1.pgTable)('messages', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    fk_chat_id: (0, pg_core_1.integer)('fk_chat_id')
        .references(() => exports.chats.pk_chats_id, { onDelete: 'cascade' })
        .notNull(),
    fk_user_id: (0, pg_core_1.integer)('fk_user_id')
        .references(() => exports.user.pk_user_id, { onDelete: 'cascade' })
        .notNull(),
    message_text: (0, pg_core_1.text)('message_text'),
    sent_at: (0, pg_core_1.timestamp)('sent_at', { mode: 'string' }).notNull(),
    timezone: (0, pg_core_1.text)('timezone').notNull(),
});
exports.privateMessages = (0, pg_core_1.pgTable)('private_messages', {
    id: (0, pg_core_1.serial)('id').primaryKey().notNull(),
    fk_private_chat_id: (0, pg_core_1.integer)('fk_private_chat_id')
        .references(() => exports.privateChats.pk_private_chat_id, { onDelete: 'cascade' })
        .notNull(),
    fk_user_id: (0, pg_core_1.integer)('fk_user_id')
        .references(() => exports.user.pk_user_id, { onDelete: 'cascade' })
        .notNull(),
    message_text: (0, pg_core_1.text)('message_text'),
    image_name: (0, pg_core_1.text)('image_name'),
    image_file: bytea('image_file'),
    sent_at: (0, pg_core_1.timestamp)('sent_at', { mode: 'string' }).notNull(),
    timezone: (0, pg_core_1.text)('timezone').notNull(),
});
//# sourceMappingURL=schema.js.map
//# debugId=517eeea5-a546-5cbe-9625-c8237a73c3fa
