import { useEffect, useRef } from 'react';
import { VList, type VListHandle } from 'virtua';

import { useAddPrivateMessageResponse } from '../../../hooks/use-add-private-message-response';
import { useSetScrollPosition } from '../../../hooks/use-set-scroll-position';
import useAuthStorage from '../../../store/use-auth-storage';
import { usePrivateMessagesStore } from '../../../store/use-private-messages-store';
import MessageCard from '../../message-card';
import { ScrollArea } from '../../ui/scroll-area';

export const PrivateMessageSection = () => {
  const virtualizerListRef = useRef<VListHandle>(null);
  const userId = useAuthStorage((state) => state.userId);

  useAddPrivateMessageResponse({
    userId: userId as string,
    vListRef: virtualizerListRef,
  });
  const { allPrivateMessagesRoomMessages } = usePrivateMessagesStore();

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    // Restore scroll position after component is mounted and virtualized list has rendered
    const savedScrollPosition = localStorage.getItem('scrollPosition');
    if (savedScrollPosition && virtualizerListRef.current) {
      // Apply scroll position after list has rendered
      setTimeout(() => {
        if (virtualizerListRef.current) {
          virtualizerListRef.current.scrollToIndex(Number(savedScrollPosition), {
            smooth: true,
            align: 'start',
          });
        }
      }, 100);
    }
  }, [allPrivateMessagesRoomMessages.length]); // Triggered after data is loaded

  const scrollAreaRef = useRef(null);
  const { scrollAreaHeight } = useSetScrollPosition({
    ref: scrollAreaRef,
    data: allPrivateMessagesRoomMessages,
  });

  const handleScroll = (offset: number) => {
    localStorage.setItem('scrollPosition', offset.toString());
  };

  return (
    <ScrollArea className='flex-1 px-4' ref={scrollAreaRef}>
      {allPrivateMessagesRoomMessages.length > 0 ? (
        <section>
          <VList
            style={{
              height: scrollAreaHeight,
              flexDirection: 'column',
              scrollBehavior: 'smooth',
            }}
            ref={virtualizerListRef}
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
