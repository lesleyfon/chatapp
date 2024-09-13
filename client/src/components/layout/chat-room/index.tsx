import { useQuery } from "@tanstack/react-query";
import api from "./../../../api/httpMethods";
import { useParams } from "react-router";
import { Loader } from "../../loader";
import { MessageInput } from "./chat-room-message-input";
import { ChatRoomSection } from "./chat-room-section";

function ChatRoomLayout() {
	const { chatId } = useParams();

	const { isPending, data, isFetching } = useQuery({
		queryKey: [chatId], // Makes another call when chatId changes
		queryFn: chatId ? () => api.fetchChatListsDataFromChatId(chatId) : undefined,
	});

	if (isFetching ?? isPending) {
		return <Loader />;
	}

	if (data.error) {
		return <p>Error</p>;
	}
	const roomName = data?.msg?.[0]?.chats?.chat_name ?? "";

	return (
		<section className="overflow-y-hidden grid grid-rows-[12fr_1fr] md:grid-rows-[11fr_1fr] ">
			<ChatRoomSection data={data?.msg ?? []} />
			{chatId && chatId.length > 0 ? (
				<MessageInput chatId={chatId} chatName={roomName} />
			) : null}
		</section>
	);
}

export default ChatRoomLayout;
