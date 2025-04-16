import { Socket } from "socket.io-client";
import useAuthStorage from "../store/useAuthStorage";
import { MessageInput } from "./../types/index";
import { useSocketAuth } from "./useSocketAuth";
import { getBrowserTimeZone, getCurrentDateTimeWithTimezone } from "../lib";

const convertGifToBase64 = (file: File): Promise<string> => {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onloadend = () => {
			// Make sure the base64 string has the correct format
			const result = reader.result as string;
			if (!result.startsWith("data:image/gif;base64,")) {
				// If it doesn't have the correct prefix, add it
				resolve(`data:image/gif;base64,${result.replace(/^data:image\/gif;?base64,/, "")}`);
			} else {
				resolve(result);
			}
		};
		reader.onerror = reject;
		reader.readAsDataURL(file);
	});
};

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
	async function sendPrivateMessage(
		data: MessageInput & {
			recipientId: string;
			imageFile?: HTMLImageElement | File | string;
			imageName?: string;
		},
		socket: Socket | null
	) {
		const created_at = getCurrentDateTimeWithTimezone();
		const timezone = getBrowserTimeZone();

		// If the socket is null, return early
		if (socket === null) return;
		// If the socket is not connected, connect it
		if (socket.connected === false) socket.connect();

		/**
		 * IF the imageFile is a gif, convert to base64
		 */
		let file = data?.imageFile;
		if (file instanceof File && file.type === "image/gif") {
			file = await convertGifToBase64(file);
		}

		socket.emit("add-private-message", {
			recipientId: data.recipientId,
			senderId: userId,
			message: data.message_text,
			imageFile: file,
			imageName: data?.imageName,
			created_at,
			timezone,
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

		const sent_at = getCurrentDateTimeWithTimezone();
		const timezone = getBrowserTimeZone();

		socket.emit("add-message", {
			chatId: data.chatId,
			message: data.message_text,
			chatName: data.chatName,
			senderId: userId,
			sent_at,
			timezone,
		});
	}

	return { sendMessage, sendPrivateMessage };
};
