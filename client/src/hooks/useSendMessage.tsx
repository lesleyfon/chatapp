import { useNavigate } from "react-router-dom";
import { MessageInput } from "./../types/index";
import { createSocketInstance } from "../api/sockets";

export const useSendMessage = () => {
	const token = localStorage.getItem("auth_token");
	const userId = localStorage.getItem("userId");
	const navigate = useNavigate();
	if (!token) {
		navigate("/");
	}

	function sendPrivateMessage(data: MessageInput & { recipientId: string }) {
		const socket = createSocketInstance();
		socket.emit("add-private-message", {
			recipientId: data.recipientId,
			senderId: userId,
			message: data.message_text,
		});
		return data;
	}
	function sendMessage(data: MessageInput & { chatId: string; chatName: string }) {
		const socket = createSocketInstance();

		socket.emit("add-message", {
			chatId: data.chatId,
			message: data.message_text,
			chatName: data.chatName,
			senderId: userId,
		});
	}

	return { sendMessage, sendPrivateMessage };
};
