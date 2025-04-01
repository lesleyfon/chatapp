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
	recipientId,
}: {
	state: PrivateChatResultType;
	response: PrivateChatResultType;
	userId: string;
	recipientId?: string;
}) {
	if (!recipientId) return state;

	const { sender_id, recipient_id } = state.private_chat;

	if (
		isPrivateChatBetweenTwoUsers({
			responseSenderId: String(sender_id),
			responseRecipientId: String(recipient_id),
			userId: String(userId),
			recipientId: String(recipientId),
		})
	) {
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
	const { recipientId } = useParams();

	const handleMessageUpdate = (response: PrivateChatResultType) => {
		const { sender_id: responseSenderId, recipient_id: responseRecipientId } =
			response.private_chat;

		// If we're in a specific chat, only update that chat
		if (recipientId) {
			const isSameChat = isPrivateChatBetweenTwoUsers({
				responseSenderId,
				responseRecipientId,
				userId,
				recipientId,
			});

			if (!isSameChat) {
				return;
			}
		}

		if (!userId) return;

		setPrivateRoomList((prevList) => {
			// Check if this chat already exists
			const existingChatIndex = prevList.filter((chat) => {
				const { sender_id: charSenderId, recipient_id: chatRecipientId } =
					chat.private_chat;

				const isSameChat = isPrivateChatBetweenTwoUsers({
					responseSenderId: String(charSenderId),
					responseRecipientId: String(chatRecipientId),
					userId: String(userId),
					recipientId: String(recipientId),
				});
				return !isSameChat;
			});

			if (existingChatIndex.length === 0) {
				// This is a new chat, add it to the list
				return [updateChatList({ state: response, response, userId, recipientId })];
			}

			// Update existing chat
			return prevList.map((chat) =>
				updateChatList({ state: chat, response, userId, recipientId })
			);
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
