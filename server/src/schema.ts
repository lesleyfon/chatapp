import { sql } from "drizzle-orm";
import { primaryKey } from "drizzle-orm/mysql-core";

import { serial, text, timestamp, pgTable, uuid } from "drizzle-orm/pg-core";

/**
 * @description This is the schema for the chat application
 */
export const chats = pgTable("chats", {
  pk_chats_id: uuid("pk_chats_id").primaryKey().defaultRandom(),
  chat_name: text("chat_name"),
  createdAt: timestamp("created_at")
    .notNull()
    .default(sql`now()`),
});

// User Table
export const user = pgTable("chat_user", {
  pk_user_id: uuid("pk_user_id").primaryKey().defaultRandom(),
  name: text("name"),
  email: text("email"),
  password: text("password"),
  created_at: timestamp("created_at")
    .notNull()
    .default(sql`now()`),
  updated_at: timestamp("updated_at")
    .notNull()
    .default(sql`now()`),
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
export const privateChats = pgTable("private_chat", {
  pk_private_chat_id: uuid("pk_private_chat_id").primaryKey().defaultRandom(), // Assuming UUID is your primary key type
  sender_id: uuid("sender_id").references(() => user.pk_user_id, { onDelete: "cascade" }).notNull(), // Use uuid if user_id is also UUID
  recipient_id: uuid("recipient_id").references(() => user.pk_user_id, { onDelete: "cascade" }).notNull(), // Use uuid for consistency
  created_at: timestamp("created_at").notNull().default(sql`now()`), // Use snake_case for consistency
});


export const chatMembers = pgTable("chat_members",
  {
    id: uuid('id').defaultRandom(),
    fk_chat_id: text("fk_chat_id")
      .references(() => chats.pk_chats_id, { onDelete: "cascade" })
      .notNull(),
    fk_user_id: text("fk_user_id")
      .references(() => user.pk_user_id, { onDelete: "cascade" })
      .notNull(),
    added_at: timestamp("added_at")
      .notNull()
      .default(sql`now()`),
  },
  (table) => ({
    // @ts-expect-error des
    compositePK: primaryKey({columns: [table.fk_chat_id, table.fk_user_id]}),
  }));

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  fk_chat_id: text("fk_chat_id")
    .references(() => chats.pk_chats_id, { onDelete: "cascade" })
    .notNull(),
  fk_user_id: text("fk_user_id")
    .references(() => user.pk_user_id, { onDelete: "cascade" })
    .notNull(),
  message_text: text("message_text"),
  sent_at: timestamp("sent_at")
    .notNull()
    .default(sql`now()`),
});


export const privateMessages = pgTable("private_messages", {
  id: serial("id").primaryKey(),
  fk_private_chat_id: text("fk_private_chat_id")
    .references(() => privateChats.pk_private_chat_id, { onDelete: "cascade" }).notNull(),
  fk_user_id: text("fk_user_id")
    .references(() => user.pk_user_id, { onDelete: "cascade" })
    .notNull(),
  message_text: text("message_text"),
  sent_at: timestamp("sent_at")
    .notNull()
    .default(sql`now()`),
});