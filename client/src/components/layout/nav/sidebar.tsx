import React, { useCallback, useMemo } from "react";
import { cn, timeDifference } from "../../../lib/utils";
import { Avatar } from "../../ui/avatar";
import { Link, useLocation } from "react-router-dom";
import { PrivateChatResultType, type ChatListType, type SidebarProps } from "../../../types";
import { useGetChatList } from "../../../hooks/useGetChatList";
import { useGetPrivateMessageList } from "../../../hooks/useGetPrivateMessageList";
import { JoinRoom } from "../../join-room";
import { Plus, User } from "lucide-react";
import { Sidebar, SidebarContent, SidebarHeader, useSidebar } from "../../ui/sidebar";
import { SearchPrivateRoom } from "../../join-room/search-private-room";
import { Button } from "../../ui/button";

const MESSAGE_TEXT_MAX_WIDTH = "md:max-w-[110px]";
const HOVER_BG_COLOR = "hover:!bg-[#4c4c52]";

const SidebarItemLink = React.memo(({ chatData }: { chatData: ChatListType[0] }) => {
	const location = useLocation();
	const currentPath = location.pathname;
	const to = `/chats/${chatData.chats?.pk_chats_id}`;
	const isActivePath = currentPath === to;

	return (
		<Link
			to={to}
			className={cn(
				"flex items-center gap-3 rounded-md p-2 text-sm font-medium transition-colors hover:bg-muted from-neutral-200",
				HOVER_BG_COLOR,
				isActivePath ? "bg-slate-200 hover:!bg-slate-200 text-black rounded-[0.5rem]" : ""
			)}
		>
			<Avatar className="h-8 w-8 border flex content-center justify-center items-center">
				<User />
			</Avatar>
			<div className="flex-1 truncate">
				<div
					className={cn(
						`from-neutral-100 font-bold text-xs truncate`,
						MESSAGE_TEXT_MAX_WIDTH
					)}
				>
					{chatData.chats?.chat_name}
				</div>
				{chatData.messages ? (
					<div className="md:flex grid grid-cols-[10fr_2fr] gap-2 items-center">
						<p
							className={cn(
								` truncate w-full text-xs text-ellipsis overflow-hidden md:block text-left`,
								MESSAGE_TEXT_MAX_WIDTH
							)}
						>
							{chatData.messages.message_text}
						</p>
						<p className="text-[10px] text-muted-foreground">
							{timeDifference(chatData.messages.sent_at)}
						</p>
					</div>
				) : null}
			</div>
		</Link>
	);
});

SidebarItemLink.displayName = "SidebarItemLink";

const SidebarPrivateMessageLink = React.memo(({ data }: { data: PrivateChatResultType }) => {
	const location = useLocation();
	const currentPath = location.pathname;
	const to = `/private-chats/${data.recipient.pk_user_id}`;
	const isActivePath = currentPath === to;

	return (
		<Link
			to={to}
			className={cn(
				"flex items-center gap-3 rounded-md p-2 text-sm font-medium transition-colors hover:bg-muted from-neutral-200",
				HOVER_BG_COLOR,
				isActivePath ? "bg-slate-200 hover:!bg-slate-200 text-black rounded-[0.5rem]" : ""
			)}
		>
			<Avatar className="h-8 w-8 border flex content-center justify-center items-center">
				<User />
			</Avatar>
			<div className="flex-1 truncate">
				<div
					className={cn(
						`from-neutral-100 font-bold text-xs truncate`,
						MESSAGE_TEXT_MAX_WIDTH
					)}
				>
					{data.recipient?.name}
				</div>
				{data.private_messages ? (
					<div className="md:flex grid grid-cols-[10fr_2fr] gap-2 justify-between items-center">
						<p
							className={cn(
								`truncate w-full text-xs text-ellipsis overflow-hidden md:block text-left`,
								MESSAGE_TEXT_MAX_WIDTH
							)}
						>
							{data.private_messages.message_text}
						</p>
						<p className="text-[10px] text-muted-foreground text-right ">
							{timeDifference(data.private_messages.sent_at)}
						</p>
					</div>
				) : null}
			</div>
		</Link>
	);
});

SidebarPrivateMessageLink.displayName = "SidebarPrivateMessageLink";

function ChannelsSection({ renderedChats }: { renderedChats: React.ReactNode }) {
	return (
		<section aria-label="Channels">
			<h1 className="text-center font-bold text-l">Channels</h1>
			<div className="grid gap-1 p-2">{renderedChats}</div>
		</section>
	);
}

function PrivateMessagesSection({ renderedPrivateData }: { renderedPrivateData: React.ReactNode }) {
	return (
		<section aria-label="Private Messages">
			<h1 className="text-center font-bold text-l">Private Message</h1>
			<div className="grid gap-1 p-2">{renderedPrivateData}</div>
			<SearchPrivateRoom
				triggerChild={
					<Button
						size="icon"
						role="combobox"
						className={cn(
							"flex items-center justify-center p-4 gap-2 hover:bg-muted from-neutral-200 w-full",
							HOVER_BG_COLOR
						)}
					>
						<span>New Private Chat</span>
						<Plus className="h-5 w-5" />
						<span className="sr-only">Search room</span>
					</Button>
				}
			/>
		</section>
	);
}

export default function SidebarWrapper({ className }: SidebarProps) {
	const { chatroomList } = useGetChatList();
	const { privateRoomList } = useGetPrivateMessageList();
	const { isMobile, setOpenMobile, open } = useSidebar();

	const renderedChats = useMemo(() => {
		if (chatroomList.length === 0) {
			return (
				<div className="flex flex-col items-center gap-4 p-4">
					<h3 className="text-muted-foreground">No channels joined yet</h3>
					<JoinRoom />
				</div>
			);
		}
		return chatroomList.map(
			(chatData) =>
				chatData.messages && (
					<SidebarItemLink chatData={chatData} key={chatData.messages.id} />
				)
		);
	}, [chatroomList]);

	const renderedPrivateData = useMemo(() => {
		if (privateRoomList.length === 0) {
			return (
				<div className="flex flex-col items-center gap-2 p-4">
					<h3 className="text-muted-foreground">No direct messages yet</h3>
					<p className="text-xs text-center text-muted-foreground">
						Use the button below to start a conversation
					</p>
				</div>
			);
		}
		return privateRoomList.map(
			(data) =>
				data.private_messages && (
					<SidebarPrivateMessageLink
						data={data}
						key={data.private_chat.pk_private_chat_id}
					/>
				)
		);
	}, [privateRoomList]);

	const handleCloseDialogOnMobileView = useCallback(() => {
		if (isMobile) {
			setOpenMobile(!open);
		}
	}, [isMobile, open, setOpenMobile]);

	return (
		<Sidebar side="left" className="dark h-screen">
			<SidebarHeader>
				<div className="sticky top-0 flex h-14 items-center justify-between px-4">
					<div className="font-semibold">Chats</div>
					<div>
						<JoinRoom />
					</div>
				</div>
			</SidebarHeader>
			<SidebarContent onClick={handleCloseDialogOnMobileView}>
				<section className={cn("w-full", className)}>
					<nav className="grid gap-1 p-2 grid-rows-2 h-screen">
						<ChannelsSection renderedChats={renderedChats} />
						<PrivateMessagesSection renderedPrivateData={renderedPrivateData} />
					</nav>
				</section>
			</SidebarContent>
		</Sidebar>
	);
}
