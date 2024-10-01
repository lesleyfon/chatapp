import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "../api/http-methods";

const useRoomData = () => {
	const { chatId, recipientId } = useParams<{ chatId?: string; recipientId?: string }>();

	const {
		isPending: isChatPending,
		data: chatData,
		isFetching: isChatFetching,
	} = useQuery({
		queryKey: [chatId],
		queryFn: chatId ? () => api.fetchChatListsDataFromChatId(chatId) : undefined,
	});

	const { isPending: isRecipientPending, data: recipientData } = useQuery({
		queryKey: [recipientId],
		queryFn: recipientId
			? () => api.fetchPrivateMessageListsDataFromRecipientId(recipientId)
			: undefined,
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
