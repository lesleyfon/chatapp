import { useEffect } from 'react';
import { useParams } from 'react-router';

import useAuthStorage from '../store/use-auth-storage';
import { useChannelRoomMessages } from '../store/use-channel-room-messages-store';
import type { RoomMessagesResponse } from '../types';
import { useSocket } from './use-socket';

/**
 * @description This hook is used to add a chat room response to the current channel room messages.
 * @returns {void}
 */
export function useAddChatRoomResponse() {
  const { currentChannelRoomMessages, setCurrentChannelRoomMessages } = useChannelRoomMessages();
  const userId = useAuthStorage((state) => state.userId);
  const { chatId: chatroomId } = useParams();
  const socket = useSocket();

  useEffect(() => {
    // If the socket is null, return early
    if (socket === null) return;
    // If the socket is not connected, connect it
    if (socket.connected === false) socket.connect();

    const handler = (response: RoomMessagesResponse[]) => {
      //If the current channel page id is not the same as the response chats id, return early
      if (chatroomId?.toString() !== response?.[0]?.chats?.pk_chats_id?.toString()) {
        return;
      }

      response = response.map((responseData) => {
        if (String(responseData?.chat_user?.pk_user_id) === String(userId)) {
          responseData.chat_user.sender = 'You';
        }
        return responseData;
      });
      setCurrentChannelRoomMessages([...currentChannelRoomMessages, ...response]);
    };

    socket.on('add-message-response', handler);

    return () => {
      socket?.off('add-message-response', handler);
    };
  }, [chatroomId, socket, userId, currentChannelRoomMessages, setCurrentChannelRoomMessages]);
}
