import { Button } from "../../ui/button";
import { PaperclipIcon, SendIcon, SmileIcon } from "lucide-react";
import { Input } from "../../ui/input";
import { SubmitHandler, useForm } from "react-hook-form";
import { type MessageInput } from "../../../types";
import { useSendMessage } from "../../../hooks/useSendMessage";

export function MessageInput({ chatId, chatName }: { chatId: string; chatName: string }) {
	const { sendMessage } = useSendMessage();
	const INPUT_NAME = "message_text";
	const { register, handleSubmit, setValue } = useForm<MessageInput>(); // Update the type of useForm

	const onSubmit: SubmitHandler<MessageInput> = (data) => {
		// Update the type of SubmitHandler
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
					type="text"
					className="flex-1 rounded-[0.5rem]"
					placeholder="Type a message..."
					{...register(INPUT_NAME)}
				/>
				<Button type="button" variant="ghost" size="icon" className="ml-2">
					<SmileIcon className="h-5 w-5" />
					<span className="sr-only">Add emoji</span>
				</Button>
				<Button type="submit" size="icon" className="ml-2">
					<SendIcon className="h-5 w-5" />
					<span className="sr-only">Send message</span>
				</Button>
			</form>
		</div>
	);
}
