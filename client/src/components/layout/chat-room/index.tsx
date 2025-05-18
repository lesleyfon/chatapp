import { TriangleAlert } from 'lucide-react';

import { useEffect } from 'react';
import type { ErrorResponse, SuccessResponse } from '../../../api/http-methods';
import { SocketProvider } from '../../../context/socket.context';
import useRoomData from '../../../hooks/use-room-data';
import { Loader } from '../../loader';

import useAuthStorage from '../../../store/use-auth-storage';
import { useChannelRoomMessages } from '../../../store/use-channel-room-messages-store';
import { ChatMessageInput } from './chat-room-message-input';
import { ChatRoomSection } from './chat-room-section';
import { PrivateMessageSection } from './private-chat-section';

function isErrorResponse(data: ErrorResponse | SuccessResponse): data is ErrorResponse {
  return 'error' in data;
}

function ChatRoomLayout() {
  const { loadingState, chatData, recipientData, chatId, uniquePrivateChatKey, isNewPrivateChat } =
    useRoomData();
  const { setCurrentChannelRoomMessages } = useChannelRoomMessages();

  useEffect(() => {
    if (chatData?.msg) {
      setCurrentChannelRoomMessages(chatData.msg);
    }
  }, [chatData?.msg, setCurrentChannelRoomMessages]);

  const userId = useAuthStorage((state) => state.userId);
  if (loadingState) {
    return <Loader />;
  }

  if (
    (chatData && isErrorResponse(chatData)) ||
    (recipientData && isErrorResponse(recipientData))
  ) {
    const ERROR_MESSAGE = uniquePrivateChatKey ? 'Private Chat Not Found' : 'Chat Room Not Found';
    return (
      <div className='flex flex-col items-center justify-center h-full'>
        <h2 className='flex items-center justify-center text-red-500 text-8xl'>
          404 <TriangleAlert className='w-24 h-24' />
        </h2>
        <p className='flex items-center justify-center text-red-500 text-2xl'>{ERROR_MESSAGE}</p>
      </div>
    );
  }

  if (isNewPrivateChat && uniquePrivateChatKey) {
    const recipientId = uniquePrivateChatKey.split('new_private_chat')[0];
    return (
      <section className='overflow-y-hidden grid grid-rows-[12fr_1fr] md:grid-rows-[11fr_1fr]'>
        <PrivateMessageSection data={[]} />
        <ChatMessageInput
          isPrivateChat
          chatName={''}
          chatId={uniquePrivateChatKey}
          uniquePrivateChatKey={uniquePrivateChatKey}
          recipientId={recipientId}
        />
      </section>
    );
  }
  if (recipientData?.msg && recipientData.msg.length >= 0 && uniquePrivateChatKey) {
    const recipientId = recipientData?.msg.find((msg) => msg.chat_user.pk_user_id !== userId)
      ?.chat_user?.pk_user_id;
    const data = recipientData?.msg ?? [];
    const uniqueChatKey = data.length > 0 ? data[0].private_chat.unique_chat_key : undefined;
    if (!uniqueChatKey) {
      // biome-ignore lint/suspicious/noConsole: <explanation>
      console.error('No unique chat key found');
      return (
        <div className='flex flex-col items-center justify-center h-full'>
          <h2 className='flex items-center justify-center text-red-500 text-8xl'>
            500 <TriangleAlert className='w-24 h-24' />
          </h2>
          <p className='flex items-center justify-center text-red-500 text-2xl'>
            Internal Server Error
          </p>
        </div>
      );
    }

    return (
      <section className='overflow-y-hidden grid grid-rows-[12fr_1fr] md:grid-rows-[11fr_1fr]'>
        <PrivateMessageSection data={data ?? []} />
        <ChatMessageInput
          isPrivateChat
          chatName={''}
          chatId={uniquePrivateChatKey}
          uniquePrivateChatKey={uniquePrivateChatKey}
          recipientId={recipientId}
        />
      </section>
    );
  }
  const roomName = chatData?.msg?.[0]?.chats?.chat_name ?? '';
  return (
    <section className='overflow-y-hidden grid grid-rows-[12fr_1fr] md:grid-rows-[11fr_1fr]'>
      <ChatRoomSection />
      {chatId && chatId.length > 0 ? (
        <ChatMessageInput chatId={chatId} chatName={roomName} />
      ) : null}
    </section>
  );
}

const ChatRoomLayoutWithSocketProvider = () => {
  return (
    <SocketProvider>
      <ChatRoomLayout />
    </SocketProvider>
  );
};

export default ChatRoomLayoutWithSocketProvider;
