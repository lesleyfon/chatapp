import { Request} from "express";


export type RequestWithUser = Request & {
	user: Omit<UserInterface, "created_at">;
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
}

export type SQLErrorType = {
	error: boolean;
	reason: string;
}

// User Types
export interface UserBase {
	pk_user_id: number;
	name: string | null;
	email: string | null;
	created_at: Date;
	updated_at?: Date;
}

export interface UserInterface extends UserBase {
	id?: number;
	password?: string;
	userId?: number;
}

export interface DBUserInterface extends UserBase {
	password: string | null;
}

export interface JWT_RETURN_USER {
	userId: number;
	name: string;
	email: string;
}

// Message Types
export interface MessageBase {
	id: number;
	fk_user_id: number;
	sent_at: Date;
	message_text: string | null;
}

export interface MessageType extends MessageBase {
	fk_chat_id: number;
}

export interface PrivateMessageBase extends MessageBase {
	fk_private_chat_id: number;
	image_file: Buffer | string | null;
	image_name: string | null;
}

// Chat Types
export interface ChatBase {
	pk_chats_id: number;
	chat_name: string | null;
	createdAt: Date;
}

export interface ChatType extends ChatBase {
	chat_members?: ChatMembersType[];
	messages?: MessageType;
}

export interface ChatMembersType {
	id: number;
	fk_chat_id: number;
	fk_user_id: number;
	added_at: Date;
}

export interface PrivateChatBase {
	pk_private_chat_id: number;
	sender_id: number;
	recipient_id: number;
	created_at: Date;
}

// Composite Types
export type ChatListType = {
	chat_members: ChatMembersType;
	chats: ChatType;
	messages?: MessageType;
}[]

export type CbType = (chatList: ChatListType[]) => void;

export interface PrivateMessageType {
	private_chat: PrivateChatBase | null;
	private_messages: PrivateMessageBase | null;
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