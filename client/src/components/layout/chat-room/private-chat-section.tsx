import { set } from 'lodash';
import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router';
import { VList, type VListHandle } from 'virtua';

import { useSocket } from '../../../hooks/use-socket';
import { cn, formatDate } from '../../../lib';
import useAuthStorage from '../../../store/use-auth-storage';
import type { PrivateChatResultType } from '../../../types';
import { Card, CardContent } from '../../ui/card';
import { ScrollArea } from '../../ui/scroll-area';

export default function ImageCard({
  imageUrl,
  imageName,
  isSender,
}: {
  imageUrl: string;
  imageName: string;
  isSender: boolean;
}) {
  const imageType = imageName.split('.')[1];
  return (
    <div className={cn('flex justify-end', isSender ? 'justify-end' : 'justify-start')}>
      <div className='bg-white rounded-lg shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl dark:bg-gray-950 w-[400px] h-[250px]'>
        <img
          src={`data:image/${imageType};base64,${imageUrl}`}
          alt={imageName}
          width={400}
          height={250}
          className='object-contain'
          style={{ aspectRatio: '400/250', objectFit: 'contain' }}
        />
      </div>
    </div>
  );
}

function ConversationCard({ data, isSender }: { data: PrivateChatResultType; isSender: boolean }) {
  const { image_file, image_name, message_text, sent_at, timezone } = data.private_messages;
  return (
    <>
      {image_file ? (
        <ImageCard
          imageUrl={image_file as string}
          imageName={image_name as string}
          isSender={isSender}
        />
      ) : null}
      <div
        className={cn(
          'flex py-4',
          isSender ? 'justify-end' : 'justify-start',
          image_file ? 'py-0' : 'py-4',
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
              {isSender ? 'You' : data?.chat_user.name}
            </div>
            <p>{message_text as string}</p>
            <div className='text-[10px] text-muted-foreground mt-1'>
              {formatDate(sent_at, timezone)}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

export const PrivateMessageSection = ({ data }: { data: PrivateChatResultType[] }) => {
  const [allRoomMessages, setAllRoomMessages] = useState<PrivateChatResultType[]>([]);

  const vListRef = useRef<VListHandle>(null);
  const userId = useAuthStorage((state) => state.userId);
  const { recipientId } = useParams();

  useEffect(() => {
    if (data?.length === undefined || data?.length === 0) {
      return setAllRoomMessages([]);
    }
    setAllRoomMessages(data);
  }, [data]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    // Restore scroll position after component is mounted and virtualized list has rendered
    const savedScrollPosition = localStorage.getItem('scrollPosition');
    if (savedScrollPosition && vListRef.current) {
      // Apply scroll position after list has rendered
      setTimeout(() => {
        if (vListRef.current) {
          vListRef.current.scrollToIndex(Number(savedScrollPosition), {
            smooth: true,
            align: 'start',
          });
        }
      }, 100);
    }
  }, [allRoomMessages.length]); // Triggered after data is loaded

  const socket = useSocket();

  useEffect(() => {
    if (socket?.connected === false) socket?.connect();
    if (!userId) return; // Maybe logout?

    socket?.on('add-private-message-response', (response: PrivateChatResultType) => {
      const { sender_id: responseSenderId, recipient_id: responseRecipientId } =
        response.private_chat;

      const chatUser = new Set([responseSenderId, responseRecipientId]);

      // IF users are not the same, return early
      if (!chatUser.has(userId)) {
        return;
      }
      // Prevent messages from showing in other users chats
      const chatToUpdate =
        (responseSenderId.toString() === userId.toString() &&
          responseRecipientId.toString() === recipientId?.toString()) ||
        (responseSenderId.toString() === recipientId?.toString() &&
          responseRecipientId.toString() === userId.toString());

      if (chatToUpdate === false) return;

      setAllRoomMessages((previousRoomMessages) => {
        const responseCopy = { ...response };
        if (String(response.chat_user.pk_user_id) === String(userId)) {
          set(responseCopy, 'chat_user.name', 'You');
        }
        return [...previousRoomMessages, responseCopy];
      });

      if (vListRef.current) {
        // Scroll to bottom after new message is added
        vListRef.current.scrollToIndex(allRoomMessages.length, {
          smooth: true,
          align: 'start',
        });
      }
    });
    return () => {
      socket?.off('add-private-message-response');
    };
  }, [socket, userId, allRoomMessages, recipientId]);

  const scrollAreaRef = useRef(null);
  const [scrollAreaHeight, setScrollAreaHeight] = useState(0);

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    const setScrollArea = () => {
      if (scrollAreaRef.current) {
        const scrollArea = scrollAreaRef.current as HTMLElement;
        setScrollAreaHeight(scrollArea.clientHeight);
      }
    };

    if (scrollAreaRef.current) {
      setScrollArea();
    }
    if (typeof window === 'undefined' || !scrollAreaRef?.current) {
      setScrollAreaHeight(800);
    }

    const controller = new AbortController();
    const signal = controller.signal;

    window.addEventListener('resize', setScrollArea, { signal });

    return () => {
      controller.abort();
    };
  }, [scrollAreaRef]);

  const handleScroll = (offset: number) => {
    localStorage.setItem('scrollPosition', offset.toString());
  };

  return (
    <ScrollArea className='flex-1 px-4' ref={scrollAreaRef}>
      {allRoomMessages.length > 0 ? (
        <section>
          <VList
            style={{ height: scrollAreaHeight, flexDirection: 'column' }}
            ref={vListRef}
            count={allRoomMessages.length}
            onScroll={handleScroll}
            shift={true}
          >
            {allRoomMessages.map((data) => {
              const isSender = data?.chat_user?.pk_user_id.toString() === String(userId);
              return (
                <ConversationCard key={data?.private_messages.id} data={data} isSender={isSender} />
              );
            })}
          </VList>
        </section>
      ) : null}
    </ScrollArea>
  );
};
