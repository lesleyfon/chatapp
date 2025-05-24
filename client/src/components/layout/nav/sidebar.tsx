import React, { memo } from 'react';
import { Link, useLocation } from 'react-router-dom';

import { SocketProvider } from '../../../context/socket.context';
import { useGetChatList } from '../../../hooks/use-get-chat-list';
import {
  useGetPrivateMessageList,
  usePrivateMessageListStore,
} from '../../../hooks/use-get-private-message-list';
import { useMobileSidebar } from '../../../hooks/use-mobile-sidebar';
import { useSocket } from '../../../hooks/use-socket';
import { cn, timeDifference } from '../../../lib';
import useAuthStorage from '../../../store/use-auth-storage';
import type { ChatListType, SidebarItemLinkProps, SidebarProps } from '../../../types';
import { SIDEBAR_CONSTANTS } from '../../constants';
import { JoinRoom } from '../../join-room';
import { SearchPrivateRoom } from '../../join-room/search-private-room';
import { Avatar } from '../../ui/avatar';
import { Button } from '../../ui/button';
import { ScrollArea } from '../../ui/scroll-area';
import { Sidebar, SidebarContent, SidebarHeader } from '../../ui/sidebar';

export const SidebarItemLink = React.memo(({ data }: { data: SidebarItemLinkProps }) => {
  const location = useLocation();
  const currentPath = location.pathname;
  const isActivePathLinkItem = currentPath === data.to;
  const Icon = SIDEBAR_CONSTANTS.ICON_MAP[data.itemType];
  const sentAt = timeDifference(data?.message?.sent_at?.toString());
  return (
    <Link
      to={data.to}
      className={cn(
        'flex items-center gap-3 p-2 text-sm font-medium transition-colors hover:bg-muted from-neutral-200',
        SIDEBAR_CONSTANTS.HOVER_BG_COLOR,
        isActivePathLinkItem ? 'bg-slate-200 hover:!bg-slate-200 text-black' : '',
      )}
    >
      <Avatar className='flex items-center content-center justify-center w-8 h-8 border'>
        <Icon />
      </Avatar>
      <div className='flex-1 truncate'>
        <div
          className={cn(
            `from-neutral-100 font-bold text-xs truncate`,
            SIDEBAR_CONSTANTS.MESSAGE_TEXT_MAX_WIDTH,
          )}
        >
          {data.linkTitle}
        </div>
        {data.message ? (
          <div className='md:flex grid grid-cols-[10fr_2fr] gap-2 justify-between items-center'>
            <p
              className={cn(
                `truncate w-full text-xs text-ellipsis overflow-hidden md:block text-left`,
                SIDEBAR_CONSTANTS.MESSAGE_TEXT_MAX_WIDTH,
              )}
            >
              {data.message.message_text}
            </p>
            <p className='text-[10px] text-muted-foreground text-right'>{sentAt}</p>
          </div>
        ) : null}
      </div>
    </Link>
  );
});
SidebarItemLink.displayName = 'SidebarLinkItem';

function ChannelsSection({ children }: { children: React.ReactNode }) {
  return (
    <section aria-label='Chat channels' className='flex flex-col h-1/2'>
      <h1 className='pt-4 font-bold text-center text-l'>Channels</h1>
      <ScrollArea className='flex-1 w-full'>
        <div className='p-2 space-y-1'>{children}</div>
      </ScrollArea>
    </section>
  );
}
ChannelsSection.displayName = 'ChannelsSection';

function PrivateMessagesSection({ children }: { children: React.ReactNode }) {
  return (
    <section aria-label='Private Messages' className='h-[90%] flex flex-col'>
      <h1 className='pt-4 font-bold text-center text-l'>Private Message</h1>
      <ScrollArea className='flex-1 w-full'>
        <div className='p-2 space-y-1'>{children}</div>
      </ScrollArea>
      <SearchPrivateRoom
        triggerChild={
          <Button
            size='icon'
            role='combobox'
            className={cn(
              'flex items-center justify-center p-4 gap-2 hover:bg-muted from-neutral-200 w-full',
              SIDEBAR_CONSTANTS.HOVER_BG_COLOR,
            )}
          >
            <span>New Private Chat</span>
            <SIDEBAR_CONSTANTS.ICON_MAP.Plus className='w-5 h-5' />
            <span className='sr-only'>Search room</span>
          </Button>
        }
      />
    </section>
  );
}
PrivateMessagesSection.displayName = 'PrivateMessagesSection';

// SidebarHeader component
function SidebarWrapperHeader() {
  return (
    <SidebarHeader>
      <div className='sticky top-0 flex items-center justify-between px-4 h-14'>
        <div className='font-semibold'>Chats</div>
        <div>
          <JoinRoom />
        </div>
      </div>
    </SidebarHeader>
  );
}

const EmptyStateMessage = () => (
  <div className='flex flex-col items-center gap-2 p-4'>
    <h3 className='text-muted-foreground'>No direct messages yet</h3>
    <p className='text-xs text-center text-muted-foreground'>
      Use the button below to start a conversation
    </p>
  </div>
);

function PrivateChatList() {
  const userId = useAuthStorage((state) => state.userId);
  const { privateRoomList } = usePrivateMessageListStore();

  if (privateRoomList?.length === 0) {
    return <EmptyStateMessage />;
  }

  return privateRoomList.map((d) => {
    if (d.private_messages) {
      const isRecipient = d.recipient.pk_user_id === userId;
      const recipientId = isRecipient ? d.chat_user : d.recipient;
      const uniquePrivateChatKey = d.private_chat.unique_chat_key;

      return (
        <SidebarItemLink
          data={{
            to: `/private-chats/${uniquePrivateChatKey}`,
            linkTitle: recipientId.name as string,
            message: {
              message_text: d.private_messages.message_text as string,
              sent_at: d.private_messages.sent_at,
            },
            itemType: 'User',
          }}
          key={d.private_chat.pk_private_chat_id}
        />
      );
    }
  });
}
PrivateChatList.displayName = 'PrivateChatList';

const ChatRoomList = memo(({ data }: { data: ChatListType }) => {
  if (data.length === 0) {
    return (
      <div className='flex items-center gap-2 p-4'>
        <h3 className='text-muted-foreground'>No channels joined yet</h3>
        <JoinRoom />
      </div>
    );
  }
  return data.map((d) =>
    d.messages ? (
      <SidebarItemLink
        data={{
          to: `/chats/${d.chats?.pk_chats_id}`,
          linkTitle: d.chats?.chat_name as string,
          itemType: 'Users',
          message: {
            message_text: d.messages.message_text as string,
            sent_at: d.messages.sent_at,
          },
        }}
        key={d.messages.id}
      />
    ) : null,
  );
});
ChatRoomList.displayName = 'ChatRoomList';

function SidebarWrapper({ className }: SidebarProps) {
  const socket = useSocket();

  useGetPrivateMessageList({ socket });
  const { chatroomList } = useGetChatList({ socket });
  const { handleCloseDialogOnMobileView } = useMobileSidebar();

  return (
    <Sidebar side='left' className='h-screen dark'>
      <SidebarWrapperHeader />
      <SidebarContent onClick={handleCloseDialogOnMobileView}>
        <section className={cn('w-full', className)}>
          <nav className='grid gap-1  grid-rows-2 h-[calc(100vh-3.5rem)]'>
            <ChannelsSection>
              <ChatRoomList data={chatroomList} />
            </ChannelsSection>

            <PrivateMessagesSection>
              <PrivateChatList />
            </PrivateMessagesSection>
          </nav>
        </section>
      </SidebarContent>
    </Sidebar>
  );
}

const SidebarWithProvider = ({ className }: { className?: string }) => {
  return (
    <SocketProvider>
      <SidebarWrapper className={cn('relative hidden h-full md:grid', className)} />
    </SocketProvider>
  );
};

export default SidebarWithProvider;
