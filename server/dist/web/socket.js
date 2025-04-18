"use strict";
!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[n]="ac12b7ef-4c16-5e69-95da-ebc1d1931176")}catch(e){}}();

Object.defineProperty(exports, "__esModule", { value: true });
exports.AppSocketBase = void 0;
const http_status_codes_1 = require("http-status-codes");
const node_buffer_1 = require("node:buffer");
const query_handlers_model_1 = require("../model/query-handlers.model");
class AppSocketBase extends query_handlers_model_1.QueryHandlers {
    constructor(socket) {
        super();
        this.socketAuthMiddleware = async (socket, next) => {
            var _a, _b;
            const token = (_b = (_a = socket.handshake) === null || _a === void 0 ? void 0 : _a.auth) === null || _b === void 0 ? void 0 : _b.token;
            const decodedToken = await this.decodeJWT(token);
            if (decodedToken === undefined) {
                socket.disconnect();
                next(new Error(JSON.stringify({
                    message: 'Unknown error. Please try again',
                    code: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR,
                })));
                return;
            }
            if ('code' in decodedToken && decodedToken.code === http_status_codes_1.StatusCodes.UNAUTHORIZED) {
                next(new Error(JSON.stringify(decodedToken)));
                return;
            }
            next();
        };
        this.io = socket;
        this.io.use(this.socketAuthMiddleware);
    }
    async getAUserChatList(socket) {
        var _a;
        const token = (_a = socket.handshake.auth) === null || _a === void 0 ? void 0 : _a.token;
        const user = (await this.decodeJWT(token));
        if (!user)
            return;
        const userId = user.userId;
        socket.on('get-chat-list', async (cb) => {
            const chatList = await this.selectUserChatRoomsWithLastSetMessages(userId);
            cb(chatList);
        });
    }
    async getPrivateMessageList(socket) {
        var _a;
        const token = (_a = socket.handshake.auth) === null || _a === void 0 ? void 0 : _a.token;
        const user = (await this.decodeJWT(token));
        if (!user)
            return;
        const userId = user.userId;
        socket.on('get-private-message-list', async (cb) => {
            const chatList = await this.getLatestPrivateChatMessagesSent({ userId });
            cb(chatList);
        });
    }
    emitAddMessageErrorResponse(chatName, message) {
        const response = {
            data: null,
            error: true,
            message: message,
            chats: { chatName },
        };
        if (chatName) {
            this.io.to(chatName).emit('add-message-response', response);
        }
        else {
            this.io.emit('add-message-response', response);
        }
    }
    addMessageToRoom(socket) {
        socket.on('add-message', async (data) => {
            var _a;
            const { chatName, message, sent_at, timezone } = data;
            const token = (_a = socket.handshake.auth) === null || _a === void 0 ? void 0 : _a.token;
            const user = (await this.decodeJWT(token));
            this.io.socketsJoin(chatName);
            if (!chatName) {
                return this.emitAddMessageErrorResponse(null, 'Chat name cannot be empty');
            }
            if (!message) {
                return this.emitAddMessageErrorResponse(chatName, 'Message cannot be empty');
            }
            if (!sent_at || !timezone) {
                return this.emitAddMessageErrorResponse(chatName, 'sent_at and timezone cannot be empty');
            }
            if (!user) {
                return this.emitAddMessageErrorResponse(chatName, 'User not found');
            }
            const userId = user.userId;
            const chatExist = await this.selectChatByChatName(chatName);
            if (chatExist.length === 0) {
                const insertIntoChatResponse = await this.createNewChatRoom({
                    chatName,
                    created_at: sent_at,
                    timezone: timezone,
                });
                const chatId = insertIntoChatResponse[0].id;
                const messageResponse = await this.insertMessageToTable({
                    chatId,
                    user_id: userId,
                    message,
                    sent_at,
                    timezone,
                });
                const chatExist = await this.selectChatByChatName(chatName);
                const addMessageResponse = messageResponse.map((message) => (Object.assign(Object.assign({}, message), { chats: chatExist[0] })));
                const chatList = await this.getLatestChatRoomMessageSent(userId, chatId);
                this.io.to(chatName).emit('get-latest-chat-room-message', chatList);
                this.io.to(chatName).emit('add-message-response', addMessageResponse);
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
            const messageResponse = await this.getMostRecentChatMessageSent(messageInsertResponse);
            const addMessageResponse = messageResponse.map((message) => (Object.assign(Object.assign({}, message), { chats: chatExist[0] })));
            this.io.to(chatName).emit('add-message-response', addMessageResponse);
            const chatList = await this.getLatestChatRoomMessageSent(userId, chatId);
            this.io.to(chatName).emit('get-latest-chat-room-message', chatList);
        });
    }
    addPrivateMessage(socket) {
        socket.on('add-private-message', async ({ recipientId, senderId, message, imageFile, imageName, created_at, timezone, }) => {
            try {
                if (!created_at || !timezone) {
                    return this.emitAddMessageErrorResponse(null, 'created_at and timezone cannot be empty');
                }
                const [sender, receiver] = (await this.getUserByUserIds({ userIdList: [senderId, recipientId] })).flat();
                const privateChatsInsertResponse = (await this.createPrivateChatEntry(sender, receiver))[0];
                const response = await this.createPrivateMessage({
                    privateChatsInsertResponse: Object.assign(Object.assign({}, privateChatsInsertResponse), { pk_private_chat_id: privateChatsInsertResponse.pk_private_chat_id, sender_id: privateChatsInsertResponse.sender_id, recipient_id: privateChatsInsertResponse.recipient_id }),
                    senderId,
                    message,
                    imageFile: imageFile,
                    imageName,
                    created_at,
                    timezone,
                });
                if ('error' in response) {
                    return this.emitAddMessageErrorResponse(null, response.reason);
                }
                const privateMessageInsertResponse = response[0];
                let base64Image = null;
                if (privateMessageInsertResponse === null || privateMessageInsertResponse === void 0 ? void 0 : privateMessageInsertResponse.image_file) {
                    if (privateMessageInsertResponse.image_file instanceof node_buffer_1.File ||
                        node_buffer_1.Buffer.isBuffer(privateMessageInsertResponse.image_file)) {
                        base64Image = privateMessageInsertResponse.image_file.toString('base64');
                    }
                    else if (typeof (privateMessageInsertResponse === null || privateMessageInsertResponse === void 0 ? void 0 : privateMessageInsertResponse.image_file) === 'string') {
                        base64Image = privateMessageInsertResponse.image_file;
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
                        image_file: base64Image,
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
                this.io.emit('get-latest-private-message-sent', addPrivateMessageSocketResponse);
            }
            catch (_error) {
            }
        });
    }
    socketEvents() {
        this.io.on('connection', (socket) => {
            this.addMessageToRoom(socket);
            this.addPrivateMessage(socket);
            this.getAUserChatList(socket);
            this.getPrivateMessageList(socket);
        });
    }
    connectToRooms(socket) {
        socket.to(['person-1', 'person-1']);
    }
}
exports.AppSocketBase = AppSocketBase;
//# sourceMappingURL=socket.js.map
//# debugId=ac12b7ef-4c16-5e69-95da-ebc1d1931176
