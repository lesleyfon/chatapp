import { useEffect, useState } from "react";

import { useNavigate, useParams } from "react-router-dom";
import { PrivateChatResultType } from "./../types/index";
import { useSocketInstance } from "../api/sockets";
import useAuthStorage from "../store/useAuthStorage";

export const useGetPrivateMessageList = () => {
	const [privateRoomList, setPrivateRoomList] = useState<PrivateChatResultType[]>([]);
	const navigate = useNavigate();
	const authStorageLogout = useAuthStorage((state) => state.logout);
	const { token, userId } = useAuthStorage((state) => state);
	const { recipientId } = useParams();
	const socket = useSocketInstance();

	useEffect(() => {
		if (!token || !userId) {
			navigate("/");
			return;
		}
		if (socket === null) return;

		if (socket.connected === false) socket.connect();

		socket.on("connect_error", (err) => {
			const errObj = JSON.parse(err.message);

			if (err instanceof Error && "code" in errObj && errObj.code === 401) {
				authStorageLogout();
				navigate("/");
			}
			//TODO: is code is equal to internal server error, then we need to show a toast message to the user
		});

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
			socket.disconnect();
		};
	}, [navigate]);

	return { privateRoomList };
};
