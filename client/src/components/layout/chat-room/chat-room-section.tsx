import React, { useEffect, useRef } from "react";

import { cn, formatDate, scrollToBottom } from "../../../lib/utils";
import { Card, CardContent } from "../../ui/card";
import { ScrollArea } from "../../ui/scroll-area";
import { type RoomMessagesResponse } from "../../../types";
import { useLocation } from "react-router";
import { useSocketInstance } from "../../../api/sockets";
import useAuthStorage from "../../../store/useAuthStorage";

export const ChatRoomSection = ({ data }: { data: [] }) => {
	const [allRoomMessages, setAllRoomMessages] = React.useState<RoomMessagesResponse[]>(data);
	const userId = useAuthStorage((state) => state.userId);
	const messageSectionContainerRef = useRef(null);
	const location = useLocation();
	const chatroomId = location.pathname.split("/").at(-1);

	useEffect(() => {
		scrollToBottom(messageSectionContainerRef);
	}, [allRoomMessages.length]);

	const socket = useSocketInstance();

	useEffect(() => {
		// If the socket is null, return early
		if (socket === null) return;
		// If the socket is not connected, connect it
		if (socket.connected === false) socket.connect();

		socket.on("add-message-response", (response: RoomMessagesResponse[]) => {
			//TODO: WHY AM I DOING THIS? WHAT HAPPENS IF YOU ONLY setAllRoomMessages IF THE CHATROOM_ID MATCHES?
			if (chatroomId?.toString() !== response?.[0]?.chats?.pk_chats_id?.toString()) {
				return;
			}

			setAllRoomMessages((previousRoomMessages) => {
				response = response.map((responseData) => {
					if (responseData?.chat_user?.pk_user_id.toString() === String(userId)) {
						responseData.chat_user.sender = "You";
					}
					return responseData;
				});
				return [...previousRoomMessages, ...response];
			});
		});

		return () => {
			socket.disconnect();
		};
	});

	return (
		<ScrollArea className="flex-1 px-4">
			{allRoomMessages.length > 0 ? (
				<section ref={messageSectionContainerRef}>
					{allRoomMessages.map((msgData: RoomMessagesResponse) => {
						// If the message text is empty, return null
						if (!msgData?.messages?.message_text) return null;

						const isSender = msgData?.chat_user?.sender === "You";

						return (
							<div
								key={msgData?.messages?.id}
								className={cn(
									"flex py-4 ",
									isSender ? "justify-end" : "justify-start"
								)}
							>
								<Card
									className={cn(
										"max-w-[70%] rounded-[0.2rem]",
										isSender ? "bg-slate-300 text-black" : ""
									)}
								>
									<CardContent className="p-3">
										<div
											className={cn(
												"text-sm font-semibold mb-1",
												isSender
													? "text-primary-foreground"
													: "text-secondary-foreground"
											)}
										>
											{msgData?.chat_user?.name}
										</div>
										<p>{msgData.messages?.message_text}</p>
										<div className="text-[10px] text-muted-foreground mt-1">
											{formatDate(msgData?.messages?.sent_at)}
										</div>
									</CardContent>
								</Card>
							</div>
						);
					})}
				</section>
			) : null}
		</ScrollArea>
	);
};
