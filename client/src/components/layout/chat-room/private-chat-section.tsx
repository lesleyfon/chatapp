import { useEffect, useRef, useState } from "react";
import { set } from "lodash";
import { VList, VListHandle } from "virtua";

import { ScrollArea } from "../../ui/scroll-area";
import { Card, CardContent } from "../../ui/card";
import { PrivateChatResultType } from "../../../types";
import { cn, formatDate, scrollToBottom } from "../../../lib/utils";
import useAuthStorage from "../../../store/useAuthStorage";
import { useSocket } from "../../../hooks/useSocket";

function ConversationCard({ data, isSender }: { data: PrivateChatResultType; isSender: boolean }) {
	return (
		<div
			key={data?.private_messages.id}
			className={cn("flex py-4 ", isSender ? "justify-end" : "justify-start")}
		>
			<Card className={cn("max-w-[70%]", isSender ? "bg-slate-300 text-black" : "")}>
				<CardContent className="p-3">
					<div
						className={cn(
							"text-sm font-semibold mb-1",
							isSender ? "text-primary-foreground" : "text-secondary-foreground"
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
}

export const PrivateMessageSection = ({ data }: { data: PrivateChatResultType[] }) => {
	const [allRoomMessages, setAllRoomMessages] = useState<PrivateChatResultType[]>([]);
	const messageSectionContainerRef = useRef(null);

	const vListRef = useRef<VListHandle>(null);
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

	const socket = useSocket();

	useEffect(() => {
		if (socket?.connected === false) socket?.connect();

		socket?.on("add-private-message-response", (response: PrivateChatResultType) => {
			setAllRoomMessages((previousRoomMessages) => {
				if (String(response.chat_user.pk_user_id) === String(userId)) {
					set(response, "responseData?.chat_user?.pk_user_id", "You");
				}
				return [...previousRoomMessages, response];
			});
			if (vListRef.current) {
				// TODO: figure out why its not scrolling all the way to the bottom.
				const scrollIndex = Infinity;
				const virtualizer = vListRef.current;
				virtualizer.scrollToIndex(scrollIndex, {
					smooth: true,
					align: "start",
				});
			}
		});
		return () => {
			socket?.off("add-private-message-response");
		};
	}, [socket, userId]);

	const scrollAreaRef = useRef(null);
	const [scrollAreaHeight, setScrollAreaHeight] = useState(0);

	/**
	 * @description This effect is used to set the height of the scroll area.
	 */
	useEffect(() => {
		const setScrollArea = () => {
			if (scrollAreaRef.current) {
				const scrollArea = scrollAreaRef.current as HTMLElement;
				setScrollAreaHeight(scrollArea.clientHeight);
			}
		};

		if (scrollAreaRef.current) {
			setScrollArea();
		}
		if (typeof window === "undefined" || !scrollAreaRef?.current) {
			setScrollAreaHeight(800);
		}
		// Add event listener for window resize
		const controller = new AbortController();
		const signal = controller.signal;

		window.addEventListener("resize", setScrollArea, { signal });

		// cleanup function
		return () => {
			controller.abort();
		};
	}, [scrollAreaRef]);

	return (
		<>
			<ScrollArea className="flex-1 px-4" ref={scrollAreaRef}>
				{allRoomMessages.length > 0 ? (
					<section>
						<VList
							style={{ height: scrollAreaHeight, flexDirection: "column" }}
							ref={vListRef}
							count={allRoomMessages.length}
						>
							{allRoomMessages.map((data) => {
								const isSender =
									data?.chat_user?.pk_user_id.toString() === String(userId);
								return (
									<ConversationCard
										key={data?.private_messages.id}
										data={data}
										isSender={isSender}
									/>
								);
							})}
						</VList>
					</section>
				) : null}
			</ScrollArea>
		</>
	);
};
