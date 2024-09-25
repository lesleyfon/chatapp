import { useEffect, useState } from "react";

import { useNavigate, useParams } from "react-router-dom";
import { PrivateChatResultType } from "./../types/index";
import { createSocketInstance } from "../api/sockets";

export const useGetPrivateMessageList = () => {
	const [privateRoomList, setPrivateRoomList] = useState<PrivateChatResultType[]>([]);
	const navigate = useNavigate();
	const { recipientId } = useParams();

	useEffect(() => {
		const token: string | null = localStorage.getItem("auth_token");
		const userId: string | null = localStorage.getItem("userId");

		if (!token || !userId) {
			navigate("/");
			return;
		}

		const socket = createSocketInstance();

		socket.emit("get-private-message-list", (response: PrivateChatResultType[]) => {
			setPrivateRoomList(response);
		});

		const isPrivateChatBetweenTwoUsers = ({
			sender_id,
			recipient_id,
		}: {
			recipient_id: string;
			sender_id: string;
		}): boolean => {
			return (
				(sender_id === userId && recipient_id === recipientId) ||
				(sender_id === recipientId && recipient_id === userId)
			);
		};

		// Setup listener for new messages
		const handleMessageUpdate = (response: PrivateChatResultType) => {
			const { sender_id, recipient_id } = response.private_chat;

			if (isPrivateChatBetweenTwoUsers({ sender_id, recipient_id })) {
				setPrivateRoomList((previousPrivateRoomData) => {
					return previousPrivateRoomData.map((data) => {
						const { sender_id, recipient_id } = data.private_chat;

						if (isPrivateChatBetweenTwoUsers({ sender_id, recipient_id })) {
							// This Updates the most recent message sent
							return {
								...data, // Create a new object
								private_messages: {
									...data.private_messages, // Preserve existing messages
									message_text: response.private_messages.message_text, // Update the message
								},
							};
						}

						return data; // Return unchanged data if not the same chat
					});
				});
			}
		};

		socket.on("get-latest-private-message-sent", handleMessageUpdate);

		// Cleanup function to avoid memory leaks
		return () => {
			// socket.off("get-latest-private-message-sent", handleMessageUpdate);
			socket.disconnect();
		};
	}, [navigate]);

	return { privateRoomList };
};
