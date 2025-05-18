import type { LucideIcon } from 'lucide-react';
import type { DropzoneInputProps, DropzoneRootProps } from 'react-dropzone';
import type { ControllerRenderProps, FieldErrors } from 'react-hook-form';
import type { z } from 'zod';

import type {
  LoginFormSchemaValidation,
  RegisterFormSchemaValidation,
} from '../pages/authentication/validation';

export type ChatUserType = {
  name: string;
  pk_user_id: string;
  email: string | null;
  sender?: string;
  unique_chat_key: string | null;
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
  user_a_id: string;
  user_b_id: string;
  created_at: Date; // Assuming it's a timestamp
  unique_chat_key: string;
  isNewPrivateChat?: boolean;
};

export type PrivateMessageType = {
  id: string; // Assuming UUID or similar
  fk_private_chat_id: string;
  fk_user_id: string;
  message_text: string;
  sent_at: string; // Assuming it's a timestamp
  image_file?: string;
  image_url?: string;
  image_name?: string;
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
  sent_at: string;
  timezone: string;
  image_file?: string;
  image_url?: string;
  image_name?: string;
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
  uniquePrivateChatKey?: string;
  recipientId?: string;
}

export type ErrorMessagesProps = { errors: FieldErrors<MessageInputProps> };
export type FileInputElementProps = ErrorMessagesProps & {
  svgUrl: string;
  isDragActive: boolean;
  errors: FieldErrors<MessageInputProps>;
  getRootProps: <T extends DropzoneRootProps>(props?: T) => T;
  getInputProps: <T extends DropzoneInputProps>(props?: T) => T;
};

export type FormSchema = z.infer<
  typeof RegisterFormSchemaValidation | typeof LoginFormSchemaValidation
>;
export type NameType =
  | keyof z.infer<typeof RegisterFormSchemaValidation>
  | keyof z.infer<typeof LoginFormSchemaValidation>;
export type Field = ControllerRenderProps<FormSchema>;

export interface SharedAuthInputProps {
  field: Field;
  fd: {
    name: NameType;
    label: string;
    type: string;
    autoComplete: string;
  };
}
