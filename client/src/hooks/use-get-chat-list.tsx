import { useCallback, useEffect, useState } from 'react';

import type { Socket } from 'socket.io-client';
import type { ChatListType } from '../types/index';
import { useLatestChannelRoomListStore } from './../store/use-latest-channel-room-list-store';
import { useSocketAuth } from './use-socket-auth';

export const useGetChatList = ({ socket }: { socket: Socket | null }) => {
  const { setLatestChannelRoomList } = useLatestChannelRoomListStore((state) => state);
  const [_error, setError] = useState<Error | null>(null);

  // Setup listener for new messages
  const handleMessageUpdate = useCallback(
    (response?: ChatListType) => {
      if (!response || response?.length === 0) return;
      setLatestChannelRoomList(response);
    },
    [setLatestChannelRoomList],
  );

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
        if (response?.length === undefined || response.length === 0) return;

        setLatestChannelRoomList(response);
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
  }, [handleMessageUpdate, socket]);
};
