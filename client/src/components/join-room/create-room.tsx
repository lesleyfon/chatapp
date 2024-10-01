import { ErrorMessage } from "@hookform/error-message";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";

import { Button } from "../ui/button";
import { cn, getBearer } from "../../lib/utils";
import { PlusIcon, SendIcon } from "../ui/avatar/index";
import { Input } from "../ui/input";
import {
	Dialog,
	DialogTrigger,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
} from "../ui/dialog";
export function CreateNewRoom() {
	const INPUT_NAME = "new-chat-name";

	const mutation = useMutation({
		mutationFn: (data: { [key: string]: string }) => {
			return fetch("http://localhost:3010/chats/chat/new-chatroom", {
				method: "POST",
				headers: {
					Authorization: getBearer(),
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					chat_name: data?.[INPUT_NAME],
				}),
			});
		},
	});

	const {
		register,
		handleSubmit,
		setValue,
		formState: { errors },
	} = useForm();

	const onSubmit = (data: { [key: string]: string }) => {
		mutation.mutate(data);

		setValue(INPUT_NAME, "");
	};

	if (mutation.isPending) {
		return <h3>Creating new Chatroom</h3>;
	}
	if (mutation.isError) {
		return <h3>Error occurred while new Chatroom</h3>;
	}

	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button
					size="icon"
					role="combobox"
					variant="outline"
					className="border-0 p-0 bg-transparent  hover:bg-[#2f2f2f] rounded-[10%]"
				>
					<PlusIcon className="h-5 w-5" />
					<span className="sr-only">New Chat</span>
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-[425px] bg-[#242424] {">
				<DialogHeader>
					<DialogTitle>Create a new Chatroom</DialogTitle>
					<DialogDescription>
						Create a new chatroom here. Click send button when you&lsquo;re done.
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit(onSubmit)}>
					<div className="grid gap-2">
						<Input
							type="text"
							className={cn(
								"flex-1 rounded-[0.2rem]",
								errors?.["new-chat-name"] ? "border-red-400" : ""
							)}
							placeholder="Room name"
							autoComplete="off"
							{...register(INPUT_NAME, {
								required: "Can't submit an empty field",
							})}
						/>
						<ErrorMessage
							errors={errors}
							name={INPUT_NAME}
							render={({ message }) => (
								<p className="text-xs text-red-400">{message}</p>
							)}
						/>
					</div>
					<DialogFooter>
						<div className="flex justify-end">
							<Button
								type="submit"
								size="icon"
								className={cn("ml-2 hover:border-primary hover:border-solid")}
							>
								<SendIcon className="h-5 w-5" />
								<span className="sr-only">Send message</span>
							</Button>
						</div>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
