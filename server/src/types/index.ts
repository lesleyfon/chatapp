import type { File } from 'node:buffer';
import type { Request } from 'express';

export type RequestWithUser = Request & {
  user: Omit<UserInterface, 'created_at' | 'updated_at'>;
  token: string;
};
// Environment and Configuration Types
export interface ENV_VARS {
  MONGO_CONNECTION_URL: string;
  PORT: string;
  JWT_SECRET: string;
  JWT_LIFETIME: string;
  DATABASE_HOST: string;
  DATABASE_USERNAME: string;
  DATABASE_PASSWORD: string;
  DB_URL: string;
  DATABASE_URL: string;
  SENTRY_DSN: string;
  SUPABASE_BUCKET_SECRET: string;
  SUPABASE_BUCKET_URL: string;
}

export type SQLErrorType = {
  error: boolean;

  reason: string;
};

// User Types
export interface UserBase {
  pk_user_id: number;
  name: string | null;
  email: string | null;
  created_at: string;
  updated_at?: string;
}

export interface UserInterface extends UserBase {
  id?: number;
  password?: string;
  userId?: number;
  timezone?: string;
}

export interface DBUserInterface extends UserBase {
  password: string | null;
}

export interface JWT_RETURN_USER {
  userId: number;
  name: string;
  email: string;
  created_at: string;
  timezone?: string;
}

// Message Types
export interface MessageBase {
  id: number;
  fk_user_id: number;
  sent_at: string;
  message_text: string | null;
}

export interface MessageType extends MessageBase {
  fk_chat_id: number;
}

export interface PrivateMessageBase extends MessageBase {
  fk_private_chat_id: number;
  image_file: Buffer | File | string | null;
  image_name: string | null;
  timezone: string;
}

// Chat Types
export interface ChatBase {
  pk_chats_id: number;
  chat_name: string | null;
  createdAt: string;
}

export interface ChatType extends ChatBase {
  chat_members?: ChatMembersType[];
  messages?: MessageType;
}

export interface ChatMembersType {
  id: number;
  fk_chat_id: number;
  fk_user_id: number;
  added_at: string;
}

export interface PrivateChatBase {
  pk_private_chat_id: number;
  user_a_id: number;
  user_b_id: number;
  created_at: string;
  unique_chat_key: string;
}

// Composite Types
export type ChatListType = {
  chat_members: ChatMembersType;
  chats: ChatType;
  messages?: MessageType;
}[];

export type CbType = (chatList: ChatListType[]) => void;

export interface PrivateMessageType {
  private_chat: PrivateChatBase | null;
  private_messages: PrivateMessageBase | null;
  chat_user: UserBase | null;
}

export interface PrivateMessageTypeWithoutImageFile {
  private_chat: PrivateChatBase | null;
  private_messages: Omit<PrivateMessageBase, 'image_file'> | null;
  chat_user: UserBase | null;
}

export interface PrivateChatResult {
  private_chat: PrivateChatBase;
  chat_user: UserBase;
  private_messages: PrivateMessageBase;
  recipient?: UserBase;
}

export interface TypedMessage {
  chats: ChatBase;
  messages: MessageBase | null;
  chat_user: UserBase | null;
}

export type AddPrivateMessageType = {
  recipientId: number;
  senderId: number;
  message: string;
  created_at: string;
  timezone: string;
  imageFile?: Buffer | File | string;
  imageName?: string;
};
