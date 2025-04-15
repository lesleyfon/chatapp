import { useEffect, useState } from "react";

import { useNavigate } from "react-router-dom";
import { PrivateChatResultType } from "./../types/index";

import { Socket } from "socket.io-client";
import useAuthStorage from "../store/useAuthStorage";

// Create a utility function for checking chat participants
const isChatParticipant = (userId: string, chatUsers: string[]) => {
	const chatUserSet = new Set(chatUsers);
	return chatUserSet.has(userId);
};

export function isPrivateChatBetweenTwoUsers({
	responseRecipientId,
	responseSenderId,
	userId,
	recipientId,
}: {
	responseRecipientId: string | null;
	responseSenderId: string | null;
	userId: string | null;
	recipientId?: string;
}): boolean {
	const senderIdString = String(responseSenderId);
	const recipientIdString = String(responseRecipientId);
	const userIdString = String(userId);
	return (
		(senderIdString === userIdString && recipientIdString === recipientId) ||
		(senderIdString === recipientId && recipientIdString === userIdString)
	);
}

function updateChatList({
	state,
	response,
	userId,
}: {
	userId: string;
	state: PrivateChatResultType;
	response: PrivateChatResultType;
}) {
	const responseSenderId = response.private_chat.sender_id,
		responseRecipientId = response.private_chat.recipient_id,
		stateSenderId = state.private_chat.sender_id,
		stateRecipientId = state.private_chat.recipient_id;

	const chatToUpdate =
		(responseSenderId === stateSenderId && responseRecipientId === stateRecipientId) ||
		(responseSenderId === stateRecipientId && responseRecipientId === stateSenderId);

	const isChatUser = isChatParticipant(userId, [stateSenderId, stateRecipientId]);

	if (isChatUser && chatToUpdate) {
		// This Updates the most recent message sent
		return {
			...state, // Create a new object
			private_messages: {
				...state.private_messages, // Preserve existing messages
				message_text: response.private_messages.message_text, // Update the message
				sent_at: response.private_messages.sent_at, // Update the sent_at
			},
		};
	}

	return state; // Return unchanged data if not the same chat
}

export const useGetPrivateMessageList = ({ socket }: { socket: Socket | null }) => {
	const [privateRoomList, setPrivateRoomList] = useState<PrivateChatResultType[]>([]);
	const navigate = useNavigate();
	const { userId } = useAuthStorage((state) => state);

	const handleMessageUpdate = (response: PrivateChatResultType) => {
		const { sender_id: responseSenderId, recipient_id: responseRecipientId } =
			response.private_chat;
		const privateMessageUserIds = [responseSenderId, responseRecipientId];
		if (!userId) return;
		// If we're in a specific chat, only update that chat

		if (!isChatParticipant(userId, privateMessageUserIds)) {
			return;
		}

		setPrivateRoomList((prevList) => {
			const userExist = prevList.some((chat) => {
				const { sender_id: chatSenderId, recipient_id: chatRecipientId } =
					chat.private_chat;
				const chatUserIds = [chatSenderId, chatRecipientId];

				const recipientExist = isChatParticipant(responseRecipientId, chatUserIds);
				const senderExist = isChatParticipant(responseSenderId, chatUserIds);

				return recipientExist && senderExist;
			});

			if (userExist === false) {
				return [
					updateChatList({
						userId,
						response,
						state: response,
					}),
					...prevList,
				];
			}
			// Check if this chat already exists
			const existingChatIndex = prevList.filter((chat) => {
				const { sender_id: chatSenderId, recipient_id: chatRecipientId } =
					chat.private_chat;
				// IF the current user if not part of a chat, return early.
				return isChatParticipant(userId, [chatSenderId, chatRecipientId]);
			});

			if (existingChatIndex.length === 0) {
				// This is a new chat, add it to the list
				return [
					updateChatList({
						userId,
						response,
						state: response,
					}),
				];
			}
			// Update existing chat
			const filteredList = prevList.filter((chat) => {
				const { sender_id, recipient_id } = chat.private_chat;
				const chatToFilterOut =
					(sender_id === responseSenderId && recipient_id === responseRecipientId) ||
					(sender_id === responseRecipientId && recipient_id === responseSenderId);
				return chatToFilterOut === false;
			});
			return [
				updateChatList({
					userId,
					response,
					state: response,
				}),
				...filteredList,
			];
		});
	};

	useEffect(() => {
		if (socket === null) return;

		if (socket.connected === false) socket.connect();

		socket.emit("get-private-message-list", (response: PrivateChatResultType[]) => {
			setPrivateRoomList(response);
		});

		// Setup listener for new messages
		socket.on("get-latest-private-message-sent", handleMessageUpdate);

		// Cleanup function to avoid memory leaks
		return () => {
			socket.off("get-latest-private-message-sent", handleMessageUpdate);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [socket, userId, navigate]);

	return {
		privateRoomList,
		handleMessageUpdate,
	};
};
