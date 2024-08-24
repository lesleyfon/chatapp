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


