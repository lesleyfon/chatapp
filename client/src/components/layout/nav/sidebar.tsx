import React, { memo } from "react";
import { cn, timeDifference } from "../../../lib";
import { Avatar } from "../../ui/avatar";
import { Link, useLocation } from "react-router-dom";
import {
	type SidebarProps,
	type SidebarItemLinkProps,
	type PrivateChatResultType,
	type ChatListType,
} from "../../../types";
import { useGetChatList } from "../../../hooks/useGetChatList";
import { useGetPrivateMessageList } from "../../../hooks/useGetPrivateMessageList";
import { JoinRoom } from "../../join-room";
import { Sidebar, SidebarContent, SidebarHeader } from "../../ui/sidebar";
import { SearchPrivateRoom } from "../../join-room/search-private-room";
import { Button } from "../../ui/button";
import { SIDEBAR_CONSTANTS } from "../../constants";
import { useMobileSidebar } from "../../../hooks/useMobileSidebar";
import { useSocket } from "../../../hooks/useSocket";
import { SocketProvider } from "../../../context/socket.context";
import useAuthStorage from "../../../store/useAuthStorage";
import { ScrollArea } from "../../ui/scroll-area";

export const SidebarItemLink = React.memo(({ data }: { data: SidebarItemLinkProps }) => {
	const location = useLocation();
	const currentPath = location.pathname;
	const isActivePathLinkItem = currentPath === data.to;
	const Icon = SIDEBAR_CONSTANTS.ICON_MAP[data.itemType];
	const sentAt = timeDifference(data?.message?.sent_at?.toString());
	return (
		<Link
			to={data.to}
			className={cn(
				"flex items-center gap-3 p-2 text-sm font-medium transition-colors hover:bg-muted from-neutral-200",
				SIDEBAR_CONSTANTS.HOVER_BG_COLOR,
				isActivePathLinkItem ? "bg-slate-200 hover:!bg-slate-200 text-black" : ""
			)}
		>
			<Avatar className="h-8 w-8 border flex content-center justify-center items-center">
				<Icon />
			</Avatar>
			<div className="flex-1 truncate">
				<div
					className={cn(
						`from-neutral-100 font-bold text-xs truncate`,
						SIDEBAR_CONSTANTS.MESSAGE_TEXT_MAX_WIDTH
					)}
				>
					{data.linkTitle}
				</div>
				{data.message ? (
					<div className="md:flex grid grid-cols-[10fr_2fr] gap-2 justify-between items-center">
						<p
							className={cn(
								`truncate w-full text-xs text-ellipsis overflow-hidden md:block text-left`,
								SIDEBAR_CONSTANTS.MESSAGE_TEXT_MAX_WIDTH
							)}
						>
							{data.message.message_text}
						</p>
						<p className="text-[10px] text-muted-foreground text-right ">{sentAt}</p>
					</div>
				) : null}
			</div>
		</Link>
	);
});
SidebarItemLink.displayName = "SidebarLinkItem";

function ChannelsSection({ children }: { children: React.ReactNode }) {
	return (
		<section aria-label="Chat channels" className="h-1/2 flex flex-col">
			<h1 className="text-center font-bold text-l pt-4">Channels</h1>
			<ScrollArea className="flex-1 w-full">
				<div className="space-y-1 p-2">{children}</div>
			</ScrollArea>
		</section>
	);
}
ChannelsSection.displayName = "ChannelsSection";

function PrivateMessagesSection({ children }: { children: React.ReactNode }) {
	return (
		<section aria-label="Private Messages" className="h-[90%] flex flex-col">
			<h1 className="text-center font-bold text-l pt-4">Private Message</h1>
			<ScrollArea className="flex-1 w-full">
				<div className="space-y-1 p-2">{children}</div>
			</ScrollArea>
			<SearchPrivateRoom
				triggerChild={
					<Button
						size="icon"
						role="combobox"
						className={cn(
							"flex items-center justify-center p-4 gap-2 hover:bg-muted from-neutral-200 w-full",
							SIDEBAR_CONSTANTS.HOVER_BG_COLOR
						)}
					>
						<span>New Private Chat</span>
						<SIDEBAR_CONSTANTS.ICON_MAP.Plus className="h-5 w-5" />
						<span className="sr-only">Search room</span>
					</Button>
				}
			/>
		</section>
	);
}
PrivateMessagesSection.displayName = "PrivateMessagesSection";

// SidebarHeader component
function SidebarWrapperHeader() {
	return (
		<SidebarHeader>
			<div className="sticky top-0 flex h-14 items-center justify-between px-4">
				<div className="font-semibold">Chats</div>
				<div>
					<JoinRoom />
				</div>
			</div>
		</SidebarHeader>
	);
}

const EmptyStateMessage = () => (
	<div className="flex flex-col items-center gap-2 p-4">
		<h3 className="text-muted-foreground">No direct messages yet</h3>
		<p className="text-xs text-center text-muted-foreground">
			Use the button below to start a conversation
		</p>
	</div>
);

const PrivateChatList = memo(({ data }: { data: PrivateChatResultType[] }) => {
	const userId = useAuthStorage((state) => state.userId);
	if (data?.length === 0) {
		return <EmptyStateMessage />;
	}

	return data.map((d) => {
		if (d.private_messages) {
			const isRecipient = d.recipient.pk_user_id === userId;
			const targetUser = isRecipient ? d.chat_user : d.recipient;

			return (
				<SidebarItemLink
					data={{
						to: `/private-chats/${targetUser.pk_user_id}`,
						linkTitle: targetUser.name as string,
						message: {
							message_text: d.private_messages.message_text as string,
							sent_at: d.private_messages.sent_at,
						},
						itemType: "User",
					}}
					key={d.private_chat.pk_private_chat_id}
				/>
			);
		}
	});
});
PrivateChatList.displayName = "PrivateChatList";

const ChatRoomList = memo(({ data }: { data: ChatListType }) => {
	if (data.length === 0) {
		return (
			<div className="flex items-center gap-2 p-4">
				<h3 className="text-muted-foreground">No channels joined yet</h3>
				<JoinRoom />
			</div>
		);
	}
	return data.map((d) =>
		d.messages ? (
			<SidebarItemLink
				data={{
					to: `/chats/${d.chats?.pk_chats_id}`,
					linkTitle: d.chats?.chat_name as string,
					itemType: "Users",
					message: {
						message_text: d.messages.message_text as string,
						sent_at: d.messages.sent_at,
					},
				}}
				key={d.messages.id}
			/>
		) : null
	);
});
ChatRoomList.displayName = "ChatRoomList";

function SidebarWrapper({ className }: SidebarProps) {
	const socket = useSocket();

	const { chatroomList } = useGetChatList({ socket });
	const { privateRoomList } = useGetPrivateMessageList({ socket });
	const { handleCloseDialogOnMobileView } = useMobileSidebar();

	return (
		<Sidebar side="left" className="dark h-screen">
			<SidebarWrapperHeader />
			<SidebarContent onClick={handleCloseDialogOnMobileView}>
				<section className={cn("w-full", className)}>
					<nav className="grid gap-1  grid-rows-2 h-[calc(100vh-3.5rem)]">
						<ChannelsSection>
							<ChatRoomList data={chatroomList} />
						</ChannelsSection>

						<PrivateMessagesSection>
							<PrivateChatList data={privateRoomList} />
						</PrivateMessagesSection>
					</nav>
				</section>
			</SidebarContent>
		</Sidebar>
	);
}

const SidebarWithProvider = ({ className }: { className?: string }) => {
	return (
		<SocketProvider>
			<SidebarWrapper className={cn("relative hidden h-full md:grid", className)} />
		</SocketProvider>
	);
};

export default SidebarWithProvider;
