import type { Socket } from 'socket.io-client';

import { getBrowserTimeZone, getCurrentDateTimeWithTimezone } from '../lib';
import useAuthStorage from '../store/use-auth-storage';
import type { MessageInputProps } from '../types/index';
import { useAddPrivateMessageResponse } from './use-add-private-message-response';
import { useSocketAuth } from './use-socket-auth';

function convertGifToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      // Make sure the base64 string has the correct format
      const result = reader.result as string;
      if (!result.startsWith('data:image/gif;base64,')) {
        // If it doesn't have the correct prefix, add it
        resolve(`data:image/gif;base64,${result.replace(/^data:image\/gif;?base64,/, '')}`);
      } else {
        resolve(result);
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function useSendMessage({ socket }: { socket: Socket | null }) {
  const { userId } = useAuthStorage((state) => state);
  useSocketAuth({ socket });

  const { privateMessageOptimisticUIUpdate } = useAddPrivateMessageResponse({
    socket,
    userId: userId as string,
    vListRef: null,
  });

  /**
   * Sends a private message over a Socket.IO connection.
   *
   * If the provided socket is null, the function exits immediately. Otherwise, it ensures the socket is connected before emitting an "add-private-message" event with the recipient's ID, sender's ID, message text, and optional image details.
   *
   * @param data - The message payload containing the recipient's ID, message text, and optionally, an image file and its name.
   *
   * @returns The original message payload if a socket is provided; otherwise, undefined.
   */
  async function sendPrivateMessage(
    data: MessageInputProps & {
      recipientId: string;
      imageFile?: HTMLImageElement | File | string;
      imageName?: string;
      uniquePrivateChatKey?: string;
    },
    socket: Socket | null,
  ) {
    const created_at = getCurrentDateTimeWithTimezone();
    const timezone = getBrowserTimeZone();

    // If the socket is null, return early
    if (socket === null) return;
    // If the socket is not connected, connect it
    if (socket.connected === false) socket.connect();
    // Convert Image to a urlObject
    // Only perform optimistic update for the sender
    if (userId !== data.recipientId) {
      let imageFile = data?.imageFile;
      if (imageFile instanceof File) {
        imageFile = URL.createObjectURL(imageFile);
      }
      privateMessageOptimisticUIUpdate({
        private_chat: {
          pk_private_chat_id: crypto.randomUUID() as string,
          user_a_id: userId as string,
          user_b_id: data.recipientId,
          created_at: new Date(created_at),
          unique_chat_key: data.uniquePrivateChatKey as string,
        },
        private_messages: {
          id: crypto.randomUUID() as string,
          fk_private_chat_id: crypto.randomUUID() as string,
          message_text: data.message_text,
          sent_at: new Date(created_at),
          fk_user_id: userId as string,
          image_file: imageFile as string,
          image_name: data.imageName as string,
          timezone,
        },
        chat_user: {
          name: '',
          pk_user_id: userId as string,
          email: '',
          sender: userId as string,
          unique_chat_key: data.uniquePrivateChatKey as string,
        },
        recipient: {
          name: '',
          pk_user_id: data.recipientId as string,
          email: '',
          sender: userId as string,
          unique_chat_key: data.uniquePrivateChatKey as string,
        },
      });
    }

    /**
     * IF the imageFile is a gif, convert to base64
     */
    let file = data?.imageFile;

    if (file instanceof File) {
      if (file.type === 'image/gif') {
        file = await convertGifToBase64(file);
      }
    }

    socket.emit('add-private-message', {
      senderId: userId,
      imageFile: file,
      recipientId: data.recipientId,
      message: data.message_text,
      imageName: data?.imageName,
      uniquePrivateChatKey: data?.uniquePrivateChatKey,
      created_at,
      timezone,
    });

    return data;
  }
  /**
   * Sends a chat message via a Socket.IO connection.
   *
   * Emits an "add-message" event with the chat identifier, chat name, and message text contained in the input data.
   * If the socket is null, the function exits without sending a message. If the socket is not connected,
   * it establishes a connection before emitting the event.
   *
   * @param data - An object containing the chat ID, chat name, and the message text to be sent.
   */
  async function sendMessage(
    data: MessageInputProps & {
      chatId: string;
      chatName: string;
      imageFile?: HTMLImageElement | File | string;
      imageName?: string;
    },
    socket: Socket | null,
  ) {
    // If the socket is null, return early
    if (socket === null) return;
    // If the socket is not connected, connect it
    if (socket.connected === false) socket.connect();

    const sent_at = getCurrentDateTimeWithTimezone();
    const timezone = getBrowserTimeZone();

    /**
     * IF the imageFile is a gif, convert to base64
     */
    let file = data?.imageFile;

    if (file instanceof File) {
      if (file.type === 'image/gif') {
        file = await convertGifToBase64(file);
      }
    }

    socket.emit('add-message', {
      sent_at,
      timezone,
      senderId: userId,
      chatId: data.chatId,
      message: data.message_text,
      chatName: data.chatName,
      imageFile: file,
      imageName: data.imageName,
    });
  }

  return { sendMessage, sendPrivateMessage };
}
