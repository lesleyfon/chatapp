import * as Sentry from '@sentry/node';
import { StatusCodes } from 'http-status-codes';
import type { Socket, Server as SocketIOServer } from 'socket.io';

import type { ExtendedError } from 'socket.io/dist/namespace';
import { QueryHandlers } from '../model/query-handlers.model';
import type {
  AddPrivateMessageType,
  CbType,
  ChatListType,
  ImageFile,
  JWT_RETURN_USER,
  SocketErrorPayload,
} from '../types';
import { ObfuscatedChatKey } from '../utils/obfuscated-chat-key';

export class AppSocketBase extends QueryHandlers {
  io: SocketIOServer;
  constructor(socket: SocketIOServer) {
    super();
    this.io = socket;
    this.io.use(this.socketAuthMiddleware);

    this.io.engine.on('connection', (socket) => {
      socket.on('error', (error: Error) => {
        Sentry.captureException(error);
      });

      socket.on('disconnect', (reason: string) => {
        Sentry.captureException({
          message: 'User disconnected',
          reason,
          userId: socket.handshake.auth?.userId,
        });
      });
    });
  }

  socketAuthMiddleware = async (socket: Socket, next: (err?: ExtendedError) => void) => {
    const token = socket.handshake?.auth?.token;
    const decodedToken = await this.decodeJWT(token);

    if (decodedToken === undefined) {
      socket.disconnect();
      next(
        new Error(
          JSON.stringify({
            message: 'Unknown error. Please try again',
            code: StatusCodes.INTERNAL_SERVER_ERROR,
          }),
        ),
      );
      return;
    }

    if ('code' in decodedToken && decodedToken.code === StatusCodes.UNAUTHORIZED) {
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
    socket.on('get-chat-list', async (cb: CbType) => {
      const chatList: ChatListType[] = await this.selectUserChatRoomsWithLastSetMessages(userId);

      cb(chatList);
    });
  }
  async getPrivateMessageList(socket: Socket) {
    const token = socket.handshake.auth?.token;
    const user = (await this.decodeJWT(token)) as JWT_RETURN_USER;
    if (!user) return;
    const userId = user.userId;
    socket.on('get-private-message-list', async (cb) => {
      const chatList = await this.getLatestPrivateChatMessagesSent({ userId });
      cb(chatList);
    });
  }

  private buildError(params: {
    message: string;
    code: string;
    context: Record<string, unknown>;
  }): SocketErrorPayload {
    return {
      timestamp: Date.now(),
      severity: 'high',
      isRecoverable: false,
      retryable: false,
      ...params,
    };
  }

  /**
   * The function `emitSocketError` sends an error response message to all connected clients.
   */
  private emitSocketError({
    message,
    code,
    timestamp,
    severity,
    isRecoverable,
    retryable,
    context,
  }: Partial<SocketErrorPayload>) {
    // Log the error to Sentry
    Sentry.captureException(new Error(message), {
      extra: {
        code,
        timestamp,
        severity,
        isRecoverable,
        retryable,
        context,
      },
    });

    // Emit the error only to the originator
    this.io.emit('socket-error', {
      message,
      code,
      timestamp,
      severity,
      isRecoverable,
      retryable,
      context,
    });
  }

  addMessageToChannelRoom(socket: Socket) {
    socket.on(
      'add-message',
      async (data: {
        chatName: string;
        message: string;
        senderId: string;
        sent_at: string;
        timezone: string;
        imageFile?: ImageFile;
        imageName?: string;
      }) => {
        try {
          const { chatName, message, sent_at, timezone, imageFile, imageName } = data;
          const token = socket.handshake.auth?.token;
          const user = (await this.decodeJWT(token)) as JWT_RETURN_USER;

          if (!user || !user.userId) {
            return this.emitSocketError(
              this.buildError({
                message: 'User not found',
                code: 'USER_NOT_FOUND',
                context: {
                  roomId: chatName,
                  action: 'addMessageToChannelRoom',
                  metadata: {
                    sent_at,
                    timezone,
                    fullError: JSON.stringify(user),
                  },
                },
              }),
            );
          }

          if (!chatName) {
            return this.emitSocketError(
              this.buildError({
                message: 'Chat name cannot be empty',
                code: 'CHAT_NAME_EMPTY',
                context: {
                  userId: user?.userId,
                  roomId: chatName,
                  action: 'addMessageToChannelRoom',
                  metadata: {
                    sent_at,
                    timezone,
                  },
                },
              }),
            );
          }
          if (!message) {
            return this.emitSocketError(
              this.buildError({
                message: 'Message cannot be empty',
                code: 'MESSAGE_EMPTY',
                context: {
                  userId: user?.userId,
                  roomId: chatName,
                  action: 'addMessageToChannelRoom',
                  metadata: {
                    sent_at,
                    timezone,
                  },
                },
              }),
            );
          }
          if (!sent_at || !timezone) {
            return this.emitSocketError(
              this.buildError({
                message: 'sent_at and timezone cannot be empty',
                code: 'SENT_AT_TIMEZONE_EMPTY',
                context: {
                  userId: user?.userId,
                  roomId: chatName,
                  action: 'addMessageToChannelRoom',
                  metadata: {
                    sent_at,
                    timezone,
                  },
                },
              }),
            );
          }

          this.io.socketsJoin(chatName);

          const userId = user.userId;

          let chatRoom = await this.selectChatByChatName(chatName);

          if (chatRoom.length === 0) {
            // Create a new room
            chatRoom = await this.createNewChatRoom({
              chatName,
              created_at: sent_at,
              timezone: timezone,
            });
          }

          const chatRoomId = chatRoom[0].pk_chats_id;
          const messageInsertResponse = await this.insertMessageToChannelsTable({
            chatId: chatRoomId,
            user_id: userId,
            message,
            sent_at,
            timezone,
            imageFile: imageFile,
            imageName: imageName,
          });

          if ('error' in messageInsertResponse) {
            return this.emitSocketError(
              this.buildError({
                message: messageInsertResponse.reason,
                code: 'MESSAGE_INSERT_ERROR',
                context: {
                  userId: user?.userId,
                  roomId: chatName,
                  action: 'addMessageToChannelRoom',
                  fullError: JSON.stringify(messageInsertResponse, null, 2),
                  metadata: {
                    sent_at,
                    timezone,
                  },
                },
              }),
            );
          }

          const messageResponse = await this.getMostRecentChatMessageSent(messageInsertResponse);

          // Emit message to other users
          const addMessageResponse = messageResponse.map((message) => ({
            ...message,
            chats: chatRoom[0],
          }));

          // Emitter
          this.io.to(chatName).emit('add-message-response', addMessageResponse);

          const chatList = await this.getLatestChatRoomMessageSent(userId, chatRoomId);
          this.io.to(chatName).emit('get-latest-chat-room-message', chatList);
        } catch (error) {
          const { chatName, sent_at, timezone } = data;
          Sentry.captureException(error, {
            extra: {
              chatName,
              sent_at,
              timezone,
              method: 'addMessageToChannelRoom',
            },
          });
          this.emitSocketError(
            this.buildError({
              message: 'Failed to send message. Please try again.',
              code: 'MESSAGE_SEND_ERROR',
              context: {
                roomId: chatName,
                action: 'addMessageToChannelRoom',
                metadata: { sent_at, timezone },
                fullError: JSON.stringify(error, null, 2),
              },
            }),
          );
        }
      },
    );
  }

  addPrivateMessage(socket: Socket) {
    socket.on(
      'add-private-message',
      async ({
        senderId,
        message,
        imageFile,
        imageName,
        created_at,
        timezone,
        uniquePrivateChatKey,
      }: AddPrivateMessageType) => {
        try {
          if (!created_at || !timezone) {
            return this.emitSocketError(
              this.buildError({
                message: 'created_at and timezone cannot be empty',
                code: 'CREATED_AT_TIMEZONE_EMPTY',
                context: {
                  userId: senderId,
                  roomId: uniquePrivateChatKey,
                  action: 'addPrivateMessage',
                  metadata: { created_at, timezone },
                },
              }),
            );
          }
          const isNewPrivateChat = uniquePrivateChatKey.includes('new_private_chat');
          let uniquePrivateChatKeyCopy = uniquePrivateChatKey;
          const senderIdCopy = senderId;
          const timezoneCopy = timezone;
          const defaultChatEntry = {
            created_at: created_at,
            updated_at: created_at,
            timezone: timezoneCopy,
          };
          let recipientId: number;
          if (isNewPrivateChat) {
            recipientId = Number.parseInt(
              uniquePrivateChatKeyCopy.split('new_private_chat_').at(-1) as string,
            );
            uniquePrivateChatKeyCopy = ObfuscatedChatKey.getObfuscatedChatKey(
              recipientId,
              senderIdCopy,
            );
          } else {
            // Fetch the existing chat entry
            const privateChatEntry = await this.getPrivateChatEntryByUniquePrivateChatKey({
              uniquePrivateChatKey: uniquePrivateChatKeyCopy,
            });
            if (privateChatEntry.length === 0) {
              return this.emitSocketError(
                this.buildError({
                  message: 'Private chat not found',
                  code: 'PRIVATE_CHAT_NOT_FOUND',
                  context: {
                    userId: senderId,
                    roomId: uniquePrivateChatKey,
                    action: 'addPrivateMessage',
                    metadata: { created_at, timezone },
                  },
                }),
              );
            }
            const { user_a_id, user_b_id } = privateChatEntry[0];
            recipientId = user_a_id === senderIdCopy ? user_b_id : user_a_id;
          }

          const [[sender], [receiver]] = await this.getUserByUserIds({
            userAId: senderIdCopy,
            userBId: recipientId,
          });

          const privateChatsInsertResponse = await this.createPrivateChatEntry(
            { ...defaultChatEntry, pk_user_id: sender.pk_user_id },
            { ...defaultChatEntry, pk_user_id: receiver.pk_user_id },
            uniquePrivateChatKeyCopy,
          );
          const privateChatsInsertResponseObject = privateChatsInsertResponse[0];
          const response = await this.createPrivateMessage({
            privateChatsInsertResponse: {
              ...privateChatsInsertResponseObject,
              pk_private_chat_id: privateChatsInsertResponseObject.pk_private_chat_id,
              user_a_id: privateChatsInsertResponseObject.user_a_id,
              user_b_id: privateChatsInsertResponseObject.user_b_id,
              timezone: timezoneCopy,
            },
            senderId,
            message,
            imageFile: imageFile,
            imageName,
            created_at,
            timezone,
          });
          if ('error' in response) {
            return this.emitSocketError(
              this.buildError({
                message: response.reason,
                code: 'MESSAGE_INSERT_ERROR',
                context: {
                  userId: senderId,
                  roomId: uniquePrivateChatKey,
                  action: 'addPrivateMessage',
                  metadata: { created_at, timezone },
                  fullError: JSON.stringify(response.error),
                },
              }),
            );
          }
          const privateMessageInsertResponse = response[0];

          const addPrivateMessageSocketResponse = {
            private_chat: {
              pk_private_chat_id: privateChatsInsertResponseObject.pk_private_chat_id,
              user_a_id: privateChatsInsertResponseObject.user_a_id,
              user_b_id: privateChatsInsertResponseObject.user_b_id,
              created_at: privateChatsInsertResponseObject.created_at,
              unique_chat_key: privateChatsInsertResponseObject.unique_chat_key,
              isNewPrivateChat,
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
              image_name: privateMessageInsertResponse.image_name,
              timezone: privateMessageInsertResponse.timezone,
            },
            recipient: {
              pk_user_id: receiver.pk_user_id,
              name: receiver.name,
              email: receiver.email,
            },
          };

          this.io.emit('add-private-message-response', addPrivateMessageSocketResponse);
          // Emits an event to display the most recent message sent
          this.io.emit('get-latest-private-message-sent', addPrivateMessageSocketResponse);
        } catch (error) {
          const hasFiles = imageFile !== null;

          this.emitSocketError(
            this.buildError({
              message: 'Failed to send message. Please try again.',
              code: 'MESSAGE_SEND_ERROR',
              context: {
                userId: senderId,
                roomId: uniquePrivateChatKey,
                action: 'addPrivateMessage',
                fullError: JSON.stringify(error),
                metadata: {
                  created_at,
                  timezone,
                  hasFiles,
                  imageName,
                },
              },
            }),
          );
        }
      },
    );
  }
  socketEvents() {
    this.io.on('connection', (socket) => {
      this.addMessageToChannelRoom(socket);
      this.addPrivateMessage(socket);
      this.getAUserChatList(socket);
      this.getPrivateMessageList(socket);
    });
  }
}
