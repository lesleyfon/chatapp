import { useEffect, useState } from "react";

import { useNavigate } from "react-router-dom";
import { ChatListType } from "./../types/index";
import { useSocketInstance } from "../api/sockets";
import useAuthStorage from "../store/useAuthStorage";

export const useGetChatList = () => {
	const [chatroomList, setChatList] = useState<ChatListType>([]);
	const token = useAuthStorage((authState) => authState.token);
	const navigate = useNavigate();
	const socket = useSocketInstance();

	useEffect(() => {
		if (!token) {
			navigate("/");
			return;
		}
		// If the socket is null, return early
		if (socket === null) return;
		// If the socket is not connected, connect it
		if (socket.connected === false) socket.connect();

		// Fetch initial chat list
		// This socket is mean to fire only on initial render, to get the list of chatrooms for a user.
		// THOUGHT: Would it make sense to have this be an api?
		socket.emit("get-chat-list", (response: ChatListType) => {
			setChatList(response);
		});

		// Setup listener for new messages
		const handleMessageUpdate = (response: ChatListType) => {
			setChatList((prevChatList) =>
				prevChatList.map((chat) =>
					chat.chats?.pk_chats_id === response[0].chats?.pk_chats_id ? response[0] : chat
				)
			);
		};

		socket.on("get-latest-chat-room-message", handleMessageUpdate);

		// Cleanup function to avoid memory leaks
		return () => {
			socket.off("get-latest-chat-room-message", handleMessageUpdate);
			socket.disconnect();
		};
	}, [navigate]); // Added 'navigate' to the dependency array to ensure effect runs only when it changes

	return { chatroomList };
};
