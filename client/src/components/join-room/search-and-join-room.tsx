import { useQuery } from "@tanstack/react-query";
import { memo, useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";

import api from "../../api/http-methods";
import { ChatRoomType } from "../../types";
import { SearchIcon } from "../ui/avatar/index";
import { Button } from "../ui/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "../ui/command";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "../ui/dialog";
import { useIsMobile } from "../../hooks/use-mobile";
import { useSidebar } from "../ui/sidebar";

interface ChatroomLinksProps {
	data: ChatRoomType[];
	handleSelect: () => void;
}

function sortData(a: ChatRoomType, b: ChatRoomType) {
	const aLowercaseChatroomName = (a.chat_name ?? "").toLowerCase();
	const bLowercaseChatroomName = (b.chat_name ?? "").toLowerCase();
	return aLowercaseChatroomName > bLowercaseChatroomName ? 1 : -1;
}

function ChatroomLinksItem({
	chatroomName,
	handleSelect,
}: {
	chatroomName: ChatRoomType;
	handleSelect: () => void;
}) {
	const isMobile = useIsMobile();
	const { toggleSidebar } = useSidebar();
	const { pk_chats_id, chat_name } = chatroomName;

	return (
		<Link
			to={`/chats/${pk_chats_id}`}
			onClick={() => {
				if (isMobile) toggleSidebar();
			}}
		>
			<CommandItem
				value={pk_chats_id}
				onSelect={handleSelect}
				className=" cursor-pointer !w-full hover:!bg-[#4c4c52]"
			>
				{chat_name ?? ""}
			</CommandItem>
		</Link>
	);
}

const ChatroomLinks = memo(function ChatroomLinks({ data, handleSelect }: ChatroomLinksProps) {
	if (!data.length) return null;

	return data
		.sort(sortData)
		.map((chatroomName) => (
			<ChatroomLinksItem
				key={chatroomName.chat_name}
				chatroomName={chatroomName}
				handleSelect={handleSelect}
			/>
		));
});

ChatroomLinks.displayName = "ChatroomLinks";

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

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button
					size="icon"
					role="combobox"
					variant="outline"
					className="border-0 p-0 bg-transparent  hover:bg-[#2f2f2f]"
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
				<Command className="p-0 border ">
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
							{data?.length ? (
								<ChatroomLinks data={data} handleSelect={handleSelect} />
							) : null}
						</CommandGroup>
					</CommandList>
				</Command>
			</DialogContent>
		</Dialog>
	);
}
