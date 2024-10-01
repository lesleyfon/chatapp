import { useEffect, useRef, useState } from "react";
import { set } from "lodash";

import { ScrollArea } from "../../ui/scroll-area";
import { Card, CardContent } from "../../ui/card";
import { PrivateChatResultType } from "../../../types";
import { useSocketInstance } from "../../../api/sockets";
import { cn, formatDate, scrollToBottom } from "../../../lib/utils";
import useAuthStorage from "../../../store/useAuthStorage";

export const PrivateMessageSection = ({ data }: { data: PrivateChatResultType[] }) => {
	const [allRoomMessages, setAllRoomMessages] = useState<PrivateChatResultType[]>([]);
	const messageSectionContainerRef = useRef(null);
	const userId = useAuthStorage((state) => state.userId);

	useEffect(() => {
		if (!data?.length) {
			return;
		}
		setAllRoomMessages(data);
	}, [data]);

	useEffect(() => {
		scrollToBottom(messageSectionContainerRef);
	}, [allRoomMessages.length]);

	const socket = useSocketInstance();
	useEffect(() => {
		if (socket?.connected === false) socket?.connect();

		socket?.on("add-private-message-response", (response: PrivateChatResultType) => {
			setAllRoomMessages((previousRoomMessages) => {
				if (String(response.chat_user.pk_user_id) === String(userId)) {
					set(response, "responseData?.chat_user?.pk_user_id", "You");
				}
				return [...previousRoomMessages, response];
			});
		});
		return () => {
			socket?.disconnect();
		};
	});

	return (
		<ScrollArea className="flex-1 px-4">
			{allRoomMessages.length > 0 ? (
				<section ref={messageSectionContainerRef}>
					{allRoomMessages.map((data) => {
						const isSender = data?.chat_user?.pk_user_id.toString() === String(userId);
						return (
							<div
								key={data?.private_messages.id}
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
											{data?.chat_user.name}
										</div>
										<p>{data?.private_messages?.message_text as string}</p>
										<div className="text-[10px] text-muted-foreground mt-1">
											{formatDate(data.private_messages.sent_at)}
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
