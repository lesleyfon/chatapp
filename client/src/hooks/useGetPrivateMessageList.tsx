import { useEffect, useState } from "react";

import { useNavigate, useParams } from "react-router-dom";
import { PrivateChatResultType } from "./../types/index";

import { Socket } from "socket.io-client";
import useAuthStorage from "../store/useAuthStorage";

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
	const chatUser = new Set([state.private_chat.sender_id, state.private_chat.recipient_id]);
	const responseSenderId = response.private_chat.sender_id,
		responseRecipientId = response.private_chat.recipient_id,
		stateSenderId = state.private_chat.sender_id,
		stateRecipientId = state.private_chat.recipient_id;

	const chatToUpdate =
		(responseSenderId === stateSenderId && responseRecipientId === stateRecipientId) ||
		(responseSenderId === stateRecipientId && responseRecipientId === stateSenderId);

	if (chatUser.has(userId) && chatToUpdate) {
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
	const { recipientId } = useParams(); // This should not be from params.

	const handleMessageUpdate = (response: PrivateChatResultType) => {
		const { sender_id: responseSenderId, recipient_id: responseRecipientId } =
			response.private_chat;
		const chatUser = new Set([responseSenderId, responseRecipientId]);
		if (!userId) return;
		// If we're in a specific chat, only update that chat

		if (recipientId) {
			// TODO: WHYYYYY
			if (!chatUser.has(userId)) {
				return;
			}
		}

		setPrivateRoomList((prevList) => {
			const userExist = prevList.some((chat) => {
				const { sender_id: chatSenderId, recipient_id: chatRecipientId } =
					chat.private_chat;
				const chatIdBetweenUsers = new Set([chatSenderId, chatRecipientId]);

				const recipientExist = chatIdBetweenUsers.has(response.private_chat.recipient_id);
				const senderExist = chatIdBetweenUsers.has(response.private_chat.sender_id);

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
				const existingChatUser = new Set([chatSenderId, chatRecipientId]);
				// IF the current user if not part of a chat, return early.
				return existingChatUser.has(userId);
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
	}, [socket, userId, recipientId, navigate]);

	return {
		privateRoomList,
		handleMessageUpdate,
	};
};
