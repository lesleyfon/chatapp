import { useEffect, useRef } from 'react';
import { useAddChatRoomResponse } from '../../../hooks/use-add-chat-room-response';
import { scrollToBottom } from '../../../lib';
import { useChannelRoomMessages } from '../../../store/use-channel-room-messages-store';
import type { RoomMessagesResponse } from '../../../types';
import MessageCard from '../../message-card';
import { ScrollArea } from '../../ui/scroll-area';

export const ChatRoomSection = () => {
  const { currentChannelRoomMessages } = useChannelRoomMessages();
  const messageSectionContainerRef = useRef(null);

  useEffect(() => {
    if (currentChannelRoomMessages.length > 0) {
      scrollToBottom(messageSectionContainerRef);
    }
  }, [currentChannelRoomMessages.length]);

  useAddChatRoomResponse();

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
