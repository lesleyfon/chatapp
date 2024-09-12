import React, { useMemo } from "react";
import { timeDifference } from "../../../lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "../../ui/avatar";
import { Link } from "react-router-dom";
import { type ChatListType, type SidebarProps } from "../../../types";
import { useGetChatList } from "../../../hooks/useGetChatList";
import { JoinRoom } from "../../join-room";

const SidebarItemLink = React.memo(({ chatData }: { chatData: ChatListType[0] }) => (
	<Link
		to={`/chats/${chatData.chats?.pk_chats_id}`}
		className="flex items-center gap-3 rounded-md p-2 text-sm font-medium transition-colors hover:bg-muted from-neutral-200"
	>
		<Avatar className="h-8 w-8 border">
			<AvatarImage
				src="https://generated.vusercontent.net/placeholder-user.jpg"
				alt={`${chatData.chat_user.name}'s avatar`}
			/>
			<AvatarFallback>{chatData.chat_user.name?.[0]}</AvatarFallback>
		</Avatar>
		<div className="flex-1 truncate">
			<div className="from-neutral-100 font-bold">{chatData.chats?.chat_name}</div>
			{chatData.messages && (
				<div className="flex gap-2 items-center">
					<p className=" truncate w-full text-xs text-ellipsis overflow-hidden md:block md:w-44 ">
						{chatData.messages.message_text}
					</p>
					<p className="text-xs text-muted-foreground">
						{timeDifference(chatData.messages.sent_at)}
					</p>
				</div>
			)}
		</div>
	</Link>
));

export default function Sidebar({ className }: SidebarProps) {
	const { chatroomList } = useGetChatList();

	const renderedChats = useMemo(
		() =>
			chatroomList.map(
				(chatData) => chatData.messages && <SidebarItemLink chatData={chatData} />
			),
		[chatroomList]
	);
	return (
		<section className={className}>
			<div className="sticky top-0 z-10 flex h-14 items-center justify-between border-b px-4">
				<div className="font-semibold">Chats</div>
				<JoinRoom />
			</div>

			<nav className="grid gap-1 p-2">{renderedChats}</nav>
		</section>
	);
}
