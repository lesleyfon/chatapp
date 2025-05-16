import { useCallback, useEffect } from 'react';
import type { Socket } from 'socket.io-client';
import { create } from 'zustand';
import useAuthStorage from '../store/use-auth-storage';
import type { PrivateChatResultType } from '../types/index';

/**
 * @description This store is used to store the latest private message list for a user.
 */
export const usePrivateMessageListStore = create<{
  privateRoomList: PrivateChatResultType[];
  setPrivateRoomList: (privateRoomList: PrivateChatResultType[]) => void;
}>((set) => ({
  privateRoomList: [],
  setPrivateRoomList: (privateRoomList) => set({ privateRoomList }),
}));

/**
 * Checks if two chats are the same
 * @param chat1 - The first chat
 * @param chat2 - The second chat
 * @returns true if the chats are the same, false otherwise
 */
const uniquePrivateChatKeyMatch = (
  chat1: { unique_chat_key: string },
  chat2: { unique_chat_key: string },
) => {
  return chat1.unique_chat_key === chat2.unique_chat_key;
};

/**
 * @description This hook is used to get the latest private message list for a user.
 * @param socket - The socket
 * @returns The private message list
 */
export const useGetPrivateMessageList = ({ socket }: { socket: Socket | null }) => {
  const { privateRoomList, setPrivateRoomList } = usePrivateMessageListStore();
  const { userId } = useAuthStorage((state) => state);

  /**
   * @description This function is used to update the private message list when a new message is sent.
   * @param {PrivateChatResultType} response - The new private message list response from the server
   */
  const handleMessageUpdate = useCallback(
    (response: PrivateChatResultType) => {
      // If the user is not logged in, return early
      if (!userId) return;

      const { user_a_id, user_b_id } = response.private_chat;
      const userIsParticipant = [user_a_id, user_b_id].some(
        (id) => Number.parseInt(id, 10) === Number.parseInt(userId, 10),
      );
      // If the user is not a participant, return early
      if (!userIsParticipant) return;

      // Check if the new response is part of a message sent by an already existing chat.
      const privateChatExists = privateRoomList.some((chat) =>
        uniquePrivateChatKeyMatch(chat.private_chat, response.private_chat),
      );

      // If the user does not exist, update the chat list with the new message
      if (!privateChatExists) {
        setPrivateRoomList([response, ...privateRoomList]);
        return;
      }

      // Filter out the chat that has the same sender and recipient from the list. This is the response that we want to update.
      const updatedList = privateRoomList.filter(
        (chat) => !uniquePrivateChatKeyMatch(chat.private_chat, response.private_chat),
      );
      // Update the chat list with the new message
      setPrivateRoomList([response, ...updatedList]);
    },
    [userId, privateRoomList, setPrivateRoomList],
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: privateRoomList and setPrivateRoomList are intentionally omitted to prevent unnecessary re-renders
  useEffect(() => {
    if (socket === null) return;

    if (socket.connected === false) socket.connect();

    socket.emit('get-private-message-list', (response: PrivateChatResultType[]) => {
      setPrivateRoomList(response);
    });

    // Setup listener for new messages
    socket.on('get-latest-private-message-sent', handleMessageUpdate);

    // Cleanup function to avoid memory leaks
    return () => {
      socket.off('get-latest-private-message-sent', handleMessageUpdate);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, userId]);

  return {
    privateRoomList,
    handleMessageUpdate,
  };
};
