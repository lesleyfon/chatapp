import { useCallback, useEffect, useState } from "react";

import { useNavigate } from "react-router-dom";
import { PrivateChatResultType } from "./../types/index";

import { Socket } from "socket.io-client";
import useAuthStorage from "../store/useAuthStorage";

/**
 * Checks if the user is a participant in the chat
 * @param userId - The user's ID
 * @param chatUsers - An array of user IDs that are part of the chat
 * @returns true if the user is a participant in the chat, false otherwise
 */
const isChatParticipant = (userId: string, chatUsers: string[]) => {
	const chatUserSet = new Set(chatUsers);
	return chatUserSet.has(userId);
};

/**
 * Checks if two chats are the same
 * @param chat1 - The first chat
 * @param chat2 - The second chat
 * @returns true if the chats are the same, false otherwise
 */
const doChatsMatch = (
	chat1: { sender_id: string; recipient_id: string },
	chat2: { sender_id: string; recipient_id: string }
) => {
	return (
		(chat1.sender_id === chat2.sender_id && chat1.recipient_id === chat2.recipient_id) ||
		(chat1.sender_id === chat2.recipient_id && chat1.recipient_id === chat2.sender_id)
	);
};

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

	const isChatUser = isChatParticipant(userId, [stateSenderId, stateRecipientId]);

	const chatToUpdate =
		(responseSenderId === stateSenderId && responseRecipientId === stateRecipientId) ||
		(responseSenderId === stateRecipientId && responseRecipientId === stateSenderId);

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

	const handleMessageUpdate = useCallback(
		(response: PrivateChatResultType) => {
			if (!userId) return;

			const { sender_id: responseSenderId, recipient_id: responseRecipientId } =
				response.private_chat;
			const privateMessageUserIds = [responseSenderId, responseRecipientId];

			// Check if the user is a participant in the chat If not, return early
			if (!isChatParticipant(userId, privateMessageUserIds)) {
				return;
			}

			setPrivateRoomList((prevList) => {
				// Check if the new response is part of a message sent by an already existing chat.
				const userExist = prevList.some((chat) =>
					doChatsMatch(chat.private_chat, response.private_chat)
				);

				// If the user does not exist, update the chat list with the new message
				if (userExist === false) {
					return [updateChatList({ userId, response, state: response }), ...prevList];
				}

				//Filter out the chat that has the same sender and recipient from the list. This is the response that we want to update.
				const updatedList = prevList.filter(
					(chat) => !doChatsMatch(chat.private_chat, response.private_chat)
				);

				// Update the chat list with the new message
				return [updateChatList({ userId, response, state: response }), ...updatedList];
			});
		},
		[userId]
	);

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
