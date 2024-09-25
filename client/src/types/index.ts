import { type LucideIcon } from "lucide-react";

export type ChatUserType = {
	name: string | null;
	pk_user_id: string;
	email: string | null;
	sender?: string;
};

export type ChatRoomType = {
	pk_chats_id: string;
	chat_name: string | null;
	createdAt: Date;
};

export type PrivateChatType = {
  pk_private_chat_id: string; // Assuming UUID or similar
  sender_id: string;
  recipient_id: string;
  created_at: Date; // Assuming it's a timestamp
};

export type PrivateMessageType = {
  id: string; // Assuming UUID or similar
  fk_private_chat_id: string;
  fk_user_id: string;
  message_text: string;
  sent_at: Date; // Assuming it's a timestamp
};

export interface NavItem {
	title: string;
	href: string;
	icon: LucideIcon;
	color?: string;
	isChidren?: boolean;
	children?: NavItem[];
}

export interface SideNavProps {
	items: NavItem[];
	setOpen?: (open: boolean) => void;
	className?: string;
}

export interface SidebarProps {
	className?: string;
}

export type MessageType = {
	id: number;
	fk_chat_id: string;
	fk_user_id: string;
	message_text: string | null;
	sent_at: Date;
};

export type ChatMember = {
	id: string | null;
	fk_chat_id: string;
	fk_user_id: string;
	added_at: Date;
}

export type ChatListType = {
	chat_members: ChatMember;
	chats: ChatRoomType | null;
	messages: MessageType;
	chat_user: ChatUserType;
}[];


export type RoomMessagesResponse = {
	chats: ChatRoomType;
	messages: MessageType
	chat_user: ChatUserType
};

export type PrivateChatResultType = {
  private_chat: PrivateChatType;
  chat_user: ChatUserType;
  private_messages: PrivateMessageType;
  recipient: ChatUserType; 
};

export type MessageInput = {
	message_text: string;
};