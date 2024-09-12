import { Button } from "../../ui/button";
import { PaperclipIcon, SendIcon, SmileIcon } from "lucide-react";
import EmojiPicker, { Theme } from "emoji-picker-react";

import { Input } from "../../ui/input";
import { SubmitHandler, useForm } from "react-hook-form";
import { type MessageInput } from "../../../types";
import { useSendMessage } from "../../../hooks/useSendMessage";
import { Popover, PopoverContent, PopoverTrigger } from "../../ui/popover";
import { cn } from "../../../lib/utils";

export function MessageInput({ chatId, chatName }: { chatId: string; chatName: string }) {
	const { sendMessage } = useSendMessage();
	const INPUT_NAME = "message_text";
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
		sendMessage({
			chatId,
			message_text: data.message_text,
			chatName,
		});
		setValue(INPUT_NAME, "");
	};

	return (
		<div className="p-4 border-t">
			<form onSubmit={handleSubmit(onSubmit)} className="flex items-center">
				<Button type="button" variant="ghost" size="icon" className="mr-2">
					<PaperclipIcon className="h-5 w-5" />
					<span className="sr-only">Attach file</span>
				</Button>
				<Input
					{...register(INPUT_NAME)}
					type="text"
					className={cn(
						"flex-1 rounded-[0.2rem]",
						errors?.message_text ? "border-red-400" : ""
					)}
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
