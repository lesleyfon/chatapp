import { Buffer } from "buffer";
import { StatusCodes } from "http-status-codes";
import { Socket, Server as SocketIOServer } from "socket.io";
import { ExtendedError } from "socket.io/dist/namespace";
import { QueryHandlers } from "../model/QueryHandlers.model";
import { type CbType, type ChatListType, type JWT_RETURN_USER } from "../types";

export class AppSocketBase extends QueryHandlers {
  io: SocketIOServer;
  constructor(socket: SocketIOServer) {
    super();
    this.io = socket;
    this.io.use(this.socketAuthMiddleware);
  }

  socketAuthMiddleware = async (
    socket: Socket,
    next: (err?: ExtendedError) => void,
  ) => {
    const token = socket.handshake?.auth?.token;
    const decodedToken = await this.decodeJWT(token);

    if (decodedToken === undefined) {
      socket.disconnect();
      next(
        new Error(
          JSON.stringify({
            message: "Unknown error. Please try again",
            code: StatusCodes.INTERNAL_SERVER_ERROR,
          }),
        ),
      );
      return;
    }

    if (
      "code" in decodedToken &&
      decodedToken.code === StatusCodes.UNAUTHORIZED
    ) {
      next(new Error(JSON.stringify(decodedToken)));
      return;
    }
    next();
  };

  async getAUserChatList(socket: Socket) {
    const token = socket.handshake.auth?.token;
    const user = (await this.decodeJWT(token)) as JWT_RETURN_USER;

    if (!user) return;
    const userId = user.userId;
    socket.on("get-chat-list", async (cb: CbType) => {
      const chatList: ChatListType[] =
        await this.selectUserChatRoomsWithLastSetMessages(userId);

      cb(chatList);
    });
  }
  async getPrivateMessageList(socket: Socket) {
    const token = socket.handshake.auth?.token;
    const user = (await this.decodeJWT(token)) as JWT_RETURN_USER;
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
  private emitAddMessageErrorResponse(
    chatName: string | null,
    message: string,
  ) {
    const response = {
      data: null,
      error: true,
      message: message,
      chats: { chatName },
    };
    if (chatName) {
      this.io.to(chatName).emit("add-message-response", response);
    } else {
      this.io.emit("add-message-response", response);
    }
  }

  addMessageToRoom(socket: Socket) {
    socket.on(
      "add-message",
      async (data: {
        chatName: string;
        message: string;
        senderId: string;
        sent_at: string;
        timezone: string;
      }) => {
        const { chatName, message, sent_at, timezone } = data;
        const token = socket.handshake.auth?.token;
        const user = (await this.decodeJWT(token)) as JWT_RETURN_USER;

        this.io.socketsJoin(chatName);

        if (!chatName) {
          return this.emitAddMessageErrorResponse(
            null,
            "Chat name cannot be empty",
          );
        }
        if (!message) {
          return this.emitAddMessageErrorResponse(
            chatName,
            "Message cannot be empty",
          );
        }
        if (!sent_at || !timezone) {
          return this.emitAddMessageErrorResponse(
            chatName,
            "sent_at and timezone cannot be empty",
          );
        }
        if (!user) {
          return this.emitAddMessageErrorResponse(chatName, "User not found");
        }

        const userId = user.userId;

        const chatExist = await this.selectChatByChatName(chatName);

        if (chatExist.length === 0) {
          // Create a new room
          const insertIntoChatResponse = await this.createNewChatRoom({
            chatName,
            created_at: sent_at,
            timezone: timezone,
          });

          const chatId = insertIntoChatResponse[0].id;
          console.log({sent_at, timezone})
          // Add message to the message table - refactor this
          const messageResponse = await this.insertMessageToTable({
            chatId,
            user_id: userId,
            message,
            sent_at,
            timezone,
          });
          const chatExist = await this.selectChatByChatName(chatName);

          const addMessageResponse = messageResponse.map((message) => ({
            ...message,
            chats: chatExist[0],
          }));
          const chatList = await this.getLatestChatRoomMessageSent(
            userId,
            chatId,
          );

          this.io.to(chatName).emit("get-latest-chat-room-message", chatList);
          this.io.to(chatName).emit("add-message-response", addMessageResponse);
          return;
        }

        const chatId = chatExist[0].pk_chats_id;
        const messageInsertResponse = await this.insertMessageToTable({
          chatId,
          user_id: userId,
          message,
          sent_at,
          timezone,
        });
        const messageResponse = await this.getMostRecentChatMessageSent(
          messageInsertResponse,
        );

        // Emit message to other users
        const addMessageResponse = messageResponse.map((message) => ({
          ...message,
          chats: chatExist[0],
        }));

        // Emitter
        this.io.to(chatName).emit("add-message-response", addMessageResponse);

        const chatList = await this.getLatestChatRoomMessageSent(
          userId,
          chatId,
        );
        this.io.to(chatName).emit("get-latest-chat-room-message", chatList);
      },
    );
  }

  async addPrivateMessage(socket: Socket) {
    socket.on(
      "add-private-message",
      async ({
        recipientId,
        senderId,
        message,
        imageFile,
        imageName,
        created_at, 
        timezone
      }: {
        recipientId: number;
        senderId: number;
        message: string;
        created_at:string;
        timezone:string;
        imageFile?: Buffer;
        imageName?: string;
      }) => {
      
        if (!created_at || !timezone) {
          return this.emitAddMessageErrorResponse(
            null,
            "created_at and timezone cannot be empty",
          );
        }

        // Ensure that you do not return the passwords when selecting users
        const [sender, receiver] = (
          await this.getUserByUserIds({ userIdList: [senderId, recipientId] })
        ).flat();

        const privateChatsInsertResponse = (
          await this.createPrivateChatEntry(sender, receiver)
        )[0];

        const privateMessageInsertResponse = (
          await this.createPrivateMessage({
            privateChatsInsertResponse: {
              ...privateChatsInsertResponse,
              pk_private_chat_id: privateChatsInsertResponse.pk_private_chat_id,
              sender_id: privateChatsInsertResponse.sender_id,
              recipient_id: privateChatsInsertResponse.recipient_id,
            },
            senderId,
            message,
            imageFile,
            imageName,
            created_at,
            timezone,
          })
        )[0];

        if (privateMessageInsertResponse?.image_file) {
          // Convert Buffer to base64 string only if image_file exists and is a Buffer
          if (Buffer.isBuffer(privateMessageInsertResponse.image_file)) {
            const base64Image =
              privateMessageInsertResponse.image_file.toString("base64");
            // Cast to any to avoid type error when assigning string to Buffer type
            (
              privateMessageInsertResponse as unknown as { image_file: string }
            ).image_file = base64Image;
          }
        }

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
            image_file: privateMessageInsertResponse.image_file,
            image_name: privateMessageInsertResponse.image_name,
            timezone: privateMessageInsertResponse.timezone,
          },
          recipient: {
            pk_user_id: receiver.pk_user_id,
            name: receiver.name,
            email: receiver.email,
          },
        };

        this.io.emit(
          "add-private-message-response",
          addPrivateMessageSocketResponse,
        );
        // Emits an event to display the most recent message sent
        this.io.emit(
          "get-latest-private-message-sent",
          addPrivateMessageSocketResponse,
        );
      },
    );
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
