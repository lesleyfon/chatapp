import { TriangleAlert } from "lucide-react";
import { ErrorResponse, SuccessResponse } from "../../../api/http-methods";
import { SocketProvider } from "../../../context/socket.context";
import useRoomData from "../../../hooks/useRoomData";
import { Loader } from "../../loader";
import { MessageInput } from "./chat-room-message-input";
import { ChatRoomSection } from "./chat-room-section";
import { PrivateMessageSection } from "./private-chat-section";

function isErrorResponse(
  data: ErrorResponse | SuccessResponse,
): data is ErrorResponse {
  return "error" in data;
}

function ChatRoomLayout() {
  const { loadingState, chatData, recipientData, chatId, recipientId } =
    useRoomData();

  if (loadingState) {
    return <Loader />;
  }

  if (
    (chatData && isErrorResponse(chatData)) ||
    (recipientData && isErrorResponse(recipientData))
  ) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <h2 className="flex items-center justify-center text-red-500 text-8xl">
          404 <TriangleAlert className="w-24 h-24" />
        </h2>
        <p className="flex items-center justify-center text-red-500 text-2xl">
          Chat Room Not Found
        </p>
      </div>
    );
  }

  if (recipientData?.msg && recipientData.msg.length >= 0 && recipientId) {
    const data = recipientData?.msg ?? [];
    const recipientsName =
      data.find(({ chat_user }) => String(chat_user?.pk_user_id) === "4")
        ?.chat_user?.name ?? "";
    return (
      <section className="overflow-y-hidden grid grid-rows-[12fr_1fr] md:grid-rows-[11fr_1fr] ">
        <PrivateMessageSection data={data ?? []} />
        <MessageInput
          chatId={recipientId}
          chatName={recipientsName}
          isPrivateChat
        />
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

const ChatRoomLayoutWithSocketProvider = () => {
  return (
    <SocketProvider>
      <ChatRoomLayout />
    </SocketProvider>
  );
};

export default ChatRoomLayoutWithSocketProvider;
