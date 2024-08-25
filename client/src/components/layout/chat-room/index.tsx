import { useQuery } from "@tanstack/react-query";
import { getBearer } from "../../../lib/utils";
import { useParams } from "react-router";
import { Loader } from "../../loader";
import { MessageInput } from "./chat-room-message-input";
import { ChatRoomHeader } from "./chat-room-header";
import { ChatRoomSection } from "./chat-room-section";

function ChatRoomLayout() {
	const { chatId } = useParams();

	const { isPending, data, isFetching } = useQuery({
		queryKey: [chatId], // Makes another call when chatId changes
		queryFn: async () => {
			const response = await fetch(`http://localhost:3010/chats/${chatId}`, {
				headers: {
					Authorization: getBearer(),
				},
			});
			return await response.json();
		},
	});

	if (isFetching ?? isPending) {
		return <Loader />;
	}

	if (data.error) {
		return <p>Error</p>;
	}
	const roomName = data?.msg?.[0]?.chats?.chat_name ?? "";

	return (
		<section className="h-screen overflow-y-hidden grid grid-rows-[1fr_11fr_1fr]">
			<ChatRoomHeader roomName={roomName} />
			<ChatRoomSection data={data?.msg ?? []} />
			{chatId && chatId.length > 0 ? (
				<MessageInput chatId={chatId} chatName={roomName} />
			) : null}
		</section>
	);
}

export default ChatRoomLayout;
