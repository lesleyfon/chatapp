import { useCallback, useEffect } from 'react';
import { useParams } from 'react-router';
import type { Socket } from 'socket.io-client';
import { create } from 'zustand';
import useAuthStorage from '../store/use-auth-storage';
import type { PrivateChatResultType } from '../types/index';

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
const doChatsMatch = (chat1: { unique_chat_key: string }, chat2: { unique_chat_key: string }) => {
  return chat1.unique_chat_key === chat2.unique_chat_key;
};

function updateChatList({
  state,
  response,
}: { state: PrivateChatResultType; response: PrivateChatResultType }) {
  const chatToUpdate = doChatsMatch(state.private_chat, response.private_chat);

  if (chatToUpdate) {
    return {
      ...state, // Create a new object
      private_messages: {
        ...state.private_messages, // Preserve existing messages
        message_text: response.private_messages.message_text, // Update the message
        sent_at: response.private_messages.sent_at, // Update the sent_at
      },
    };
  }

  return { ...state }; // Return unchanged data if not the same chat
}

export const useGetPrivateMessageList = ({ socket }: { socket: Socket | null }) => {
  const { privateRoomList, setPrivateRoomList } = usePrivateMessageListStore();
  const { uniquePrivateChatKey } = useParams();
  const { userId } = useAuthStorage((state) => state);

  const handleMessageUpdate = useCallback(
    (response: PrivateChatResultType) => {
      if (!userId) return;

      const { unique_chat_key } = response.private_chat;
      // Check if the user is a participant in the chat If not, return early
      if (uniquePrivateChatKey !== unique_chat_key) return;

      // Check if the new response is part of a message sent by an already existing chat.
      const userExist = privateRoomList.some((chat) =>
        doChatsMatch(chat.private_chat, response.private_chat),
      );

      // If the user does not exist, update the chat list with the new message
      if (!userExist) {
        const updatedList = [updateChatList({ response, state: response }), ...privateRoomList];
        setPrivateRoomList(updatedList);
        return;
      }

      // Filter out the chat that has the same sender and recipient from the list. This is the response that we want to update.
      const updatedList = privateRoomList.filter(
        (chat) => !doChatsMatch(chat.private_chat, response.private_chat),
      );
      const itemToUpdate = updateChatList({ response, state: response });
      const newState = [itemToUpdate, ...updatedList];
      setPrivateRoomList(newState);
    },
    [userId, uniquePrivateChatKey, privateRoomList, setPrivateRoomList],
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
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
