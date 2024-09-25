import { Loader } from "../../loader";
import { MessageInput } from "./chat-room-message-input";
import { ChatRoomSection } from "./chat-room-section";
import { PrivateMessageSection } from "./private-chat-section";
import useRoomData from "../../../hooks/useRoomData";

function ChatRoomLayout() {
	const { loadingState, chatData, recipientData, chatId, recipientId } = useRoomData();
	if (loadingState) {
		return <Loader />;
	}

	if (chatData?.error) {
		return <p>Error</p>;
	}

	if (recipientData?.msg.length && recipientId) {
		const data = recipientData.msg ?? [];
		const recipientsName =
			data.find(({ chat_user }) => String(chat_user?.pk_user_id) === "4")?.chat_user?.name ??
			"";
		return (
			<section className="overflow-y-hidden grid grid-rows-[12fr_1fr] md:grid-rows-[11fr_1fr] ">
				<PrivateMessageSection data={data ?? []} />
				<MessageInput chatId={recipientId} chatName={recipientsName} isPrivateChat />
			</section>
		);
	}
	const roomName = chatData?.msg?.[0]?.chats?.chat_name ?? "";
	return (
		<section className="overflow-y-hidden grid grid-rows-[12fr_1fr] md:grid-rows-[11fr_1fr] ">
			<ChatRoomSection data={chatData?.msg ?? []} />
			{chatId && chatId.length > 0 ? (
				<MessageInput chatId={chatId} chatName={roomName} />
			) : null}
		</section>
	);
}

export default ChatRoomLayout;
