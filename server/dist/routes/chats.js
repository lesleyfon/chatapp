"use strict";
!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[n]="7aa16704-7123-526e-b381-29072c4d10ca")}catch(e){}}();

var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatRouter = exports.Chat = exports.QueryHandlersMixin = exports.AuthMiddlewareMixin = void 0;
const express_1 = require("express");
const http_status_codes_1 = require("http-status-codes");
const Sentry = __importStar(require("@sentry/node"));
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
                const privateChatRooms = await this.queryHandlers.getAllPrivateChatRooms({
                    userId,
                });
                if ("error" in privateChatRooms) {
                    return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json(privateChatRooms);
                }
                return res.status(http_status_codes_1.StatusCodes.OK).json(privateChatRooms);
            }
            catch (error) {
                if (error instanceof Error) {
                    return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({
                        msg: error.message,
                    });
                }
                return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({
                    msg: "An unknown error occurred",
                });
            }
        };
        this.getChatMessagesById = this.getChatMessagesById.bind(this);
        this.getPrivateMessagesById = this.getPrivateMessagesById.bind(this);
        this.getAllChatRooms = this.getAllChatRooms.bind(this);
        this.createChatRoom = this.createChatRoom.bind(this);
        this.router.get("/", this.baseRoute);
        this.router.get("/:chatId", this.authMiddleware.authenticateRequests, this.getChatMessagesById);
        this.router.get("/private-message/:recipientId", this.authMiddleware.authenticateRequests, this.getPrivateMessagesById);
        this.router.get("/all/chat-rooms", this.authMiddleware.authenticateRequests, this.getAllChatRooms);
        this.router.get("/all/private-chat-rooms", this.authMiddleware.authenticateRequests, this.getAllPrivateChatRooms);
        this.router.post("/chat/new-chatroom", this.authMiddleware.authenticateRequests, this.createChatRoom);
    }
    async getChatMessagesById(req, res) {
        try {
            const { chatId } = req.params;
            if (!chatId) {
                const eventId = Sentry.captureEvent({
                    level: "error",
                    extra: {
                        message: `Bad Request: chatId is required chatId = ${chatId}`,
                        chatId,
                        userId: req.user.pk_user_id,
                    },
                });
                return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({
                    messages: `Bad Request: chatId is required chatId = ${chatId}`,
                    eventId,
                    error: true,
                });
            }
            const userId = req.user.pk_user_id;
            const chatMessages = await this.queryHandlers.selectChatRoomMessagesByUserId(userId, parseInt(chatId));
            if ("error" in chatMessages) {
                const eventId = Sentry.captureEvent({
                    level: "error",
                    extra: {
                        message: `Bad Request: chatMessages error = ${chatMessages}`,
                        chatMessages,
                        userId: req.user.pk_user_id,
                    },
                });
                return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json(Object.assign(Object.assign({}, chatMessages), { eventId }));
            }
            Sentry.captureMessage(`Success: retrieved chat messages for userId = ${userId} and chatId = ${chatId}`, {
                level: "info",
                extra: {
                    message: `Success: retrieved chat messages for userId = ${userId} and chatId = ${chatId}`,
                    userId,
                    chatId,
                },
            });
            return res.status(http_status_codes_1.StatusCodes.OK).json({ msg: chatMessages });
        }
        catch (error) {
            Sentry.captureException(error, {
                extra: {
                    method: "getChatMessagesById",
                    userId: req.user.pk_user_id,
                    chatId: req.params.chatId,
                },
            });
            return res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json({
                message: "Internal Server Error",
            });
        }
    }
    async getPrivateMessagesById(req, res) {
        try {
            const { recipientId } = req.params;
            if (!recipientId) {
                const eventId = Sentry.captureEvent({
                    level: "error",
                    extra: {
                        messages: `Bad Request: recipientId is required: recipientId = ${recipientId}`,
                        recipientId,
                        userId: req.user.pk_user_id,
                    },
                });
                return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({
                    error: true,
                    messages: `Bad Request: recipientId is required: recipientId = ${recipientId}`,
                    eventId,
                });
            }
            const userId = req.user.pk_user_id;
            const privateMessages = await this.queryHandlers.getPrivateRoomMessagesBySenderId({
                userId,
                recipientId: parseInt(recipientId),
            });
            if ("error" in privateMessages) {
                const eventId = Sentry.captureEvent({
                    level: "error",
                    extra: {
                        message: `Bad Request: privateMessages error = ${privateMessages}`,
                        privateMessages,
                        userId,
                        recipientId,
                    },
                });
                return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json(Object.assign(Object.assign({}, privateMessages), { eventId }));
            }
            Sentry.captureMessage(`Success: retrieved private messages for userId = ${userId} and recipientId = ${recipientId}`, {
                level: "info",
                extra: {
                    message: `Success: retrieved private messages for userId = ${userId} and recipientId = ${recipientId}`,
                    userId,
                    recipientId,
                },
            });
            return res.status(http_status_codes_1.StatusCodes.OK).json({ msg: privateMessages });
        }
        catch (error) {
            Sentry.captureException(error, {
                extra: {
                    userId: req.user.pk_user_id,
                    recipientId: req.params.recipientId,
                    method: "getPrivateMessagesById",
                },
            });
            return res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json({
                message: "Internal Server Error",
            });
        }
    }
    async getAllChatRooms(_req, res) {
        const chatRooms = await this.queryHandlers.getAllChatRooms();
        if ("error" in chatRooms) {
            return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json(chatRooms);
        }
        return res.status(http_status_codes_1.StatusCodes.OK).json(chatRooms);
    }
    async createChatRoom(req, res) {
        const { chat_name, created_at, timezone } = req.body;
        const userId = req.user.pk_user_id;
        if ((chat_name === null || chat_name === void 0 ? void 0 : chat_name.length) === 0) {
            return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({
                msg: "Room name cant be a falsy value",
            });
        }
        if (!timezone || !created_at) {
            return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({
                reason: `Bad Request: timezone, and created_at are required to create a chat room`,
            });
        }
        const chatRooms = await this.queryHandlers.createNewChatroomRoomNameAndByUserId({
            chatName: chat_name,
            created_at,
            timezone,
            userId: userId,
        });
        if ("error" in chatRooms) {
            return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json(chatRooms);
        }
        return res.status(http_status_codes_1.StatusCodes.OK).json(chatRooms);
    }
    baseRoute(_req, res) {
        res.json({ Base: "Routes" });
    }
}
exports.Chat = Chat;
exports.chatRouter = new Chat().router;
//# sourceMappingURL=chats.js.map
//# debugId=7aa16704-7123-526e-b381-29072c4d10ca
