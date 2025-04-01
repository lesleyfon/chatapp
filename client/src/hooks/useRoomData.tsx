import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import api from "../api/http-methods";

const useRoomData = () => {
  const { chatId, recipientId } = useParams<{
    chatId?: string;
    recipientId?: string;
  }>();

  const {
    isPending: isChatPending,
    data: chatData,
    isFetching: isChatFetching,
  } = useQuery({
    queryKey: [chatId],
    queryFn: chatId
      ? () => api.fetchChatListsDataFromChatId(chatId)
      : async () => null,
  });

  const { isPending: isRecipientPending, data: recipientData } = useQuery({
    queryKey: [recipientId],
    queryFn: recipientId
      ? () => api.fetchPrivateMessageListsDataFromRecipientId(recipientId)
      : async () => null,
  });

  const loadingState = [
    chatId && (isChatFetching || isChatPending),
    recipientId && isRecipientPending,
  ].some(Boolean);

  return {
    loadingState,
    chatData,
    recipientData,
    chatId,
    recipientId,
  };
};

export default useRoomData;
