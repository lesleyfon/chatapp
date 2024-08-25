"use client";

import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

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
import { getBearer } from "../../lib/utils";
import { PlusIcon } from "../ui/avatar/index";
import { useQuery } from "@tanstack/react-query";
import { ChatRoomType } from "../../types";

export function JoinRoom() {
	const [open, setOpen] = React.useState(false);
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
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					size="icon"
					role="combobox"
					variant="outline"
					aria-expanded={open}
					className="border-0 p-0 bg-transparent  hover:bg-[#2f2f2f] rounded-[10%]"
				>
					<PlusIcon className="h-5 w-5" />
					<span className="sr-only">New Chat</span>
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-[200px] p-0 bg-[#242424] rounded-[0.2rem]">
				<Command>
					<CommandInput placeholder="Search framework..." />
					<CommandList>
						<CommandEmpty>No framework found.</CommandEmpty>
						<CommandGroup className=" flex !w-full [&>div]:!w-full ">
							{chatroomNames.map((chatroomName) => (
								<Link to={`/chats/${chatroomName.value}`}>
									<CommandItem
										key={chatroomName.value}
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
	);
}
