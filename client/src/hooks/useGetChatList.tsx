import { useEffect, useState } from "react";
import { io } from "socket.io-client";

import { useNavigate } from "react-router-dom";
import { ChatListType } from "./../types/index";

export const useGetChatList = () => {
	const [chatList, setChatList] = useState<ChatListType>([]);
	const token = localStorage.getItem("auth_token");
	const navigate = useNavigate();
	if (!token) {
		navigate("/");
	}
	useEffect(() => {
		const socket = io("http://localhost:3010/", {
			reconnectionDelay: 10000,
			timestampRequests: true,
			auth: { token },
			transports: ["websocket", "polling", "flashsocket"],
		});
		socket.emit("get-chat-list", (response: ChatListType) => {
			setChatList(response);
		});

		return () => {
			socket.disconnect();
		};
	});
	return { chatList };
};
