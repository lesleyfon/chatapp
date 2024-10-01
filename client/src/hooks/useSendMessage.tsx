import { useNavigate } from "react-router-dom";
import { MessageInput } from "./../types/index";
import useAuthStorage from "../store/useAuthStorage";
import { Socket } from "socket.io-client";

export const useSendMessage = () => {
	const { token, userId } = useAuthStorage((state) => state);
	const navigate = useNavigate();

	if (!token || !userId) {
		navigate("/");
	}

	function sendPrivateMessage(
		data: MessageInput & { recipientId: string },
		socket: Socket | null
	) {
		// If the socket is null, return early
		if (socket === null) return;
		// If the socket is not connected, connect it
		if (socket.connected === false) socket.connect();

		socket.emit("add-private-message", {
			recipientId: data.recipientId,
			senderId: userId,
			message: data.message_text,
		});

		return data;
	}
	function sendMessage(
		data: MessageInput & { chatId: string; chatName: string },
		socket: Socket | null
	) {
		// If the socket is null, return early
		if (socket === null) return;
		// If the socket is not connected, connect it
		if (socket.connected === false) socket.connect();

		socket.emit("add-message", {
			chatId: data.chatId,
			message: data.message_text,
			chatName: data.chatName,
			senderId: userId,
		});
	}

	return { sendMessage, sendPrivateMessage };
};
