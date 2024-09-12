"use client";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ErrorMessage } from "@hookform/error-message";
import { useForm } from "react-hook-form";
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
import { cn, getBearer } from "../../lib/utils";
import { PlusIcon, SendIcon, SearchIcon } from "../ui/avatar/index";
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

export function SearchRoom() {
	const [open, setOpen] = useState(false);
	const { register } = useForm();
	const SEARCH_INPUT_NAME: string = "SEARCH_ROOM_NAME";

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

	const handleSelect = () => {
		setOpen(false);
	};

	const ChatroomLinks = useMemo(() => {
		if (data?.length) {
			return data
				.sort((a, b) => {
					const aLowercaseChatroomName = (a.chat_name ?? "").toLowerCase();
					const bLowercaseChatroomName = (b.chat_name ?? "").toLowerCase();
					return aLowercaseChatroomName > bLowercaseChatroomName ? 1 : -1;
				})
				.map((chatroomName) => (
					<Link to={`/chats/${chatroomName.pk_chats_id}`} key={chatroomName.pk_chats_id}>
						<CommandItem
							value={chatroomName.pk_chats_id}
							onSelect={handleSelect}
							className=" cursor-pointer !w-full hover:!bg-[#4c4c52] !rounded-[0.2rem]"
						>
							{chatroomName.chat_name ?? ""}
						</CommandItem>
					</Link>
				));
		}
		return [];
	}, [data]);

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button
					size="icon"
					role="combobox"
					variant="outline"
					className="border-0 p-0 bg-transparent  hover:bg-[#2f2f2f] rounded-[10%]"
				>
					<SearchIcon className="h-5 w-5" />
					<span className="sr-only">Search room</span>
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-[475px] [&>button]:hidden bg-[#242424] p-6 border-0">
				<DialogHeader>
					<DialogTitle>Look up room to join</DialogTitle>
					<DialogDescription>
						Search a new room to join and chat with others
					</DialogDescription>
				</DialogHeader>
				<Command className="p-0 rounded-[0.2rem] border ">
					<CommandInput
						{...register(SEARCH_INPUT_NAME, {
							onChange: () => {
								setOpen(true);
							},
						})}
						placeholder="Search..."
						className="w-full"
					/>
					<CommandList>
						<CommandEmpty>empty</CommandEmpty>
						<CommandGroup className=" flex !w-full [&>div]:!w-full">
							{ChatroomLinks}
						</CommandGroup>
					</CommandList>
				</Command>
			</DialogContent>
		</Dialog>
	);
}

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

export function JoinRoom() {
	return (
		<div className="w-1/3 flex items-end justify-end gap-3 pr-8">
			<SearchRoom />
			<CreateNewRoom />
		</div>
	);
}
