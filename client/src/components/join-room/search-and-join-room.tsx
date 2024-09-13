import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";

import { Button } from "../ui/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "../ui/command";
import { SearchIcon } from "../ui/avatar/index";
import { ChatRoomType } from "../../types";
import {
	Dialog,
	DialogTrigger,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
} from "../ui/dialog";
import api from "./../../api/httpMethods";

export function SearchRoom() {
	const [open, setOpen] = useState(false);
	const { register } = useForm();
	const SEARCH_INPUT_NAME: string = "SEARCH_ROOM_NAME";

	const { data } = useQuery<ChatRoomType[], Error>({
		queryKey: ["chat-rooms"],
		queryFn: () => api.fetchAllChatroom(),
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
