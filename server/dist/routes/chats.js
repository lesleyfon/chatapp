"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatRouter = exports.Chat = exports.QueryHandlersMixin = exports.AuthMiddlewareMixin = void 0;
const express_1 = require("express");
const http_status_codes_1 = require("http-status-codes");
const auth_1 = __importDefault(require("../middleware/auth"));
const QueryHandlers_model_1 = __importDefault(require("../model/QueryHandlers.model"));
const AuthMiddlewareMixin = (Base) => class extends Base {
    constructor(...args) {
        super(...args);
        this.authMiddleware = new auth_1.default();
    }
};
exports.AuthMiddlewareMixin = AuthMiddlewareMixin;
const QueryHandlersMixin = (Base) => class extends Base {
    constructor(...args) {
        super(...args);
        this.queryHandlers = new QueryHandlers_model_1.default();
    }
};
exports.QueryHandlersMixin = QueryHandlersMixin;
class BaseClass {
}
class Chat extends (0, exports.AuthMiddlewareMixin)((0, exports.QueryHandlersMixin)(BaseClass)) {
    constructor() {
        super();
        this.router = (0, express_1.Router)();
        this.getAllPrivateChatRooms = async (req, res) => {
            var _a;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.pk_user_id;
                const privateChatRooms = await this.queryHandlers.getAllPrivateChatRooms({ userId });
                if ('error' in privateChatRooms) {
                    return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json(privateChatRooms);
                }
                return res.status(http_status_codes_1.StatusCodes.OK).json(privateChatRooms);
            }
            catch (error) {
                if (error instanceof Error) {
                    return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({
                        msg: error.message
                    });
                }
                return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({
                    msg: "An unknown error occurred"
                });
            }
        };
        this.getChatMessagesById = this.getChatMessagesById.bind(this);
        this.getPrivateMessagesById = this.getPrivateMessagesById.bind(this);
        this.getAllChatRooms = this.getAllChatRooms.bind(this);
        this.createChatRoom = this.createChatRoom.bind(this);
        this.router.get('/', this.baseRoute);
        this.router.get('/:chatId', this.authMiddleware.authenticateRequests, this.getChatMessagesById);
        this.router.get('/private-message/:recipientId', this.authMiddleware.authenticateRequests, this.getPrivateMessagesById);
        this.router.get('/all/chat-rooms', this.authMiddleware.authenticateRequests, this.getAllChatRooms);
        this.router.get('/all/private-chat-rooms', this.authMiddleware.authenticateRequests, this.getAllPrivateChatRooms);
        this.router.post('/chat/new-chatroom', this.authMiddleware.authenticateRequests, this.createChatRoom);
    }
    async getChatMessagesById(req, res) {
        const { chatId } = req.params;
        if (!chatId) {
            res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({
                messages: `Bad Request: chatId is required chatId = ${chatId}`
            });
        }
        const userId = req.user.pk_user_id;
        const chatMessages = await this.queryHandlers.selectChatRoomMessagesByUserId(userId, parseInt(chatId));
        if ('error' in chatMessages) {
            return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json(chatMessages);
        }
        return res.status(http_status_codes_1.StatusCodes.OK).json({ msg: chatMessages });
    }
    async getPrivateMessagesById(req, res) {
        const { recipientId } = req.params;
        if (!recipientId) {
            res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({
                messages: `Bad Request: recipientId is required: recipientId = ${recipientId}`
            });
        }
        const userId = req.user.pk_user_id;
        const privateMessages = await this.queryHandlers.getPrivateRoomMessagesBySenderId({ userId, recipientId: parseInt(recipientId) });
        if ('error' in privateMessages) {
            return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json(privateMessages);
        }
        return res.status(http_status_codes_1.StatusCodes.OK).json({ msg: privateMessages });
    }
    async getAllChatRooms(_req, res) {
        const chatRooms = await this.queryHandlers.getAllChatRooms();
        if ('error' in chatRooms) {
            return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json(chatRooms);
        }
        return res.status(http_status_codes_1.StatusCodes.OK).json(chatRooms);
    }
    async createChatRoom(req, res) {
        const { chat_name } = req.body;
        const userId = req.user.pk_user_id;
        if ((chat_name === null || chat_name === void 0 ? void 0 : chat_name.length) === 0) {
            return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({
                msg: "Room name cant be a falsy value"
            });
        }
        const chatRooms = await this.queryHandlers.createNewChatroomRoomNameAndByUserId(chat_name, userId);
        if ('error' in chatRooms) {
            return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json(chatRooms);
        }
        return res.status(http_status_codes_1.StatusCodes.OK).json(chatRooms);
    }
    baseRoute(_req, res) {
        res.json({ 'Base': "Routes" });
    }
}
exports.Chat = Chat;
exports.chatRouter = new Chat().router;
//# sourceMappingURL=chats.js.map