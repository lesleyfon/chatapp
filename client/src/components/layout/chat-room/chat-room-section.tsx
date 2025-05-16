import { useEffect, useRef } from 'react';

import { useParams } from 'react-router';
import { useSocket } from '../../../hooks/use-socket';
import { cn, formatDate, scrollToBottom } from '../../../lib';
import useAuthStorage from '../../../store/use-auth-storage';
import { useChannelRoomMessages } from '../../../store/use-channel-room-messages-store';
import type { RoomMessagesResponse } from '../../../types';
import ImageCard from '../../image-card';
import { Card, CardContent } from '../../ui/card';
import { ScrollArea } from '../../ui/scroll-area';

//TODO: Consolidate this component with the PrivateMessageSection ConversationCard component
function MessageCard({ msgData }: { msgData: RoomMessagesResponse }) {
  const {
    messages: { id, message_text, sent_at, timezone, image_url, image_name },
    chat_user: { sender, name },
  } = msgData;

  const isSender = sender === 'You';
  const hasImage = image_url && image_name;
  const hasText = message_text && message_text.length > 0;

  return (
    <>
      {hasImage ? (
        <ImageCard imageUrl={image_url} imageName={image_name} isSender={isSender} />
      ) : null}
      {hasText ? (
        <div
          key={id}
          className={cn(
            'flex py-4 ',
            isSender ? 'justify-end' : 'justify-start',
            hasImage ? 'pt-0' : 'pt-4',
          )}
        >
          <Card className={cn('max-w-[70%]', isSender ? 'bg-slate-300 text-black' : '')}>
            <CardContent className='p-3'>
              <div
                className={cn(
                  'text-sm font-semibold mb-1',
                  isSender ? 'text-primary-foreground' : 'text-secondary-foreground',
                )}
              >
                {name}
              </div>
              <p>{message_text}</p>
              <div className='text-[10px] text-muted-foreground mt-1'>
                {formatDate(sent_at, timezone)}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </>
  );
}

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
            // If the message text is empty, return null
            if (!msgData?.messages?.message_text) return null;

            return <MessageCard key={msgData?.messages?.id} msgData={msgData} />;
          })}
        </section>
      ) : null}
    </ScrollArea>
  );
};
