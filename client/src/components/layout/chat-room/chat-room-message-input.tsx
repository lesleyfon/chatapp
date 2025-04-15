import EmojiPicker, { Theme } from "emoji-picker-react";
import { SendIcon, SmileIcon } from "lucide-react";
import { Button } from "../../ui/button";
import { useState } from "react";

import { SubmitHandler, useForm } from "react-hook-form";
import { useSendMessage } from "../../../hooks/useSendMessage";
import { useSocket } from "../../../hooks/useSocket";
import { cn, getCurrentDateTimeWithTimezone } from "../../../lib";
import { type MessageInput, type ChatInputProps } from "../../../types";

import { Input } from "../../ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "../../ui/popover";
import { DEFAULT_SVG_URL } from "../../constants";

// BUTTON Background Image
export function MessageInput({ chatId, chatName, isPrivateChat }: ChatInputProps) {
	const [svgUrl, setSvgUrl] = useState(DEFAULT_SVG_URL);
	const socket = useSocket();
	const { sendMessage, sendPrivateMessage } = useSendMessage({ socket });

	const INPUT_NAME = "message_text";
	const FILE_INPUT_NAME = "message_img";

	const {
		register,
		handleSubmit,
		setValue,
		getValues,
		setError,
		formState: { errors },
	} = useForm<MessageInput>();

	const onSubmit: SubmitHandler<MessageInput> = (data) => {
		if (data.message_text.trim().length === 0) {
			setError("message_text", {
				message: "Can't submit an empty field",
			});
			return;
		}
		const message_img = data?.message_img?.[0] as unknown as HTMLImageElement;

		if (isPrivateChat) {
			sendPrivateMessage(
				{
					message_text: data.message_text,
					recipientId: chatId,
					imageFile: message_img,
					imageName: message_img?.name,
					sent_at: getCurrentDateTimeWithTimezone(),
				},
				socket
			);
		} else {
			sendMessage(
				{
					chatId,
					message_text: data.message_text,
					chatName,
				},
				socket
			);
		}
		setValue(INPUT_NAME, "");
	};

	return (
		<div className="p-4 border-t">
			<form onSubmit={handleSubmit(onSubmit)} className="flex items-center">
				<Button
					type="button"
					variant="ghost"
					size="icon"
					className="mr-2 cursor-pointer"
					style={{
						backgroundImage: `url(${svgUrl})`,
						backgroundRepeat: "no-repeat",
						backgroundPositionX: "0",
						backgroundSize: "24px",
						backgroundPosition: "center",
					}}
				>
					<Input
						{...register(FILE_INPUT_NAME)}
						id="message-img"
						type="file"
						accept="image/png, image/jpeg"
						className=" cursor-pointer opacity-0"
						onChange={(e) => {
							const file = e.target.files?.[0];
							if (file) {
								const filePreview = URL.createObjectURL(file);
								setSvgUrl(filePreview);
							}
						}}
					/>
				</Button>
				<Input
					{...register(INPUT_NAME)}
					type="text"
					className={cn("flex-1 ", errors?.message_text ? "border-red-400" : "")}
					placeholder="Type a message..."
					autoComplete="off"
				/>
				<Popover>
					<PopoverTrigger>
						<Button type="button" variant="ghost" size="icon" className="ml-2">
							<SmileIcon className="h-5 w-5" />
							<span className="sr-only">Add emoji</span>
						</Button>
					</PopoverTrigger>
					<PopoverContent className="border-0 p-0 mr-5">
						<EmojiPicker
							width={300}
							theme={Theme.DARK}
							searchPlaceholder="Search Emoji..."
							onEmojiClick={({ emoji }) => {
								const currentMessageValue = getValues(INPUT_NAME);
								const messageWithEmojiAttached = `${currentMessageValue}${emoji}`;

								setValue(INPUT_NAME, messageWithEmojiAttached);
							}}
						/>
					</PopoverContent>
				</Popover>
				<Button type="submit" size="icon" className="ml-2">
					<SendIcon className="h-5 w-5" />
					<span className="sr-only">Send message</span>
				</Button>
			</form>
		</div>
	);
}
