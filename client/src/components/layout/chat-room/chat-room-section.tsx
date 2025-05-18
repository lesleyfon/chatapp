import { useEffect, useRef } from 'react';

import { useParams } from 'react-router';
import { useSocket } from '../../../hooks/use-socket';
import { scrollToBottom } from '../../../lib';
import useAuthStorage from '../../../store/use-auth-storage';
import { useChannelRoomMessages } from '../../../store/use-channel-room-messages-store';
import type { RoomMessagesResponse } from '../../../types';
import MessageCard from '../../message-card';
import { ScrollArea } from '../../ui/scroll-area';

export const ChatRoomSection = () => {
  const { currentChannelRoomMessages, setCurrentChannelRoomMessages } = useChannelRoomMessages();
  const userId = useAuthStorage((state) => state.userId);
  const messageSectionContainerRef = useRef(null);
  const { chatId: chatroomId } = useParams();

  useEffect(() => {
    if (currentChannelRoomMessages.length > 0) {
      scrollToBottom(messageSectionContainerRef);
    }
  }, [currentChannelRoomMessages.length]);

  const socket = useSocket();
  // TODO: move this into a hook.
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

  return (
    <ScrollArea className='flex-1 px-4'>
      {currentChannelRoomMessages.length > 0 ? (
        <section ref={messageSectionContainerRef}>
          {currentChannelRoomMessages.map((msgData: RoomMessagesResponse) => {
            const isSender = msgData.chat_user.sender === 'You';
            const { timezone, sent_at, message_text, id, image_name, image_url } = msgData.messages;
            const user_name = msgData.chat_user.sender as string;
            return (
              <MessageCard
                key={id}
                isSender={isSender}
                timezone={timezone}
                sent_at={sent_at}
                message_text={message_text}
                user_name={user_name}
                message_id={id}
                image_name={image_name}
                image_url={image_url}
              />
            );
          })}
        </section>
      ) : null}
    </ScrollArea>
  );
};
