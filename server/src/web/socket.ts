import { Socket, Server as SocketIOServer } from "socket.io";
import { QueryHandlers } from "../model/QueryHandlers.model";
import { type ChatListType } from "../model/QueryHandlers.model";


type CbType = (chatList: ChatListType) => void

export class AppSocketBase extends QueryHandlers {
  io: SocketIOServer;
  constructor(socket: SocketIOServer) {
    super();
    this.io = socket;
  }


  async getAUserChatList(socket: Socket) {
    const token = socket.handshake.auth?.token;
    const user = await this.decodeJWT(token);

    if (!user) return;
    const userId = user.userId;
    socket.on("get-chat-list", async (cb: CbType) => {

      const chatList: ChatListType = await this.selectUserChatRoomsWithLastSetMessages(userId);

      cb(chatList);
    });
  }
  async getPrivateMessageList(socket: Socket) {
    const token = socket.handshake.auth?.token;
    const user = await this.decodeJWT(token);
    if (!user) return;
    const userId = user.userId;
    socket.on("get-private-message-list", async (cb) => {
      const chatList = await this.getLatestPrivateChatMessagesSent({ userId });
      cb(chatList);
    });
  }

  /**
   * The function `emitAddMessageErrorResponse` sends an error response message to a specific chat room
   * or to all connected clients.
   * @param {string | null} chatName - The `chatName` parameter is a string that represents the name of
   * the chat room where the message is being added. It can also be `null` if the message is not
   * associated with any specific chat room.
   * @param {string} message - The `message` parameter in the `emitAddMessageErrorResponse` function is
   * a string that represents the error message to be included in the response object. This message will
   * be sent back to the client when emitting the "add-message-response" event.
   */
  private emitAddMessageErrorResponse(chatName: string | null, message: string) {
    const response = {
      data: null,
      error: true,
      message: message,
      chats: { chatName }
    };
    if (chatName) {
      this.io.to(chatName).emit("add-message-response", response);
    } else {
      this.io.emit("add-message-response", response);
    }
  }


  addMessageToRoom(socket: Socket) {
    socket.on("add-message", async (data: { chatName: string; message: string, senderId: string }) => {

      const { chatName, message } = data;
      const token = socket.handshake.auth?.token;
      const user = await this.decodeJWT(token);

      this.io.socketsJoin(chatName);

      if (!chatName) {
        return this.emitAddMessageErrorResponse(null, "Chat name cannot be empty");
      }
      if (!message) {
        return this.emitAddMessageErrorResponse(chatName, "Message cannot be empty");

      }
      if (!user) {
        return this.emitAddMessageErrorResponse(chatName, "User not found");
      }

      const userId = user.userId;

      const chatExist = await this.selectChatByChatName(chatName);

      if (chatExist.length === 0) {
        // Create a new room
        const insertIntoChatResponse = await this.createNewChatRoom(chatName);

        const chatId = insertIntoChatResponse[0].id;

        // Add message to the message table - refactor this
        const messageResponse = await this.insertMessageToTable(chatId, userId, message);
        const chatExist = await this.selectChatByChatName(chatName);

        const addMessageResponse = messageResponse.map(message => ({
          ...message,
          chats: chatExist[0],
        }));
        const chatList = await this.getLatestChatRoomMessageSent(userId, chatId);

        this.io.to(chatName).emit("get-latest-chat-room-message", chatList);
        this.io.to(chatName).emit("add-message-response", addMessageResponse);
        return;
      }

      const chatId = chatExist[0].pk_chats_id;
      const messageInsertResponse = await this.insertMessageToTable(chatId, userId, message);
      const messageResponse = await this.getMostRecentChatMessageSent(messageInsertResponse);

      // Emit message to other users
      const addMessageResponse = messageResponse.map(message => ({
        ...message,
        chats: chatExist[0],
      }));

      const chatList = await this.getLatestChatRoomMessageSent(userId, chatId);

      // Emitter
      this.io.to(chatName).emit("add-message-response", addMessageResponse);
      this.io.to(chatName).emit("get-latest-chat-room-message", chatList);
    });
  }

  async addPrivateMessage(socket: Socket) {
    socket.on('add-private-message', async ({ recipientId, senderId, message
    }: { recipientId: string, senderId: string, message: string }) => {

      // Ensure that you do not return the passwords when selecting users
      const [sender, receiver] = (await this.getUserByUserIds({ userIdList: [senderId, recipientId] })).flat();


      const privateChatsInsertResponse = (await this.createPrivateChatEntry(sender, receiver))[0];

      const privateMessageInsertResponse = (await this.createPrivateMessage(privateChatsInsertResponse, senderId, message))[0];


      const addPrivateMessageSocketResponse = {
        private_chat: {
          pk_private_chat_id: privateChatsInsertResponse.pk_private_chat_id,
          sender_id: privateChatsInsertResponse.sender_id,
          recipient_id: privateChatsInsertResponse.recipient_id,
          created_at: privateChatsInsertResponse.created_at,
        },
        chat_user: {
          pk_user_id: sender.pk_user_id,
          name: sender.name,
          email: sender.email,
          created_at: sender.created_at,
        },
        private_messages: {
          id: privateMessageInsertResponse.id,
          fk_private_chat_id: privateMessageInsertResponse.fk_private_chat_id,
          fk_user_id: privateMessageInsertResponse.fk_user_id,
          message_text: privateMessageInsertResponse.message_text,
          sent_at: privateMessageInsertResponse.sent_at,
        },
        recipient: {
          pk_user_id: receiver.pk_user_id,
          name: receiver.name,
          email: receiver.email,
        }
      };
      
      this.io.emit("add-private-message-response", addPrivateMessageSocketResponse);
      // Emits an event to display the most recent message sent
      this.io.emit("get-latest-private-message-sent", addPrivateMessageSocketResponse);
    });
  }
  socketEvents() {
    this.io.on("connection", (socket) => {
      this.addMessageToRoom(socket);
      this.addPrivateMessage(socket);
      this.getAUserChatList(socket);
      this.getPrivateMessageList(socket);
    });
  }

  connectToRooms(socket: SocketIOServer) {
    socket.to(["person-1", "person-1"]);
  }
}