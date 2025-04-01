import { Socket } from "socket.io-client";
import useAuthStorage from "../store/useAuthStorage";
import { MessageInput } from "./../types/index";
import { useSocketAuth } from "./useSocketAuth";

export const useSendMessage = ({ socket }: { socket: Socket | null }) => {
	const { userId } = useAuthStorage((state) => state);

	useSocketAuth({ socket });

	/**
	 * Sends a private message over a Socket.IO connection.
	 *
	 * If the provided socket is null, the function exits immediately. Otherwise, it ensures the socket is connected before emitting an "add-private-message" event with the recipient's ID, sender's ID, message text, and optional image details.
	 *
	 * @param data - The message payload containing the recipient's ID, message text, and optionally, an image file and its name.
	 *
	 * @returns The original message payload if a socket is provided; otherwise, undefined.
	 */
	function sendPrivateMessage(
		data: MessageInput & {
			recipientId: string;
			imageFile?: HTMLImageElement;
			imageName?: string;
		},
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
			imageFile: data?.imageFile,
			imageName: data?.imageName,
			sent_at: data.sent_at,
		});

		return data;
	}
	/**
	 * Sends a chat message via a Socket.IO connection.
	 *
	 * Emits an "add-message" event with the chat identifier, chat name, and message text contained in the input data.
	 * If the socket is null, the function exits without sending a message. If the socket is not connected,
	 * it establishes a connection before emitting the event.
	 *
	 * @param data - An object containing the chat ID, chat name, and the message text to be sent.
	 */
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
