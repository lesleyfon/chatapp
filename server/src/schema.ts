import { primaryKey } from 'drizzle-orm/mysql-core';
import { customType, integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

const bytea = customType<{ data: Buffer; notNull: false; default: false }>({
  dataType() {
    return 'bytea';
  },
});

/**
 * @description This is the schema for the chat application
 */
export const chats = pgTable('chats', {
  pk_chats_id: serial('pk_chats_id').primaryKey(),
  chat_name: text('chat_name'),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull(),
  timezone: text('timezone').notNull(),
});

// User Table
export const user = pgTable('chat_user', {
  pk_user_id: serial('pk_user_id').primaryKey(),
  name: text('name'),
  email: text('email'),
  password: text('password'),
  created_at: timestamp('created_at', { mode: 'string' }).notNull(),
  updated_at: timestamp('updated_at', { mode: 'string' }).notNull().defaultNow(),
  timezone: text('timezone').notNull(),
});

/**
 * Represents the schema for the `private_chat` table in the database.
 *
 * This table stores information about private chat messages between users.
 *
 * Columns:
 * - `pk_private_chat_id`: Primary key for the private chat entry, generated as a random UUID.
 * - `sender`: The ID of the user who sent the message. References the `pk_user_id` in the `user` table.
 *   If the referenced user is deleted, the corresponding chat entries will also be deleted (cascade).
 * - `recipient`: The ID of the user who received the message. References the `pk_user_id` in the `user` table.
 *   If the referenced user is deleted, the corresponding chat entries will also be deleted (cascade).
 * - `createdAt`: The timestamp when the chat message was created. Defaults to the current time.
 */
export const privateChats = pgTable('private_chat', {
  pk_private_chat_id: serial('pk_private_chat_id').primaryKey(),
  sender_id: integer('sender_id')
    .references(() => user.pk_user_id, { onDelete: 'cascade' })
    .notNull(),
  recipient_id: integer('recipient_id')
    .references(() => user.pk_user_id, { onDelete: 'cascade' })
    .notNull(),
  created_at: timestamp('created_at', { mode: 'string' }).notNull(),
  timezone: text('timezone').notNull(),
});

export const chatMembers = pgTable(
  'chat_members',
  {
    id: serial('id').primaryKey(),
    fk_chat_id: integer('fk_chat_id')
      .references(() => chats.pk_chats_id, { onDelete: 'cascade' })
      .notNull(),
    fk_user_id: integer('fk_user_id')
      .references(() => user.pk_user_id, { onDelete: 'cascade' })
      .notNull(),
    added_at: timestamp('added_at', { mode: 'string' }).notNull(),
    timezone: text('timezone').notNull(),
  },
  (table) => ({
    // @ts-expect-error des
    compositePK: primaryKey({ columns: [table.fk_chat_id, table.fk_user_id] }),
  }),
);

export const messages = pgTable('messages', {
  id: serial('id').primaryKey(),
  fk_chat_id: integer('fk_chat_id')
    .references(() => chats.pk_chats_id, { onDelete: 'cascade' })
    .notNull(),
  fk_user_id: integer('fk_user_id')
    .references(() => user.pk_user_id, { onDelete: 'cascade' })
    .notNull(),
  message_text: text('message_text'),
  sent_at: timestamp('sent_at', { mode: 'string' }).notNull(),
  timezone: text('timezone').notNull(),
});

export const privateMessages = pgTable('private_messages', {
  id: serial('id').primaryKey().notNull(),
  fk_private_chat_id: integer('fk_private_chat_id')
    .references(() => privateChats.pk_private_chat_id, { onDelete: 'cascade' })
    .notNull(),
  fk_user_id: integer('fk_user_id')
    .references(() => user.pk_user_id, { onDelete: 'cascade' })
    .notNull(),
  message_text: text('message_text'),
  image_name: text('image_name'),
  image_file: bytea('image_file'),
  sent_at: timestamp('sent_at', { mode: 'string' }).notNull(),
  timezone: text('timezone').notNull(),
});
