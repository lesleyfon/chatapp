import type { LucideIcon } from 'lucide-react';
import type { DropzoneInputProps, DropzoneRootProps } from 'react-dropzone';
import type { FieldErrors } from 'react-hook-form';

export type ChatUserType = {
  name: string | null;
  pk_user_id: string;
  email: string | null;
  sender?: string;
};

interface ChatMessage {
  message_text: string;
  sent_at: Date;
}
export interface SidebarItemLinkProps {
  to: string;
  linkTitle: string;
  message: ChatMessage;
  itemType: 'User' | 'Users';
}
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
  image_file: string;
  image_name: string;
  timezone: string;
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
  timezone: string;
};

export type ChatMember = {
  id: string | null;
  fk_chat_id: string;
  fk_user_id: string;
  added_at: Date;
};

export type ChatListType = {
  chat_members: ChatMember;
  chats: ChatRoomType | null;
  messages: MessageType;
  chat_user: ChatUserType;
}[];

export type RoomMessagesResponse = {
  chats: ChatRoomType;
  messages: MessageType;
  chat_user: ChatUserType;
};

export type ChatResponse = {
  chats?: ChatRoomType[];
  message?: string;
  error?: boolean;
  userId?: number;
};

export type PrivateChatResultType = {
  private_chat: PrivateChatType;
  chat_user: ChatUserType;
  private_messages: PrivateMessageType;
  recipient: ChatUserType;
};

export type MessageInputProps = {
  message_text: string;
  message_img?: string;
  sent_at?: string;
};

export interface SearchPrivateRoomProps {
  triggerChild?: React.ReactNode;
}

export interface CustomDialogTriggerProps {
  triggerChild?: React.ReactNode;
  openDialog: () => void;
}

export interface ChatInputProps {
  chatId: string;
  chatName: string;
  isPrivateChat?: boolean;
}

export type ErrorMessagesProps = { errors: FieldErrors<MessageInputProps> };
export type FileInputElementProps = ErrorMessagesProps & {
  svgUrl: string;
  isDragActive: boolean;
  errors: FieldErrors<MessageInputProps>;
  getRootProps: <T extends DropzoneRootProps>(props?: T) => T;
  getInputProps: <T extends DropzoneInputProps>(props?: T) => T;
};
