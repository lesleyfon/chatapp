import { useEffect, useRef, useState } from 'react';
import { VList, type VListHandle } from 'virtua';

import { useAddPrivateMessageResponse } from '../../../hooks/use-add-private-message-response';
import { useSocket } from '../../../hooks/use-socket';
import useAuthStorage from '../../../store/use-auth-storage';
import { usePrivateMessagesStore } from '../../../store/use-private-messages-store';
import type { PrivateChatResultType } from '../../../types';
import MessageCard from '../../message-card';
import { ScrollArea } from '../../ui/scroll-area';

export const PrivateMessageSection = ({ data }: { data: PrivateChatResultType[] }) => {
  const vListRef = useRef<VListHandle>(null);
  const userId = useAuthStorage((state) => state.userId);
  const socket = useSocket();

  useAddPrivateMessageResponse({
    socket,
    userId: userId as string,
    vListRef: vListRef,
  });
  const { allPrivateMessagesRoomMessages, setAllPrivateMessagesRoomMessages } =
    usePrivateMessagesStore();

  useEffect(() => {
    if (data?.length === undefined || data?.length === 0) return;
    setAllPrivateMessagesRoomMessages(data);
  }, [data, setAllPrivateMessagesRoomMessages]);

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
  }, [allPrivateMessagesRoomMessages.length]); // Triggered after data is loaded

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
      {allPrivateMessagesRoomMessages.length > 0 ? (
        <section>
          <VList
            style={{ height: scrollAreaHeight, flexDirection: 'column' }}
            ref={vListRef}
            count={allPrivateMessagesRoomMessages.length}
            onScroll={handleScroll}
            shift={true}
          >
            {allPrivateMessagesRoomMessages.map((data) => {
              const isSender = String(data?.chat_user?.pk_user_id ?? '') === String(userId);
              const { timezone, sent_at, message_text, id, image_name, image_url } =
                data.private_messages;
              const user_name = isSender ? 'You' : data?.chat_user.name;

              return (
                <MessageCard
                  key={data.private_messages.id}
                  isSender={isSender}
                  timezone={timezone}
                  sent_at={sent_at}
                  message_text={message_text}
                  user_name={user_name}
                  message_id={Number.parseInt(id, 10)}
                  image_name={image_name}
                  image_url={image_url}
                />
              );
            })}
          </VList>
        </section>
      ) : null}
    </ScrollArea>
  );
};
