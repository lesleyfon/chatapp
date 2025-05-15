import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';

import api from '../api/http-methods';

function useRoomData() {
  const { chatId, recipientId, uniquePrivateChatKey } = useParams<{
    chatId?: string;
    recipientId?: string;
    uniquePrivateChatKey?: string;
  }>();
  const isNewPrivateChat = uniquePrivateChatKey?.includes('new_private_chat');

  const {
    isPending: isChatPending,
    data: chatData,
    isFetching: isChatFetching,
  } = useQuery({
    queryKey: [chatId],
    queryFn: chatId ? () => api.fetchChatListsDataFromChatId(chatId) : async () => null,
    initialData: { msg: [] },
  });

  const { isPending: isRecipientPending, data: recipientData } = useQuery({
    queryKey: [uniquePrivateChatKey],
    queryFn:
      uniquePrivateChatKey && isNewPrivateChat === false
        ? () => api.fetchPrivateMessageListsDataFromUniquePrivateChatKey(uniquePrivateChatKey)
        : async () => null,
  });

  const loadingState = [
    chatId && (isChatFetching || isChatPending),
    uniquePrivateChatKey && isRecipientPending,
  ].some(Boolean);

  return {
    loadingState,
    chatData,
    recipientData,
    chatId,
    recipientId,
    uniquePrivateChatKey,
    isNewPrivateChat,
  };
}

export default useRoomData;
