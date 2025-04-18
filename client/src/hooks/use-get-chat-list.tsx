import { useCallback, useEffect, useMemo, useState } from 'react';

import { useNavigate } from 'react-router-dom';
import type { Socket } from 'socket.io-client';
import type { ChatListType } from '../types/index';
import { useSocketAuth } from './use-socket-auth';

export const useGetChatList = ({ socket }: { socket: Socket | null }) => {
  const [chatroomList, setChatList] = useState<ChatListType>([]);
  const [error, setError] = useState<Error | null>(null);
  const navigate = useNavigate();

  // Setup listener for new messages
  const handleMessageUpdate = useCallback((response?: ChatListType) => {
    if (!response || response?.length === 0) return;

    setChatList((prevChatList) => {
      const updatedChatList = prevChatList.map((chat) =>
        chat.chats?.pk_chats_id === response[0].chats?.pk_chats_id ? response[0] : chat,
      );
      return updatedChatList;
    });
  }, []);

  useSocketAuth({ socket });

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    // If the socket is null, return early
    if (socket === null) {
      setError(new Error('Socket connection failed'));
      return;
    }
    // If the socket is not connected, connect it
    if (socket.connected === false) socket.connect();

    try {
      // Fetch initial chat list
      // This socket is mean to fire only on initial render, to get the list of chatRooms for a user.
      // THOUGHT: Would it make sense to have this be an api?

      socket.emit('get-chat-list', (response?: ChatListType) => {
        if (response?.length === undefined || response.length === 0) {
          setChatList([]);
          return;
        }
        setChatList(response);
      });

      socket.on('get-latest-chat-room-message', handleMessageUpdate);
      // Clear the error state
      setError(null);
    } catch (error) {
      setError(error instanceof Error ? error : new Error('Unknown error occurred'));
    }

    // Cleanup function to avoid memory leaks
    return () => {
      socket.off('get-latest-chat-room-message', handleMessageUpdate);
    };
  }, [handleMessageUpdate, navigate, socket]); // Added 'navigate' to the dependency array to ensure effect runs only when it changes

  // Sort the chatroom list by the last message sent
  const sortedChatroomList = useMemo(() => {
    return [...chatroomList].sort((a, b) => {
      const aLastMessage = a.messages?.sent_at;
      const bLastMessage = b.messages?.sent_at;
      return aLastMessage > bLastMessage ? -1 : 1;
    });
  }, [chatroomList]);

  return { chatroomList: sortedChatroomList, error };
};
