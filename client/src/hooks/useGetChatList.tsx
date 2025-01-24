import { useCallback, useEffect, useMemo, useState } from "react";

import { useNavigate } from "react-router-dom";
import { ChatListType } from "./../types/index";
import { useSocketInstance } from "../api/sockets";
import useAuthStorage from "../store/useAuthStorage";

export const useGetChatList = () => {
	const [chatroomList, setChatList] = useState<ChatListType>([]);
	const [error, setError] = useState<Error | null>(null);
	const authStorageLogout = useAuthStorage((state) => state.logout);

	const token = useAuthStorage((authState) => authState.token);
	const navigate = useNavigate();
	const socket = useSocketInstance();

	// Setup listener for new messages
	const handleMessageUpdate = useCallback((response: ChatListType) => {
		setChatList((prevChatList) => {
			const updatedChatList = prevChatList.map((chat) =>
				chat.chats?.pk_chats_id === response[0].chats?.pk_chats_id ? response[0] : chat
			);
			return updatedChatList;
		});
	}, []);

	useEffect(() => {
		if (!token) {
			navigate("/");
			return;
		}
		// If the socket is null, return early
		if (socket === null) {
			setError(new Error("Socket connection failed"));
			return;
		}
		// If the socket is not connected, connect it
		if (socket.connected === false) socket.connect();
		try {
			// Fetch initial chat list
			//THOUGHT: Can this be a hook???
			socket.on("connect_error", (err) => {
				const errObj = JSON.parse(err.message);

				if (err instanceof Error && "code" in errObj && errObj.code === 401) {
					authStorageLogout();
					navigate("/");
				}
				//TODO: is code is equal to internal server error, then we need to show a toast message to the user
			});
			// This socket is mean to fire only on initial render, to get the list of chatRooms for a user.
			// THOUGHT: Would it make sense to have this be an api?

			socket.emit("get-chat-list", (response: ChatListType) => {
				setChatList(response);
			});

			socket.on("get-latest-chat-room-message", handleMessageUpdate);
			// Clear the error state
			setError(null);
		} catch (error) {
			setError(error instanceof Error ? error : new Error("Unknown error occurred"));
		}

		// Cleanup function to avoid memory leaks
		return () => {
			socket.off("get-latest-chat-room-message", handleMessageUpdate);
			socket.disconnect();
		};
	}, [navigate]); // Added 'navigate' to the dependency array to ensure effect runs only when it changes

	// Sort the chatroom list by the last message sent
	const sortedChatroomList = useMemo(() => {
		return [...chatroomList].sort((a, b) => {
			const aLastMessage = a.messages?.sent_at;
			const bLastMessage = b.messages?.sent_at;
			return aLastMessage > bLastMessage ? -1 : 1;
		});
	}, [chatroomList]);

	return { chatroomList: sortedChatroomList, error };
};
