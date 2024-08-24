import { io } from "socket.io-client";

import { useNavigate } from "react-router-dom";
import { MessageInput } from "./../types/index";

export const useSendMessage = () => {
	const token = localStorage.getItem("auth_token");
	const userId = localStorage.getItem("userId");
	const navigate = useNavigate();
	if (!token) {
		navigate("/");
	}

	function sendMessage(data: MessageInput & { chatId: string; chatName: string }) {
		console.log(data);
		const socket = io("http://localhost:3010/", {
			reconnectionDelay: 10000,
			timestampRequests: true,
			auth: { token },
			transports: ["websocket", "polling", "flashsocket"],
		});

		console.log(data.chatName);
		console.log(data.chatId);
		socket.emit("add-message", {
			chatId: data.chatId,
			message: data.message_text,
			chatName: data.chatName,
			senderId: userId,
		});
	}

	return { sendMessage };
};
