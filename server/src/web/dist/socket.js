"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
exports.AppSocketBase = void 0;
var Sentry = require("@sentry/node");
var http_status_codes_1 = require("http-status-codes");
var query_handlers_model_1 = require("../model/query-handlers.model");
var obfuscated_chat_key_1 = require("../utils/obfuscated-chat-key");
var AppSocketBase = /** @class */ (function (_super) {
    __extends(AppSocketBase, _super);
    function AppSocketBase(socket) {
        var _this = _super.call(this) || this;
        _this.socketAuthMiddleware = function (socket, next) { return __awaiter(_this, void 0, void 0, function () {
            var token, decodedToken;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        token = (_b = (_a = socket.handshake) === null || _a === void 0 ? void 0 : _a.auth) === null || _b === void 0 ? void 0 : _b.token;
                        return [4 /*yield*/, this.decodeJWT(token)];
                    case 1:
                        decodedToken = _c.sent();
                        if (decodedToken === undefined) {
                            socket.disconnect();
                            next(new Error(JSON.stringify({
                                message: 'Unknown error. Please try again',
                                code: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR
                            })));
                            return [2 /*return*/];
                        }
                        if ('code' in decodedToken && decodedToken.code === http_status_codes_1.StatusCodes.UNAUTHORIZED) {
                            next(new Error(JSON.stringify(decodedToken)));
                            return [2 /*return*/];
                        }
                        next();
                        return [2 /*return*/];
                }
            });
        }); };
        _this.io = socket;
        _this.io.use(_this.socketAuthMiddleware);
        _this.io.engine.on('connection', function (socket) {
            socket.on('error', function (error) {
                Sentry.captureException(error);
            });
            socket.on('disconnect', function (reason) {
                var _a;
                Sentry.captureException({
                    message: 'User disconnected',
                    reason: reason,
                    userId: (_a = socket.handshake.auth) === null || _a === void 0 ? void 0 : _a.userId
                });
            });
        });
        return _this;
    }
    AppSocketBase.prototype.getAUserChatList = function (socket) {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            var token, user, userId;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        token = (_a = socket.handshake.auth) === null || _a === void 0 ? void 0 : _a.token;
                        return [4 /*yield*/, this.decodeJWT(token)];
                    case 1:
                        user = (_b.sent());
                        if (!user)
                            return [2 /*return*/];
                        userId = user.userId;
                        socket.on('get-chat-list', function (cb) { return __awaiter(_this, void 0, void 0, function () {
                            var chatList;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, this.selectUserChatRoomsWithLastSetMessages(userId)];
                                    case 1:
                                        chatList = _a.sent();
                                        cb(chatList);
                                        return [2 /*return*/];
                                }
                            });
                        }); });
                        return [2 /*return*/];
                }
            });
        });
    };
    AppSocketBase.prototype.getPrivateMessageList = function (socket) {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            var token, user, userId;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        token = (_a = socket.handshake.auth) === null || _a === void 0 ? void 0 : _a.token;
                        return [4 /*yield*/, this.decodeJWT(token)];
                    case 1:
                        user = (_b.sent());
                        if (!user)
                            return [2 /*return*/];
                        userId = user.userId;
                        socket.on('get-private-message-list', function (cb) { return __awaiter(_this, void 0, void 0, function () {
                            var chatList;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, this.getLatestPrivateChatMessagesSent({ userId: userId })];
                                    case 1:
                                        chatList = _a.sent();
                                        cb(chatList);
                                        return [2 /*return*/];
                                }
                            });
                        }); });
                        return [2 /*return*/];
                }
            });
        });
    };
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
    AppSocketBase.prototype.emitAddMessageErrorResponse = function (chatName, message) {
        var response = {
            data: null,
            error: true,
            message: message,
            chats: { chatName: chatName }
        };
        if (chatName) {
            this.io.to(chatName).emit('add-message-response', response);
        }
        else {
            this.io.emit('add-message-response', response);
        }
    };
    AppSocketBase.prototype.addMessageToChannelRoom = function (socket) {
        var _this = this;
        socket.on('add-message', function (data) { return __awaiter(_this, void 0, void 0, function () {
            var chatName, message, sent_at, timezone, imageFile, imageName, token, user, userId, chatRoom, chatRoomId, messageInsertResponse, messageResponse, addMessageResponse, chatList;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        chatName = data.chatName, message = data.message, sent_at = data.sent_at, timezone = data.timezone, imageFile = data.imageFile, imageName = data.imageName;
                        token = (_a = socket.handshake.auth) === null || _a === void 0 ? void 0 : _a.token;
                        return [4 /*yield*/, this.decodeJWT(token)];
                    case 1:
                        user = (_b.sent());
                        this.io.socketsJoin(chatName);
                        if (!chatName) {
                            return [2 /*return*/, this.emitAddMessageErrorResponse(null, 'Chat name cannot be empty')];
                        }
                        if (!message) {
                            return [2 /*return*/, this.emitAddMessageErrorResponse(chatName, 'Message cannot be empty')];
                        }
                        if (!sent_at || !timezone) {
                            return [2 /*return*/, this.emitAddMessageErrorResponse(chatName, 'sent_at and timezone cannot be empty')];
                        }
                        if (!user) {
                            return [2 /*return*/, this.emitAddMessageErrorResponse(chatName, 'User not found')];
                        }
                        userId = user.userId;
                        return [4 /*yield*/, this.selectChatByChatName(chatName)];
                    case 2:
                        chatRoom = _b.sent();
                        if (!(chatRoom.length === 0)) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.createNewChatRoom({
                                chatName: chatName,
                                created_at: sent_at,
                                timezone: timezone
                            })];
                    case 3:
                        // Create a new room
                        chatRoom = _b.sent();
                        _b.label = 4;
                    case 4:
                        chatRoomId = chatRoom[0].pk_chats_id;
                        return [4 /*yield*/, this.insertMessageToChannelsTable({
                                chatId: chatRoomId,
                                user_id: userId,
                                message: message,
                                sent_at: sent_at,
                                timezone: timezone,
                                imageFile: imageFile,
                                imageName: imageName
                            })];
                    case 5:
                        messageInsertResponse = _b.sent();
                        if ('error' in messageInsertResponse) {
                            return [2 /*return*/, this.emitAddMessageErrorResponse(chatName, messageInsertResponse.reason)];
                        }
                        return [4 /*yield*/, this.getMostRecentChatMessageSent(messageInsertResponse)];
                    case 6:
                        messageResponse = _b.sent();
                        addMessageResponse = messageResponse.map(function (message) { return (__assign(__assign({}, message), { chats: chatRoom[0] })); });
                        // Emitter
                        this.io.to(chatName).emit('add-message-response', addMessageResponse);
                        return [4 /*yield*/, this.getLatestChatRoomMessageSent(userId, chatRoomId)];
                    case 7:
                        chatList = _b.sent();
                        this.io.to(chatName).emit('get-latest-chat-room-message', chatList);
                        return [2 /*return*/];
                }
            });
        }); });
    };
    AppSocketBase.prototype.addPrivateMessage = function (socket) {
        var _this = this;
        socket.on('add-private-message', function (_a) {
            var senderId = _a.senderId, message = _a.message, imageFile = _a.imageFile, imageName = _a.imageName, created_at = _a.created_at, timezone = _a.timezone, uniquePrivateChatKey = _a.uniquePrivateChatKey;
            return __awaiter(_this, void 0, void 0, function () {
                var isNewPrivateChat, uniquePrivateChatKeyCopy, senderIdCopy, timezoneCopy, defaultChatEntry, recipientId, privateChatEntry, _b, user_a_id, user_b_id, _c, sender, receiver, privateChatsInsertResponse, privateChatsInsertResponseObject, response, privateMessageInsertResponse, addPrivateMessageSocketResponse, error_1, hasFiles;
                return __generator(this, function (_d) {
                    switch (_d.label) {
                        case 0:
                            _d.trys.push([0, 7, , 8]);
                            if (!created_at || !timezone) {
                                return [2 /*return*/, this.emitAddMessageErrorResponse(null, 'created_at and timezone cannot be empty')];
                            }
                            isNewPrivateChat = uniquePrivateChatKey.includes('new_private_chat');
                            uniquePrivateChatKeyCopy = uniquePrivateChatKey;
                            senderIdCopy = senderId;
                            timezoneCopy = timezone;
                            defaultChatEntry = {
                                created_at: created_at,
                                updated_at: created_at,
                                timezone: timezoneCopy
                            };
                            recipientId = void 0;
                            if (!isNewPrivateChat) return [3 /*break*/, 1];
                            recipientId = Number.parseInt(uniquePrivateChatKeyCopy.split('new_private_chat_').at(-1));
                            uniquePrivateChatKeyCopy = obfuscated_chat_key_1.ObfuscatedChatKey.getObfuscatedChatKey(recipientId, senderIdCopy);
                            return [3 /*break*/, 3];
                        case 1: return [4 /*yield*/, this.getPrivateChatEntryByUniquePrivateChatKey({
                                uniquePrivateChatKey: uniquePrivateChatKeyCopy
                            })];
                        case 2:
                            privateChatEntry = _d.sent();
                            if (privateChatEntry.length === 0) {
                                return [2 /*return*/, this.emitAddMessageErrorResponse(null, 'Private chat not found')];
                            }
                            _b = privateChatEntry[0], user_a_id = _b.user_a_id, user_b_id = _b.user_b_id;
                            recipientId = user_a_id === senderIdCopy ? user_b_id : user_a_id;
                            _d.label = 3;
                        case 3: return [4 /*yield*/, this.getUserByUserIds({
                                userAId: senderIdCopy,
                                userBId: recipientId
                            })];
                        case 4:
                            _c = _d.sent(), sender = _c[0][0], receiver = _c[1][0];
                            return [4 /*yield*/, this.createPrivateChatEntry(__assign(__assign({}, defaultChatEntry), { pk_user_id: sender.pk_user_id }), __assign(__assign({}, defaultChatEntry), { pk_user_id: receiver.pk_user_id }), uniquePrivateChatKeyCopy)];
                        case 5:
                            privateChatsInsertResponse = _d.sent();
                            privateChatsInsertResponseObject = privateChatsInsertResponse[0];
                            return [4 /*yield*/, this.createPrivateMessage({
                                    privateChatsInsertResponse: __assign(__assign({}, privateChatsInsertResponseObject), { pk_private_chat_id: privateChatsInsertResponseObject.pk_private_chat_id, user_a_id: privateChatsInsertResponseObject.user_a_id, user_b_id: privateChatsInsertResponseObject.user_b_id, timezone: timezoneCopy }),
                                    senderId: senderId,
                                    message: message,
                                    imageFile: imageFile,
                                    imageName: imageName,
                                    created_at: created_at,
                                    timezone: timezone
                                })];
                        case 6:
                            response = _d.sent();
                            if ('error' in response) {
                                return [2 /*return*/, this.emitAddMessageErrorResponse(null, response.reason)];
                            }
                            privateMessageInsertResponse = response[0];
                            addPrivateMessageSocketResponse = {
                                private_chat: {
                                    pk_private_chat_id: privateChatsInsertResponseObject.pk_private_chat_id,
                                    user_a_id: privateChatsInsertResponseObject.user_a_id,
                                    user_b_id: privateChatsInsertResponseObject.user_b_id,
                                    created_at: privateChatsInsertResponseObject.created_at,
                                    unique_chat_key: privateChatsInsertResponseObject.unique_chat_key,
                                    isNewPrivateChat: isNewPrivateChat
                                },
                                chat_user: {
                                    pk_user_id: sender.pk_user_id,
                                    name: sender.name,
                                    email: sender.email,
                                    created_at: sender.created_at
                                },
                                private_messages: {
                                    id: privateMessageInsertResponse.id,
                                    fk_private_chat_id: privateMessageInsertResponse.fk_private_chat_id,
                                    fk_user_id: privateMessageInsertResponse.fk_user_id,
                                    message_text: privateMessageInsertResponse.message_text,
                                    sent_at: privateMessageInsertResponse.sent_at,
                                    image_name: privateMessageInsertResponse.image_name,
                                    timezone: privateMessageInsertResponse.timezone
                                },
                                recipient: {
                                    pk_user_id: receiver.pk_user_id,
                                    name: receiver.name,
                                    email: receiver.email
                                }
                            };
                            this.io.emit('add-private-message-response', addPrivateMessageSocketResponse);
                            // Emits an event to display the most recent message sent
                            this.io.emit('get-latest-private-message-sent', addPrivateMessageSocketResponse);
                            return [3 /*break*/, 8];
                        case 7:
                            error_1 = _d.sent();
                            hasFiles = imageFile !== null;
                            Sentry.captureException(error_1, {
                                extra: {
                                    senderId: senderId,
                                    hasFiles: hasFiles,
                                    timezone: timezone,
                                    imageName: imageName,
                                    created_at: created_at,
                                    uniquePrivateChatKey: uniquePrivateChatKey,
                                    method: 'addPrivateMessage'
                                }
                            });
                            // TODO: Make this an internal server error and create a new UI for the error.
                            this.io.emit('add-private-message-error', {
                                error: true,
                                message: 'Failed to send message. Please try again.'
                            });
                            return [3 /*break*/, 8];
                        case 8: return [2 /*return*/];
                    }
                });
            });
        });
    };
    AppSocketBase.prototype.socketEvents = function () {
        var _this = this;
        this.io.on('connection', function (socket) {
            _this.addMessageToChannelRoom(socket);
            _this.addPrivateMessage(socket);
            _this.getAUserChatList(socket);
            _this.getPrivateMessageList(socket);
        });
    };
    return AppSocketBase;
}(query_handlers_model_1.QueryHandlers));
exports.AppSocketBase = AppSocketBase;
