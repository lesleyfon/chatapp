"use client";

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ErrorMessage } from "@hookform/error-message";
import { useForm } from "react-hook-form";
import { Search } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";

import { Button } from "../ui/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "../ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { cn, getBearer } from "../../lib/utils";
import { PlusIcon, SendIcon } from "../ui/avatar/index";
import { ChatRoomType } from "../../types";
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

export function JoinRoom() {
	const [open, setOpen] = useState(false);

	const [chatroomNames, setChatroomNames] = useState<{ value: string; label: string }[]>([]);
	const { data } = useQuery<ChatRoomType[], Error>({
		queryKey: ["chat-rooms"],
		queryFn: async () => {
			const response = await fetch(`http://localhost:3010/chats/all/chat-rooms`, {
				headers: {
					Authorization: getBearer(),
				},
			});
			return await response.json();
		},
	});

	useEffect(() => {
		if (data?.length) {
			setChatroomNames(
				data.map((chatroom) => ({
					value: chatroom.pk_chats_id,
					label: chatroom.chat_name || "",
				}))
			);
		}
	}, [data]);

	const handleSelect = () => {
		setOpen(false);
	};

	return (
		<div>
			<Popover open={open} onOpenChange={setOpen}>
				<PopoverTrigger asChild>
					<Button
						size="icon"
						role="combobox"
						variant="outline"
						aria-expanded={open}
						className="border-0 p-0 bg-transparent  hover:bg-[#2f2f2f] rounded-[10%]"
					>
						<Search className="h-5 w-5" />
						<span className="sr-only">New Chat</span>
					</Button>
				</PopoverTrigger>
				<PopoverContent className="w-[200px] p-0 bg-[#242424] rounded-[0.2rem]">
					<Command>
						<CommandInput placeholder="Search Chatroom..." />
						<CommandList>
							<CommandEmpty>No framework found.</CommandEmpty>
							<CommandGroup className=" flex !w-full [&>div]:!w-full ">
								{chatroomNames.map((chatroomName) => (
									<Link
										to={`/chats/${chatroomName.value}`}
										key={chatroomName.value}
									>
										<CommandItem
											value={chatroomName.value}
											onSelect={handleSelect}
											className=" cursor-pointer !w-full hover:!bg-[#4c4c52] !rounded-[0.2rem]"
										>
											{chatroomName.label}
										</CommandItem>
									</Link>
								))}
							</CommandGroup>
						</CommandList>
					</Command>
				</PopoverContent>
			</Popover>
			<CreateNewRoom />
		</div>
	);
}

export function CreateNewRoom() {
	const INPUT_NAME = "new-chat-name";

	const mutation = useMutation({
		mutationFn: (data: { [key: string]: string }) => {
			console.log({ chat_name: data?.[INPUT_NAME] });
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

		console.log(mutation.data);
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
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>Create a new Chatroom</DialogTitle>
					<DialogDescription>
						Create a new chatroom here. Click send button when you're done.
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
								className={cn("ml-2 alin hover:border-primary hover:border-solid")}
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
