import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

import { cn, formatDate } from "../../../lib/utils";
import { Card, CardContent } from "../../ui/card";
import { ScrollArea } from "../../ui/scroll-area";
import { type RoomMessagesResponse } from "../../../types";

const scrollToBottom = (lastElemRef: React.MutableRefObject<null>) => {
	if (lastElemRef.current) {
		const messageSectionContainerRef = lastElemRef.current as HTMLElement;
		const lastChild = messageSectionContainerRef.lastElementChild;

		if (lastChild !== null) {
			lastChild.scrollIntoView();
		}
	}
};
export const ChatRoomSection = ({ data }: { data: [] }) => {
	const [allRoomMessages, setAllRoomMessages] = useState<RoomMessagesResponse[]>(data);
	const messageSectionContainerRef = useRef(null);

	useEffect(() => {
		scrollToBottom(messageSectionContainerRef);
	}, [allRoomMessages.length]);

	useEffect(() => {
		const token = localStorage.getItem("auth_token");
		const userId = localStorage.getItem("userId");
		const socket = io("http://localhost:3010/", {
			reconnectionDelay: 10000,
			timestampRequests: true,
			auth: { token },
			transports: ["websocket", "polling", "flashsocket"],
		});
		socket.on("add-message-response", (response: RoomMessagesResponse[]) => {
			setAllRoomMessages((previousRoomMessages) => {
				response = response.map((responseData) => {
					if (responseData.chat_user.pk_user_id.toString() === userId) {
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
		<ScrollArea className="flex-1 p-4">
			{allRoomMessages.length > 1 ? (
				<section ref={messageSectionContainerRef}>
					{allRoomMessages?.map((msgData: RoomMessagesResponse) => {
						const isSender = msgData.chat_user.sender === "You";
						return (
							<div
								key={msgData?.messages?.id}
								className={cn(
									"flex mb-4",
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
											{msgData.chat_user.name}
										</div>
										<p>{msgData.messages?.message_text}</p>
										<div className="text-[10px] text-muted-foreground mt-1">
											{formatDate(msgData.messages.sent_at)}
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
