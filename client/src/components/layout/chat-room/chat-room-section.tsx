import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router';

import { useSocket } from '../../../hooks/use-socket';
import { cn, formatDate, scrollToBottom } from '../../../lib';
import useAuthStorage from '../../../store/use-auth-storage';
import type { RoomMessagesResponse } from '../../../types';
import { Card, CardContent } from '../../ui/card';
import { ScrollArea } from '../../ui/scroll-area';

function MessageCard({ msgData }: { msgData: RoomMessagesResponse }) {
  if (!msgData?.messages?.message_text) return null;
  const {
    messages: { id, message_text, sent_at, timezone },
    chat_user: { sender, name },
  } = msgData;

  const isSender = sender === 'You';

  return (
    <div key={id} className={cn('flex py-4 ', isSender ? 'justify-end' : 'justify-start')}>
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
  );
}

export const ChatRoomSection = ({ data }: { data: [] }) => {
  const [allRoomMessages, setAllRoomMessages] = useState<RoomMessagesResponse[]>(data);
  const userId = useAuthStorage((state) => state.userId);
  const messageSectionContainerRef = useRef(null);
  const location = useLocation();
  const chatroomId = location.pathname.split('/').at(-1);

  useEffect(() => {
    scrollToBottom(messageSectionContainerRef);
  }, []);

  const socket = useSocket();

  useEffect(() => {
    // If the socket is null, return early
    if (socket === null) return;
    // If the socket is not connected, connect it
    if (socket.connected === false) socket.connect();

    socket.on('add-message-response', (response: RoomMessagesResponse[]) => {
      //TODO: WHY AM I DOING THIS? WHAT HAPPENS IF YOU ONLY setAllRoomMessages IF THE CHATROOM_ID MATCHES?
      if (chatroomId?.toString() !== response?.[0]?.chats?.pk_chats_id?.toString()) {
        return;
      }

      setAllRoomMessages((previousRoomMessages) => {
        response = response.map((responseData) => {
          if (responseData?.chat_user?.pk_user_id.toString() === String(userId)) {
            responseData.chat_user.sender = 'You';
          }
          return responseData;
        });
        return [...previousRoomMessages, ...response];
      });
    });

    return () => {
      socket?.off('add-message-response');
    };
  }, [chatroomId, socket, userId]);

  return (
    <ScrollArea className='flex-1 px-4'>
      {allRoomMessages.length > 0 ? (
        <section ref={messageSectionContainerRef}>
          {allRoomMessages.map((msgData: RoomMessagesResponse) => {
            // If the message text is empty, return null
            if (!msgData?.messages?.message_text) return null;

            return <MessageCard key={msgData?.messages?.id} msgData={msgData} />;
          })}
        </section>
      ) : null}
    </ScrollArea>
  );
};
