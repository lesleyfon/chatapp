import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router';
import { VList, type VListHandle } from 'virtua';

import { useAddPrivateMessageResponse } from '../../../hooks/use-add-private-message-response';
import { useSocket } from '../../../hooks/use-socket';
import { cn, formatDate } from '../../../lib';
import useAuthStorage from '../../../store/use-auth-storage';
import { usePrivateMessagesStore } from '../../../store/use-private-messages-store';
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
  let src = '';

  // If the imageUrl starts with blob:, it is a blob URL and should be used as is
  if (imageUrl.startsWith('blob:')) {
    src = imageUrl;
  } else if (imageUrl.startsWith('https://')) {
    src = imageUrl;
  } else {
    // Fall back for images uploaded before migration
    src = `data:image/${imageType};base64,${imageUrl}`;
  }

  return (
    <div className={cn('flex justify-end', isSender ? 'justify-end' : 'justify-start')}>
      <div className='bg-white rounded-lg shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl dark:bg-gray-950 w-[400px] h-[250px]'>
        <img
          src={src}
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
  const { image_file, image_name, message_text, sent_at, timezone, image_url } =
    data.private_messages;
  return (
    <>
      {image_file || image_url ? (
        <ImageCard
          // Default to using the image_url if it exists, otherwise use the image_file
          imageUrl={image_url ?? (image_file as string)}
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
  const vListRef = useRef<VListHandle>(null);
  const userId = useAuthStorage((state) => state.userId);
  const socket = useSocket();
  const { recipientId } = useParams();

  useAddPrivateMessageResponse({
    socket,
    userId: userId as string,
    vListRef: vListRef,
    recipientId: recipientId as string,
  });
  const { allRoomMessages, setAllRoomMessages } = usePrivateMessagesStore();

  useEffect(() => {
    if (data?.length === undefined || data?.length === 0) return;
    setAllRoomMessages(data);
  }, [data, setAllRoomMessages]);

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
