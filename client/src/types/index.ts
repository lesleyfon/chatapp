import { type LucideIcon } from "lucide-react";

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

export type ChatListType = {
	chat_members: {
		id: string | null;
		fk_chat_id: string;
		fk_user_id: string;
		added_at: Date;
	};
	chats: {
		pk_chats_id: string;
		chat_name: string | null;
		createdAt: Date;
	} | null;
	messages: MessageType;
}[];



export type RoomMessagesResponse = {
	chats: {
		pk_chats_id: string;
		chat_name: string | null;
		createdAt: Date;
	};
	messages: {
		id: number;
		fk_chat_id: string;
		message_text: string | null;
		sent_at: Date;
	};
	chat_user: {
		name: string | null;
		pk_user_id: string;
		email: string | null;
		sender?: string;
	};
};


export type MessageInput = {
	message_text: string;
};