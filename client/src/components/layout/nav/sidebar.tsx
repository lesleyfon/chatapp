import React, { useMemo } from "react";
import { cn, timeDifference } from "../../../lib/utils";
import { Avatar } from "../../ui/avatar";
import { Link, useLocation } from "react-router-dom";
import { PrivateChatResultType, type ChatListType, type SidebarProps } from "../../../types";
import { useGetChatList, useGetPrivateMessageList } from "../../../hooks/useGetChatList";
import { JoinRoom } from "../../join-room";
import { User } from "lucide-react";

const SidebarItemLink = React.memo(({ chatData }: { chatData: ChatListType[0] }) => {
	const location = useLocation();
	const currentPath = location.pathname;
	const to = `/chats/${chatData.chats?.pk_chats_id}`;
	const isActivePath = currentPath === to;
	return (
		<Link
			to={to}
			className={cn(
				"flex items-center gap-3 rounded-md p-2 text-sm font-medium transition-colors hover:bg-muted from-neutral-200 hover:!bg-[#4c4c52]",
				isActivePath ? "bg-slate-200 hover:!bg-slate-200 text-black rounded-[0.5rem]" : ""
			)}
		>
			<Avatar className="h-8 w-8 border flex content-center justify-center items-center">
				<User />
			</Avatar>
			<div className="flex-1 truncate">
				<div className="from-neutral-100 font-bold">{chatData.chats?.chat_name}</div>
				{chatData.messages && (
					<div className="md:flex grid grid-cols-[10fr_2fr] gap-2 items-center">
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
	);
});

const SidebarPrivateMessageLink = React.memo(({ data }: { data: PrivateChatResultType }) => {
	const location = useLocation();
	const currentPath = location.pathname;
	const to = `/private-chats/${data.private_chat.recipient_id}`;
	const isActivePath = currentPath === to;
	return (
		<Link
			to={to}
			className={cn(
				"flex items-center gap-3 rounded-md p-2 text-sm font-medium transition-colors hover:bg-muted from-neutral-200 hover:!bg-[#4c4c52]",
				isActivePath ? "bg-slate-200 hover:!bg-slate-200 text-black rounded-[0.5rem]" : ""
			)}
		>
			<Avatar className="h-8 w-8 border flex content-center justify-center items-center">
				<User />
			</Avatar>
			<div className="flex-1 truncate">
				<div className="from-neutral-100 font-bold">{data.chat_user.name}</div>
				{data.private_messages && (
					<div className="md:flex grid grid-cols-[10fr_2fr] gap-2 items-center">
						<p className=" truncate w-full text-xs text-ellipsis overflow-hidden md:block md:w-44 ">
							{data.private_messages.message_text}
						</p>
						<p className="text-xs text-muted-foreground">
							{timeDifference(data.private_messages.sent_at)}
						</p>
					</div>
				)}
			</div>
		</Link>
	);
});

export default function Sidebar({ className }: SidebarProps) {
	const { chatroomList } = useGetChatList();
	const { privateRoomList } = useGetPrivateMessageList();

	const renderedChats = useMemo(
		() =>
			chatroomList.map(
				(chatData) =>
					chatData.messages && (
						<SidebarItemLink chatData={chatData} key={chatData.messages.id} />
					)
			),
		[chatroomList]
	);
	const renderedPrivateData = useMemo(
		() =>
			privateRoomList.map(
				(data) =>
					data.private_messages && (
						<SidebarPrivateMessageLink
							data={data}
							key={data.private_chat.pk_private_chat_id}
						/>
					)
			),
		[privateRoomList]
	);

	return (
		<>
			<section className={className}>
				<div className="sticky top-0 flex h-14 items-center justify-between border-b px-4">
					<div className="font-semibold">Chats</div>
					<div>
						<JoinRoom />
					</div>
				</div>

				<nav className="grid gap-1 p-2 grid-rows-2">
					{chatroomList.length ? (
						<section className="grid gap-1 p-2">{renderedChats}</section>
					) : null}
					{privateRoomList.length ? <section>{renderedPrivateData}</section> : null}
				</nav>
			</section>
		</>
	);
}
