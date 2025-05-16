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
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
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
exports.QueryHandlers = void 0;
var Sentry = require("@sentry/node");
var drizzle_orm_1 = require("drizzle-orm");
var db_1 = require("../db");
var schema_1 = require("../schema");
var get_envs_1 = require("../utils/get-envs");
var obfuscated_chat_key_1 = require("../utils/obfuscated-chat-key");
var auth_models_1 = require("./auth.models");
var QueryHandlers = /** @class */ (function (_super) {
    __extends(QueryHandlers, _super);
    function QueryHandlers() {
        var _this = _super.call(this) || this;
        _this.db = db_1.connectToDB();
        return _this;
    }
    // Private helper methods
    QueryHandlers.prototype.isValidInput = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return args.every(function (arg) { return (typeof arg === 'string' && arg.trim() !== '') || typeof arg === 'number'; });
    };
    /**
     * Inserts a message into the `messages` table and ensures the user is a member of the chat.
     *
     * This function performs two operations:
     * 1. Inserts a new message into the `messages` table.
     * 2. Ensures that the user is added to the `chatMembers` table if they are not already a member.
     *
     * @example
     * const messageResponse = await insertMessageToTable({
     *   chatId: 123,
     *   user_id: 456,
     *   message: 'Hello World',
     *   sent_at: '2023-04-20T12:00:00Z',
     *   timezone: 'America/New_York'
     * });
     * console.log(messageResponse);
     * // Output: { id: '...', sent_at: '...', fk_user_id: 456, fk_chat_id: 123, message_text: 'Hello World' }
     */
    QueryHandlers.prototype.insertMessageToChannelsTable = function (_a) {
        var chatId = _a.chatId, user_id = _a.user_id, message = _a.message, sent_at = _a.sent_at, timezone = _a.timezone, imageFile = _a.imageFile, imageName = _a.imageName;
        return __awaiter(this, void 0, void 0, function () {
            var imageProcessingPromise, _b, messageResponse, _, processedImage, bucketResponse, SUPABASE_BUCKET_URL, fullFilePath, updateResponse, err_1;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _c.trys.push([0, 5, , 6]);
                        imageProcessingPromise = null;
                        if (imageFile) {
                            imageProcessingPromise = this.processImageForStorage(imageFile);
                        }
                        return [4 /*yield*/, Promise.all([
                                this.db
                                    .insert(schema_1.messages)
                                    .values({
                                    fk_chat_id: chatId,
                                    fk_user_id: user_id,
                                    message_text: message,
                                    sent_at: sent_at,
                                    timezone: timezone,
                                    image_name: imageName,
                                    image_file: null
                                })
                                    .returning({
                                    id: schema_1.messages.id,
                                    sent_at: schema_1.messages.sent_at,
                                    fk_user_id: schema_1.messages.fk_user_id,
                                    fk_chat_id: schema_1.messages.fk_chat_id,
                                    message_text: schema_1.messages.message_text,
                                    timezone: schema_1.messages.timezone,
                                    image_name: schema_1.messages.image_name,
                                    image_url: schema_1.messages.image_url
                                }),
                                /** @description  Insert a new record into the chatMembers table, but only if that record does not already exist. */
                                this.db.execute(drizzle_orm_1.sql(templateObject_1 || (templateObject_1 = __makeTemplateObject(["\n          INSERT INTO ", " (fk_chat_id, fk_user_id, added_at, timezone)\n          SELECT ", ", ", ", ", ", ", "\n          WHERE NOT EXISTS (\n            SELECT 1 FROM ", " WHERE fk_chat_id = ", " AND fk_user_id = ", "\n          );\n        "], ["\n          INSERT INTO ", " (fk_chat_id, fk_user_id, added_at, timezone)\n          SELECT ", ", ", ", ", ", ", "\n          WHERE NOT EXISTS (\n            SELECT 1 FROM ", " WHERE fk_chat_id = ", " AND fk_user_id = ", "\n          );\n        "])), schema_1.chatMembers, chatId, user_id, sent_at, timezone, schema_1.chatMembers, chatId, user_id)),
                                imageProcessingPromise,
                            ])];
                    case 1:
                        _b = _c.sent(), messageResponse = _b[0], _ = _b[1], processedImage = _b[2];
                        if (!(processedImage && imageName)) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.uploadImageToChannelChatImageBucket(processedImage, imageName)];
                    case 2:
                        bucketResponse = _c.sent();
                        if (!bucketResponse) return [3 /*break*/, 4];
                        SUPABASE_BUCKET_URL = get_envs_1.getEnvs().SUPABASE_BUCKET_URL;
                        fullFilePath = SUPABASE_BUCKET_URL + "/storage/v1/object/public/" + bucketResponse.fullPath;
                        return [4 /*yield*/, this.db
                                .update(schema_1.messages)
                                .set({ image_url: fullFilePath })
                                .where(drizzle_orm_1.eq(schema_1.messages.id, messageResponse[0].id))
                                .returning({
                                id: schema_1.messages.id,
                                fk_chat_id: schema_1.messages.fk_chat_id,
                                fk_user_id: schema_1.messages.fk_user_id,
                                message_text: schema_1.messages.message_text,
                                sent_at: schema_1.messages.sent_at,
                                timezone: schema_1.messages.timezone,
                                image_name: schema_1.messages.image_name,
                                image_url: schema_1.messages.image_url
                            })];
                    case 3:
                        updateResponse = _c.sent();
                        messageResponse[0].image_url = fullFilePath;
                        return [2 /*return*/, updateResponse];
                    case 4: return [2 /*return*/, messageResponse];
                    case 5:
                        err_1 = _c.sent();
                        Sentry.captureException(err_1, {
                            tags: {
                                method: 'insertMessageToChannelsTable',
                                chatId: chatId,
                                user_id: user_id
                            }
                        });
                        return [2 /*return*/, {
                                error: true,
                                reason: err_1 instanceof Error ? err_1.message : 'Unknown error',
                                details: err_1
                            }];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * @description Retrieves a list of chat rooms for a given user along with the most recent message in each chat room.
     * @example
     * const userId = '12345';
     * selectUserChatRoomsWithLastSetMessages(userId)
     *   .then(chatRooms => {
     *     console.log(chatRooms);
     *   })
     *   .catch(error => {
     *     console.error(error);
     *   });
     */
    QueryHandlers.prototype.selectUserChatRoomsWithLastSetMessages = function (userId) {
        return __awaiter(this, void 0, Promise, function () {
            var chatList, chatListPromises, updatedChatList, response;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.db
                            .select({
                            chat_members: {
                                added_at: schema_1.chatMembers.added_at,
                                fk_chat_id: schema_1.chatMembers.fk_chat_id,
                                fk_user_id: schema_1.chatMembers.fk_user_id,
                                id: schema_1.chatMembers.id
                            },
                            chats: {
                                pk_chats_id: schema_1.chats.pk_chats_id,
                                chat_name: schema_1.chats.chat_name,
                                createdAt: schema_1.chats.createdAt
                            },
                            chat_user: {
                                created_at: schema_1.user.created_at,
                                email: schema_1.user.email,
                                name: schema_1.user.name,
                                pk_user_id: schema_1.user.pk_user_id
                            }
                        })
                            .from(schema_1.chatMembers)
                            .where(drizzle_orm_1.eq(schema_1.chatMembers.fk_user_id, userId))
                            .leftJoin(schema_1.user, drizzle_orm_1.eq(schema_1.user.pk_user_id, userId))
                            .leftJoin(schema_1.chats, drizzle_orm_1.eq(schema_1.chats.pk_chats_id, schema_1.chatMembers.fk_chat_id))];
                    case 1:
                        chatList = _a.sent();
                        chatListPromises = chatList.map(function (chat) { return __awaiter(_this, void 0, void 0, function () {
                            var mostRecentMessages;
                            var _a, _b;
                            return __generator(this, function (_c) {
                                switch (_c.label) {
                                    case 0: return [4 /*yield*/, this.db
                                            .select()
                                            .from(schema_1.messages)
                                            .where(drizzle_orm_1.eq(schema_1.messages.fk_chat_id, (_b = (_a = chat.chats) === null || _a === void 0 ? void 0 : _a.pk_chats_id) !== null && _b !== void 0 ? _b : 0))
                                            .orderBy(drizzle_orm_1.desc(schema_1.messages.sent_at))
                                            .limit(1)];
                                    case 1:
                                        mostRecentMessages = _c.sent();
                                        return [2 /*return*/, __assign(__assign({}, chat), { messages: mostRecentMessages[0] })];
                                }
                            });
                        }); });
                        return [4 /*yield*/, Promise.all(chatListPromises)];
                    case 2:
                        updatedChatList = _a.sent();
                        response = updatedChatList.filter(function (chat) { return chat.messages; });
                        response.sort(function (a, b) {
                            return a.messages.sent_at > b.messages.sent_at ? -1 : 1;
                        });
                        return [2 /*return*/, response.slice(0, 5)];
                }
            });
        });
    };
    /**
     * @description Retrieves the latest message sent in a specific chat room.
     * @param {number} userId - The ID of the user.
     * @param {number} chatRoomId - The ID of the chat room.
     * @returns {Promise<TypedMessage[]>} - An array of messages.
     */
    QueryHandlers.prototype.getLatestChatRoomMessageSent = function (userId, chatRoomId) {
        return __awaiter(this, void 0, void 0, function () {
            var chatList, response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.db
                            .select({
                            chats: {
                                chat_name: schema_1.chats.chat_name,
                                createdAt: schema_1.chats.createdAt,
                                pk_chats_id: schema_1.chats.pk_chats_id
                            },
                            chat_user: {
                                created_at: schema_1.user.created_at,
                                email: schema_1.user.email,
                                name: schema_1.user.name,
                                pk_user_id: schema_1.user.pk_user_id
                            },
                            messages: {
                                fk_chat_id: schema_1.messages.fk_chat_id,
                                fk_user_id: schema_1.messages.fk_user_id,
                                id: schema_1.messages.id,
                                message_text: schema_1.messages.message_text,
                                sent_at: schema_1.messages.sent_at
                            }
                        })
                            .from(schema_1.chats)
                            .where(drizzle_orm_1.eq(schema_1.chats.pk_chats_id, chatRoomId))
                            .leftJoin(schema_1.messages, drizzle_orm_1.eq(schema_1.messages.fk_chat_id, schema_1.chats.pk_chats_id))
                            .leftJoin(schema_1.user, drizzle_orm_1.eq(schema_1.user.pk_user_id, userId))
                            .orderBy(drizzle_orm_1.desc(schema_1.messages.sent_at))
                            .limit(1)];
                    case 1:
                        chatList = _a.sent();
                        response = chatList.filter(function (chat) { return chat.messages; });
                        response.sort(function (a, b) {
                            var _a, _b, _c, _d;
                            return ((_b = (_a = a.messages) === null || _a === void 0 ? void 0 : _a.sent_at) !== null && _b !== void 0 ? _b : 0) > ((_d = (_c = b.messages) === null || _c === void 0 ? void 0 : _c.sent_at) !== null && _d !== void 0 ? _d : 0) ? -1 : 1;
                        });
                        return [2 /*return*/, response];
                }
            });
        });
    };
    /**
     * @description Retrieves a chat room by its name.
     * @param {string} chatName - The name of the chat room.
     * @returns {Promise<ChatType | null>} - The chat room or null if it does not exist.
     */
    QueryHandlers.prototype.selectChatByChatName = function (chatName) {
        return __awaiter(this, void 0, void 0, function () {
            var chatExist;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.db.select().from(schema_1.chats).where(drizzle_orm_1.eq(schema_1.chats.chat_name, chatName))];
                    case 1:
                        chatExist = _a.sent();
                        return [2 /*return*/, chatExist];
                }
            });
        });
    };
    /**
     * @description Retrieves all messages for a specific chat room by user ID.
     * @param {number} userId - The ID of the user.
     * @param {number} chatRoomId - The ID of the chat room.
     * @returns {Promise<TypedMessage[] | SQLErrorType>} - An array of messages or an error object.
     */
    QueryHandlers.prototype.selectChatRoomMessagesByUserId = function (userId, chatRoomId) {
        return __awaiter(this, void 0, Promise, function () {
            var chatRoomExist, chatRoomMessages, mappedMessages, typedMessages, err_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, this.db
                                .select()
                                .from(schema_1.chats)
                                .where(drizzle_orm_1.eq(schema_1.chats.pk_chats_id, chatRoomId))];
                    case 1:
                        chatRoomExist = _a.sent();
                        if (chatRoomExist.length === 0) {
                            return [2 /*return*/, {
                                    error: true,
                                    reason: 'Chat room does not exist'
                                }];
                        }
                        return [4 /*yield*/, this.db
                                .select({
                                chats: {
                                    pk_chats_id: schema_1.chats.pk_chats_id,
                                    chat_name: schema_1.chats.chat_name,
                                    createdAt: schema_1.chats.createdAt,
                                    timezone: schema_1.chats.timezone
                                },
                                messages: {
                                    id: schema_1.messages.id,
                                    fk_chat_id: schema_1.messages.fk_chat_id,
                                    message_text: schema_1.messages.message_text,
                                    sent_at: schema_1.messages.sent_at,
                                    timezone: schema_1.messages.timezone,
                                    image_name: schema_1.messages.image_name,
                                    image_url: schema_1.messages.image_url
                                },
                                chat_user: {
                                    pk_user_id: schema_1.user.pk_user_id,
                                    name: schema_1.user.name,
                                    email: schema_1.user.email,
                                    created_at: schema_1.user.created_at
                                }
                            })
                                .from(schema_1.chats)
                                .where(drizzle_orm_1.eq(schema_1.chats.pk_chats_id, chatRoomId))
                                .orderBy(drizzle_orm_1.asc(schema_1.messages.sent_at))
                                .leftJoin(schema_1.messages, drizzle_orm_1.eq(schema_1.chats.pk_chats_id, schema_1.messages.fk_chat_id))
                                .leftJoin(schema_1.user, drizzle_orm_1.eq(schema_1.messages.fk_user_id, schema_1.user.pk_user_id))];
                    case 2:
                        chatRoomMessages = _a.sent();
                        mappedMessages = chatRoomMessages.map(function (data) {
                            var _a;
                            var dataUserId = (_a = data.chat_user) === null || _a === void 0 ? void 0 : _a.pk_user_id;
                            if (dataUserId === userId) {
                                // @ts-expect-error ignore
                                data.chat_user.sender = 'You';
                            }
                            return {
                                chats: __assign(__assign({}, data.chats), { pk_chats_id: data.chats.pk_chats_id }),
                                messages: data.messages && __assign(__assign({}, data.messages), { fk_chat_id: data.messages.fk_chat_id }),
                                chat_user: data.chat_user
                            };
                        });
                        typedMessages = mappedMessages.map(function (msg) {
                            var _a, _b;
                            return (__assign(__assign({}, msg), { messages: msg.messages
                                    ? __assign(__assign({}, msg.messages), { fk_user_id: (_b = (_a = msg.chat_user) === null || _a === void 0 ? void 0 : _a.pk_user_id) !== null && _b !== void 0 ? _b : 0 }) : null, chat_user: msg.chat_user
                                    ? __assign(__assign({}, msg.chat_user), { pk_user_id: msg.chat_user.pk_user_id }) : null }));
                        });
                        return [2 /*return*/, typedMessages];
                    case 3:
                        err_2 = _a.sent();
                        if (typeof err_2 === 'object' && Object.keys(err_2).length > 0) {
                            return [2 /*return*/, __assign(__assign({}, err_2), { error: true, reason: err_2.message })];
                        }
                        return [2 /*return*/, err_2];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * @description Retrieves private messages for a specific chat room by sender ID.
     * @param {number} userId - The ID of the user.
     * @param {number} recipientId - The ID of the recipient.
     * @returns {Promise<PrivateMessageTypeWithoutImageFile[] | SQLErrorType>} - An array of private messages or an error object.
     */
    QueryHandlers.prototype.getPrivateRoomMessagesBySenderId = function (_a) {
        var _b, _c;
        var userId = _a.userId, uniquePrivateChatKey = _a.uniquePrivateChatKey;
        return __awaiter(this, void 0, Promise, function () {
            var privateChatData, _d, user_a_id, user_b_id, recipientId, recipientExist, _e, chatRoomMessages, privateUserDetails, usersMap_1, mappedMessages, err_3;
            return __generator(this, function (_f) {
                switch (_f.label) {
                    case 0:
                        _f.trys.push([0, 4, , 5]);
                        return [4 /*yield*/, this.getPrivateChatEntryByUniquePrivateChatKey({
                                uniquePrivateChatKey: uniquePrivateChatKey
                            })];
                    case 1:
                        privateChatData = _f.sent();
                        // If recipientId does not exist, return an error
                        if (privateChatData.length === 0) {
                            return [2 /*return*/, {
                                    error: true,
                                    reason: 'Private chat does not exist'
                                }];
                        }
                        _d = privateChatData[0], user_a_id = _d.user_a_id, user_b_id = _d.user_b_id;
                        recipientId = userId === user_a_id ? user_b_id : user_a_id;
                        return [4 /*yield*/, this.db
                                .select()
                                .from(schema_1.user)
                                .where(drizzle_orm_1.eq(schema_1.user.pk_user_id, recipientId))];
                    case 2:
                        recipientExist = _f.sent();
                        if (recipientExist.length === 0) {
                            return [2 /*return*/, {
                                    error: true,
                                    reason: 'Recipient does not exist'
                                }];
                        }
                        return [4 /*yield*/, Promise.all([
                                this.db
                                    .select({
                                    private_chat: {
                                        pk_chats_id: schema_1.privateChats.pk_private_chat_id,
                                        createdAt: schema_1.privateChats.created_at,
                                        user_a_id: schema_1.privateChats.user_a_id,
                                        user_b_id: schema_1.privateChats.user_b_id,
                                        unique_chat_key: schema_1.privateChats.unique_chat_key
                                    },
                                    private_messages: {
                                        id: schema_1.privateMessages.id,
                                        fk_private_chat_id: schema_1.privateMessages.fk_private_chat_id,
                                        message_text: schema_1.privateMessages.message_text,
                                        sent_at: schema_1.privateMessages.sent_at,
                                        fk_user_id: schema_1.privateMessages.fk_user_id,
                                        image_url: schema_1.privateMessages.image_url,
                                        image_name: schema_1.privateMessages.image_name,
                                        timezone: schema_1.privateMessages.timezone
                                    }
                                })
                                    .from(schema_1.privateChats)
                                    .where(drizzle_orm_1.eq(schema_1.privateChats.unique_chat_key, uniquePrivateChatKey)) // gives a single unique chat key
                                    .leftJoin(schema_1.privateMessages, drizzle_orm_1.eq(schema_1.privateMessages.fk_private_chat_unique_key, schema_1.privateChats.unique_chat_key))
                                    .orderBy(drizzle_orm_1.asc(schema_1.privateMessages.sent_at)),
                                this.db
                                    .select({
                                    pk_user_id: schema_1.user.pk_user_id,
                                    name: schema_1.user.name,
                                    email: schema_1.user.email,
                                    created_at: schema_1.user.created_at
                                })
                                    .from(schema_1.user)
                                    .where(drizzle_orm_1.or(drizzle_orm_1.eq(schema_1.user.pk_user_id, user_a_id), drizzle_orm_1.eq(schema_1.user.pk_user_id, user_b_id))),
                            ])];
                    case 3:
                        _e = _f.sent(), chatRoomMessages = _e[0], privateUserDetails = _e[1];
                        usersMap_1 = new Map([
                            [String((_b = privateUserDetails[0]) === null || _b === void 0 ? void 0 : _b.pk_user_id), privateUserDetails[0]],
                            [String((_c = privateUserDetails[1]) === null || _c === void 0 ? void 0 : _c.pk_user_id), privateUserDetails[1]],
                        ]);
                        mappedMessages = chatRoomMessages.map(function (data) {
                            var _a, _b, _c;
                            var user_id = (_b = (_a = data.private_messages) === null || _a === void 0 ? void 0 : _a.fk_user_id) !== null && _b !== void 0 ? _b : '';
                            var chat_user = usersMap_1.get(user_id.toString());
                            return {
                                private_chat: {
                                    pk_private_chat_id: data.private_chat.pk_chats_id,
                                    created_at: data.private_chat.createdAt,
                                    user_a_id: data.private_chat.user_a_id,
                                    user_b_id: data.private_chat.user_b_id,
                                    unique_chat_key: data.private_chat.unique_chat_key
                                },
                                private_messages: data.private_messages,
                                chat_user: chat_user
                                    ? __assign(__assign({}, chat_user), { pk_user_id: chat_user.pk_user_id, sender: ((_c = data.private_messages) === null || _c === void 0 ? void 0 : _c.fk_user_id) === userId ? 'You' : '' }) : null
                            };
                        });
                        return [2 /*return*/, mappedMessages.filter(function (data) { return data.private_messages && data.private_chat && data.chat_user; })];
                    case 4:
                        err_3 = _f.sent();
                        Sentry.captureException(err_3, {
                            tags: {
                                method: 'getPrivateRoomMessagesBySenderId'
                            }
                        });
                        if (typeof err_3 === 'object' && Object.keys(err_3).length > 0) {
                            return [2 /*return*/, __assign(__assign({}, err_3), { error: true, reason: err_3.message })];
                        }
                        return [2 /*return*/, err_3];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
   * @description Retrieves the most recent chat message sent along with the user information.
      This method takes an array of message responses, selects the first one, and then queries
      the database to get the user details of the sender of that message. It returns the message
      along with the sender's information.
   * @example
   * const recentMessage = await getMostRecentChatMessageSent(messageResponse);
   * console.log(recentMessage);
   * // Output: [{ messages: {...}, chat_user: {...} }]
   */
    QueryHandlers.prototype.getMostRecentChatMessageSent = function (messageResponse) {
        return __awaiter(this, void 0, void 0, function () {
            var messageResponseObj, chatRoomMessages;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        messageResponseObj = messageResponse[0];
                        return [4 /*yield*/, this.db
                                .select({
                                pk_user_id: schema_1.user.pk_user_id,
                                name: schema_1.user.name,
                                email: schema_1.user.email
                            })
                                .from(schema_1.user)
                                .where(drizzle_orm_1.eq(schema_1.user.pk_user_id, messageResponseObj.fk_user_id))];
                    case 1:
                        chatRoomMessages = _a.sent();
                        return [2 /*return*/, [
                                {
                                    messages: messageResponseObj,
                                    chat_user: chatRoomMessages[0]
                                },
                            ]];
                }
            });
        });
    };
    /**
   * @description - Creates a new chat room with the specified name.
      This method inserts a new record into the `chats` table with the provided chat name and
      returns the ID of the newly created chat room.
   * @example
   * const newChatRoom = await createNewChatRoom({
   *   chatName: 'General Chat',
   *   created_at: '2023-04-20T12:00:00Z',
   *   timezone: 'America/New_York'
   * });
   * console.log(newChatRoom);
   * // Output: { id: 'newChatRoomId' }
   */
    QueryHandlers.prototype.createNewChatRoom = function (_a) {
        var chatName = _a.chatName, created_at = _a.created_at, timezone = _a.timezone;
        return __awaiter(this, void 0, void 0, function () {
            var insertIntoChatResponse;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.db
                            .insert(schema_1.chats)
                            .values({
                            chat_name: chatName,
                            createdAt: created_at,
                            timezone: timezone
                        })
                            .returning({
                            id: schema_1.chats.pk_chats_id,
                            chat_name: schema_1.chats.chat_name,
                            createdAt: schema_1.chats.createdAt,
                            timezone: schema_1.chats.timezone,
                            pk_chats_id: schema_1.chats.pk_chats_id
                        })];
                    case 1:
                        insertIntoChatResponse = _b.sent();
                        return [2 /*return*/, insertIntoChatResponse];
                }
            });
        });
    };
    /**
     * @description Creates a new chat room with the specified name and user ID.
     * @param {string} chatName - The name of the chat room.
     * @param {number} userId - The ID of the user.
     * @returns {Promise<{ id: number }>} - The ID of the newly created chat room.
     */
    QueryHandlers.prototype.createNewChatroomRoomNameAndByUserId = function (chatData) {
        return __awaiter(this, void 0, Promise, function () {
            var chatName, userId, created_at, timezone, chatroomExist, insertIntoChatResponse, chatResponse, chatId, chatRoom, err_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        chatName = chatData.chatName, userId = chatData.userId, created_at = chatData.created_at, timezone = chatData.timezone;
                        if (!this.isValidInput(chatName, userId)) {
                            // TODO: ADD logging to the repo
                            return [2 /*return*/, {
                                    error: true,
                                    reason: 'Invalid input',
                                    userId: userId
                                }];
                        }
                        if (timezone === undefined || created_at === undefined) {
                            return [2 /*return*/, {
                                    error: true,
                                    reason: "Bad Request: timezone, and created_at are required to create a chat room"
                                }];
                        }
                        return [4 /*yield*/, this.selectChatByChatName(chatName)];
                    case 1:
                        chatroomExist = _a.sent();
                        if (chatroomExist.length > 0) {
                            return [2 /*return*/, {
                                    error: true,
                                    reason: 'Chatroom already exists',
                                    userId: userId
                                }];
                        }
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 6, , 7]);
                        return [4 /*yield*/, this.createNewChatRoom({
                                chatName: chatName,
                                timezone: timezone,
                                created_at: created_at
                            })];
                    case 3:
                        insertIntoChatResponse = _a.sent();
                        chatResponse = insertIntoChatResponse[0];
                        chatId = chatResponse.id;
                        return [4 /*yield*/, this.db.execute(drizzle_orm_1.sql(templateObject_2 || (templateObject_2 = __makeTemplateObject(["\n          INSERT INTO ", " (fk_chat_id, fk_user_id, added_at, timezone)\n          SELECT ", ", ", ", ", ", ", "\n          WHERE NOT EXISTS (\n            SELECT 1 FROM ", " WHERE fk_chat_id = ", " AND fk_user_id = ", "\n          );\n        "], ["\n          INSERT INTO ", " (fk_chat_id, fk_user_id, added_at, timezone)\n          SELECT ", ", ", ", ", ", ", "\n          WHERE NOT EXISTS (\n            SELECT 1 FROM ", " WHERE fk_chat_id = ", " AND fk_user_id = ", "\n          );\n        "])), schema_1.chatMembers, chatId, userId, created_at, timezone, schema_1.chatMembers, chatId, userId))];
                    case 4:
                        _a.sent();
                        return [4 /*yield*/, this.db
                                .select({
                                pk_chats_id: schema_1.chats.pk_chats_id,
                                chat_name: schema_1.chats.chat_name,
                                createdAt: schema_1.chats.createdAt
                            })
                                .from(schema_1.chats)
                                .where(drizzle_orm_1.eq(schema_1.chats.pk_chats_id, chatId))];
                    case 5:
                        chatRoom = _a.sent();
                        return [2 /*return*/, {
                                chats: chatRoom
                            }];
                    case 6:
                        err_4 = _a.sent();
                        return [2 /*return*/, __assign(__assign({}, err_4), { error: true, reason: err_4.message })];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * @description - Get all chat rooms
     * @example
     * const chatRooms = await getAllChatRooms();
     * console.log(chatRooms);
     * // Output: [{ id: '...', chat_name: '...' }]
     * @returns {Promise<ChatType[]>}
     * @memberof QueryHandlers
     */
    QueryHandlers.prototype.getAllChatRooms = function () {
        return __awaiter(this, void 0, Promise, function () {
            var chatRooms, err_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.db.select().from(schema_1.chats)];
                    case 1:
                        chatRooms = _a.sent();
                        return [2 /*return*/, chatRooms];
                    case 2:
                        err_5 = _a.sent();
                        if (typeof err_5 === 'object' && Object.keys(err_5).length > 0) {
                            return [2 /*return*/, __assign(__assign({}, err_5), { error: true, reason: err_5.message })];
                        }
                        return [2 /*return*/, err_5];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * @description Retrieves all private chat rooms for a specific user.
     * @param {number} userId - The ID of the user.
     * @returns {Promise<unknown[] | { error: boolean; reason: string }>} - An array of private chat rooms or an error object.
     */
    QueryHandlers.prototype.getAllPrivateChatRooms = function (_a) {
        var userId = _a.userId;
        return __awaiter(this, void 0, Promise, function () {
            var allUsers, err_6;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.db
                                .select({
                                pk_user_id: schema_1.user.pk_user_id,
                                name: schema_1.user.name,
                                email: schema_1.user.email,
                                unique_chat_key: schema_1.privateChats.unique_chat_key
                            })
                                .from(schema_1.user)
                                .leftJoin(schema_1.privateChats, drizzle_orm_1.or(drizzle_orm_1.eq(schema_1.privateChats.user_a_id, schema_1.user.pk_user_id), drizzle_orm_1.eq(schema_1.privateChats.user_b_id, schema_1.user.pk_user_id)))
                                .where(drizzle_orm_1.ne(schema_1.user.pk_user_id, userId))];
                    case 1:
                        allUsers = _b.sent();
                        return [2 /*return*/, allUsers];
                    case 2:
                        err_6 = _b.sent();
                        if (typeof err_6 === 'object' && Object.keys(err_6).length > 0) {
                            return [2 /*return*/, __assign(__assign({}, err_6), { error: true, reason: err_6.message })];
                        }
                        return [2 /*return*/, err_6];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * @description Retrieves the latest private chat messages sent by a user.
     * @param {number} userId - The ID of the user.
     * @returns {Promise<PrivateChatResult[]>} - An array of private chat messages.
     */
    QueryHandlers.prototype.getLatestPrivateChatMessagesSent = function (_a) {
        var userId = _a.userId;
        return __awaiter(this, void 0, Promise, function () {
            var latest_messages, sortedPrivateChatData, recipientIds, allRecipients, allRecipientMap_1, returnData, seenRecipients_1, uniqueRecipients, err_7;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, this.db.execute(drizzle_orm_1.sql(templateObject_3 || (templateObject_3 = __makeTemplateObject(["\n      SELECT *\n        FROM (\n          SELECT DISTINCT ON (c.unique_chat_key)\n            json_build_object(\n              'pk_private_chat_id', c.pk_private_chat_id,\n              'user_a_id', c.user_a_id,\n              'user_b_id', c.user_b_id,\n              'unique_chat_key', c.unique_chat_key,\n              'created_at', c.created_at -- from private_chat table\n            ) AS private_chat,\n            json_build_object(\n              'pk_user_id', u_other.pk_user_id,\n              'name', u_other.name,\n              'email', u_other.email,\n              'created_at', u_other.created_at -- from chat_user table (u_other)\n            ) AS chat_user,\n            json_build_object(\n              'id', m.id,\n              'fk_private_chat_id', m.fk_private_chat_id,\n              'fk_user_id', m.fk_user_id,\n              'message_text', m.message_text,\n              'sent_at', m.sent_at, -- from private_messages table\n              'timezone', m.timezone\n            ) AS private_messages,\n            m.sent_at -- This is private_messages.sent_at, used for outer sort\n          FROM private_chat c\n          JOIN private_messages m\n            ON m.fk_private_chat_unique_key = c.unique_chat_key\n          LEFT JOIN chat_user u_other\n            ON u_other.pk_user_id = \n              CASE \n                WHEN c.user_a_id = ", " THEN c.user_b_id\n                ELSE c.user_a_id\n              END\n          WHERE c.user_a_id = ", " OR c.user_b_id = ", "\n          ORDER BY c.unique_chat_key, m.sent_at DESC \n        ) as aggregatedData3\n        ORDER BY sent_at DESC;\n\n    "], ["\n      SELECT *\n        FROM (\n          SELECT DISTINCT ON (c.unique_chat_key)\n            json_build_object(\n              'pk_private_chat_id', c.pk_private_chat_id,\n              'user_a_id', c.user_a_id,\n              'user_b_id', c.user_b_id,\n              'unique_chat_key', c.unique_chat_key,\n              'created_at', c.created_at -- from private_chat table\n            ) AS private_chat,\n            json_build_object(\n              'pk_user_id', u_other.pk_user_id,\n              'name', u_other.name,\n              'email', u_other.email,\n              'created_at', u_other.created_at -- from chat_user table (u_other)\n            ) AS chat_user,\n            json_build_object(\n              'id', m.id,\n              'fk_private_chat_id', m.fk_private_chat_id,\n              'fk_user_id', m.fk_user_id,\n              'message_text', m.message_text,\n              'sent_at', m.sent_at, -- from private_messages table\n              'timezone', m.timezone\n            ) AS private_messages,\n            m.sent_at -- This is private_messages.sent_at, used for outer sort\n          FROM private_chat c\n          JOIN private_messages m\n            ON m.fk_private_chat_unique_key = c.unique_chat_key\n          LEFT JOIN chat_user u_other\n            ON u_other.pk_user_id = \n              CASE \n                WHEN c.user_a_id = ", " THEN c.user_b_id\n                ELSE c.user_a_id\n              END\n          WHERE c.user_a_id = ", " OR c.user_b_id = ", "\n          ORDER BY c.unique_chat_key, m.sent_at DESC \n        ) as aggregatedData3\n        ORDER BY sent_at DESC;\n\n    "])), userId, userId, userId))];
                    case 1:
                        latest_messages = _b.sent();
                        // return early
                        if (!latest_messages.rows || latest_messages.rows.length === 0) {
                            return [2 /*return*/, []];
                        }
                        sortedPrivateChatData = latest_messages.rows.map(function (row) { return ({
                            private_chat: row.private_chat,
                            chat_user: row.chat_user,
                            private_messages: row.private_messages
                        }); });
                        recipientIds = new Set(sortedPrivateChatData.map(function (data) {
                            // if the current user is the sender, then get the recipient id, otherwise get the sender id
                            return data.private_chat.user_a_id === userId
                                ? data.private_chat.user_b_id
                                : data.private_chat.user_a_id;
                        }));
                        if (recipientIds.size === 0) {
                            return [2 /*return*/, []];
                        }
                        return [4 /*yield*/, this.db
                                .select({
                                recipient: {
                                    pk_user_id: schema_1.user.pk_user_id,
                                    name: schema_1.user.name,
                                    email: schema_1.user.email,
                                    created_at: schema_1.user.created_at
                                }
                            })
                                .from(schema_1.user)
                                .where(drizzle_orm_1.inArray(schema_1.user.pk_user_id, Array.from(recipientIds).map(function (id) { return id; })))];
                    case 2:
                        allRecipients = _b.sent();
                        allRecipientMap_1 = new Map(allRecipients.map(function (recipient) { return [recipient.recipient.pk_user_id, recipient.recipient]; }));
                        returnData = sortedPrivateChatData.map(function (data) {
                            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t;
                            // Get the ID of the other user in the private chat
                            var otherPrivateChatUserId = data.private_chat.user_a_id === userId
                                ? data.private_chat.user_b_id
                                : data.private_chat.user_a_id;
                            // Get the recipient details from the allRecipients array
                            var recipientDetails = allRecipientMap_1.get(otherPrivateChatUserId);
                            return {
                                private_chat: {
                                    pk_private_chat_id: data.private_chat.pk_private_chat_id,
                                    user_a_id: data.private_chat.user_a_id,
                                    user_b_id: data.private_chat.user_b_id,
                                    created_at: data.private_chat.created_at,
                                    unique_chat_key: data.private_chat.unique_chat_key
                                },
                                chat_user: {
                                    pk_user_id: (_a = data.chat_user) === null || _a === void 0 ? void 0 : _a.pk_user_id,
                                    name: (_c = (_b = data.chat_user) === null || _b === void 0 ? void 0 : _b.name) !== null && _c !== void 0 ? _c : '',
                                    email: (_e = (_d = data.chat_user) === null || _d === void 0 ? void 0 : _d.email) !== null && _e !== void 0 ? _e : '',
                                    created_at: (_g = (_f = data.chat_user) === null || _f === void 0 ? void 0 : _f.created_at) !== null && _g !== void 0 ? _g : ''
                                },
                                private_messages: {
                                    id: (_h = data.private_messages) === null || _h === void 0 ? void 0 : _h.id,
                                    fk_private_chat_id: (_k = (_j = data.private_messages) === null || _j === void 0 ? void 0 : _j.fk_private_chat_id) !== null && _k !== void 0 ? _k : '',
                                    fk_user_id: (_m = (_l = data.private_messages) === null || _l === void 0 ? void 0 : _l.fk_user_id) !== null && _m !== void 0 ? _m : '',
                                    message_text: (_p = (_o = data.private_messages) === null || _o === void 0 ? void 0 : _o.message_text) !== null && _p !== void 0 ? _p : '',
                                    sent_at: (_r = (_q = data.private_messages) === null || _q === void 0 ? void 0 : _q.sent_at) !== null && _r !== void 0 ? _r : '',
                                    timezone: (_t = (_s = data.private_messages) === null || _s === void 0 ? void 0 : _s.timezone) !== null && _t !== void 0 ? _t : ''
                                },
                                recipient: recipientDetails
                            };
                        });
                        seenRecipients_1 = new Map();
                        uniqueRecipients = returnData
                            .filter(function (item) {
                            var _a;
                            var recipientId = (_a = item.recipient) === null || _a === void 0 ? void 0 : _a.pk_user_id;
                            if (!recipientId || seenRecipients_1.has(recipientId))
                                return false;
                            seenRecipients_1.set(recipientId, true);
                            return true;
                        })
                            .map(function (item) {
                            var _a, _b;
                            return (__assign(__assign({}, item), { recipient: __assign(__assign({}, item.recipient), { pk_user_id: (_b = (_a = item.recipient) === null || _a === void 0 ? void 0 : _a.pk_user_id) !== null && _b !== void 0 ? _b : 0 }) }));
                        });
                        return [2 /*return*/, uniqueRecipients];
                    case 3:
                        err_7 = _b.sent();
                        if (typeof err_7 === 'object' && Object.keys(err_7).length > 0) {
                            return [2 /*return*/, __assign(__assign({}, err_7), { error: true, reason: err_7.message })];
                        }
                        return [2 /*return*/, {
                                error: true,
                                reason: err_7.message
                            }];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * @description Retrieves user details by a list of user IDs.
     * @param {number[]} userIdList - An array of user IDs.
     * @returns {Promise<{ name: string | null; pk_user_id: number; email: string | null; password: string | null; created_at: Date; updated_at: Date; }[][]>} - An array of user details.
     */
    QueryHandlers.prototype.getUserByUserIds = function (_a) {
        var userAId = _a.userAId, userBId = _a.userBId;
        return __awaiter(this, void 0, Promise, function () {
            var userListPromises, userListResponse;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        userListPromises = [
                            this.db.select().from(schema_1.user).where(drizzle_orm_1.eq(schema_1.user.pk_user_id, userAId)),
                            this.db.select().from(schema_1.user).where(drizzle_orm_1.eq(schema_1.user.pk_user_id, userBId)),
                        ];
                        return [4 /*yield*/, Promise.all(userListPromises)];
                    case 1:
                        userListResponse = _b.sent();
                        return [2 /*return*/, userListResponse.map(function (user) {
                                return user.map(function (user) { return ({
                                    name: user.name,
                                    pk_user_id: user.pk_user_id,
                                    email: user.email,
                                    password: user.password,
                                    created_at: user.created_at,
                                    updated_at: user.updated_at,
                                    timezone: user.timezone
                                }); });
                            })];
                }
            });
        });
    };
    /**
     * @description Retrieves a private chat entry by unique chat key.
     * @param {string} uniqueChatKey - The unique chat key.
     * @returns {Promise<{ pk_private_chat_id: number; user_a_id: number; user_b_id: number; created_at: Date; unique_chat_key: string }>} - The private chat entry.
     */
    QueryHandlers.prototype.getPrivateChatEntryByUniquePrivateChatKey = function (_a) {
        var uniquePrivateChatKey = _a.uniquePrivateChatKey;
        return __awaiter(this, void 0, Promise, function () {
            var privateChatEntry, err_8;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.db
                                .select()
                                .from(schema_1.privateChats)
                                .where(drizzle_orm_1.eq(schema_1.privateChats.unique_chat_key, uniquePrivateChatKey))];
                    case 1:
                        privateChatEntry = _b.sent();
                        return [2 /*return*/, privateChatEntry];
                    case 2:
                        err_8 = _b.sent();
                        if (typeof err_8 === 'object' && Object.keys(err_8).length > 0) {
                            return [2 /*return*/, __assign(__assign({}, err_8), { error: true, reason: err_8.message })];
                        }
                        return [2 /*return*/, err_8];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * @description Creates a new private chat entry.
     * @param {UserBase} sender - The sender of the chat.
     * @param {UserBase} receiver - The receiver of the chat.
     * @returns {Promise<{ pk_private_chat_id: number; user_a_id: number; user_b_id: number; created_at: Date; unique_chat_key: string }>} - The created chat entry.
     */
    QueryHandlers.prototype.createPrivateChatEntry = function (sender, receiver, uniquePrivateChatKey) {
        return __awaiter(this, void 0, Promise, function () {
            var existingEntry, _a, user_a_id, user_b_id;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.getPrivateChatEntryByUniquePrivateChatKey({
                            uniquePrivateChatKey: uniquePrivateChatKey
                        })];
                    case 1:
                        existingEntry = _b.sent();
                        if (existingEntry.length > 0) {
                            return [2 /*return*/, existingEntry];
                        }
                        _a = [sender.pk_user_id, receiver.pk_user_id].sort(function (a, b) { return a - b; }), user_a_id = _a[0], user_b_id = _a[1];
                        return [4 /*yield*/, this.db
                                .insert(schema_1.privateChats)
                                .values({
                                user_a_id: user_a_id,
                                user_b_id: user_b_id,
                                created_at: sender.created_at,
                                timezone: sender.timezone,
                                unique_chat_key: obfuscated_chat_key_1.ObfuscatedChatKey.getObfuscatedChatKey(user_a_id, user_b_id)
                            })
                                .returning({
                                pk_private_chat_id: schema_1.privateChats.pk_private_chat_id,
                                user_a_id: schema_1.privateChats.user_a_id,
                                user_b_id: schema_1.privateChats.user_b_id,
                                created_at: schema_1.privateChats.created_at,
                                timezone: schema_1.privateChats.timezone,
                                unique_chat_key: schema_1.privateChats.unique_chat_key
                            })];
                    case 2: return [2 /*return*/, _b.sent()];
                }
            });
        });
    };
    /**
     * @description Creates a new private message.
     * @param {PrivateChatsInsertResponse} privateChatsInsertResponse - The response from creating a private chat.
     * @param {number} senderId - The ID of the sender.
     * @param {string} message - The message to be sent.
     * @param {Buffer | undefined} imageFile - The image file to be sent.
     * @param {string | undefined} imageName - The name of the image file.
     * @returns {Promise<{ id: number; fk_private_chat_id: number; fk_user_id: number; message_text: string; sent_at: Date; image_file: Buffer | null; image_name: string | null; }>} - The created message.
     */
    QueryHandlers.prototype.createPrivateMessage = function (_a) {
        var privateChatsInsertResponse = _a.privateChatsInsertResponse, senderId = _a.senderId, message = _a.message, created_at = _a.created_at, timezone = _a.timezone, imageFile = _a.imageFile, imageName = _a.imageName;
        return __awaiter(this, void 0, void 0, function () {
            var imageProcessingPromise, dbInsertPromise, _b, processedImage, dbResponse, bucketResponse, SUPABASE_BUCKET_URL, fullFilePath, updateResponse, err_9;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _c.trys.push([0, 5, , 6]);
                        imageProcessingPromise = null;
                        // Start image processing early
                        if (imageFile) {
                            imageProcessingPromise = this.processImageForStorage(imageFile);
                        }
                        dbInsertPromise = this.db
                            .insert(schema_1.privateMessages)
                            .values({
                            fk_private_chat_id: privateChatsInsertResponse.pk_private_chat_id,
                            fk_user_id: senderId,
                            message_text: message,
                            image_file: null,
                            image_name: imageName,
                            image_url: null,
                            sent_at: created_at,
                            timezone: timezone,
                            fk_private_chat_unique_key: privateChatsInsertResponse.unique_chat_key
                        })
                            .returning({
                            id: schema_1.privateMessages.id,
                            fk_private_chat_id: schema_1.privateMessages.fk_private_chat_id,
                            fk_user_id: schema_1.privateMessages.fk_user_id,
                            message_text: schema_1.privateMessages.message_text,
                            sent_at: schema_1.privateMessages.sent_at,
                            timezone: schema_1.privateMessages.timezone,
                            image_file: schema_1.privateMessages.image_file,
                            image_name: schema_1.privateMessages.image_name,
                            image_url: schema_1.privateMessages.image_url
                        });
                        return [4 /*yield*/, Promise.all([
                                imageProcessingPromise,
                                dbInsertPromise,
                            ])];
                    case 1:
                        _b = _c.sent(), processedImage = _b[0], dbResponse = _b[1];
                        if (!(processedImage && imageName)) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.uploadImageToPrivateImageBucket(processedImage, imageName)];
                    case 2:
                        bucketResponse = _c.sent();
                        if (!bucketResponse) return [3 /*break*/, 4];
                        SUPABASE_BUCKET_URL = get_envs_1.getEnvs().SUPABASE_BUCKET_URL;
                        fullFilePath = SUPABASE_BUCKET_URL + "/storage/v1/object/public/" + bucketResponse.fullPath;
                        return [4 /*yield*/, this.db
                                .update(schema_1.privateMessages)
                                .set({ image_url: fullFilePath })
                                .where(drizzle_orm_1.eq(schema_1.privateMessages.id, dbResponse[0].id))
                                .returning({
                                id: schema_1.privateMessages.id,
                                fk_private_chat_id: schema_1.privateMessages.fk_private_chat_id,
                                fk_user_id: schema_1.privateMessages.fk_user_id,
                                message_text: schema_1.privateMessages.message_text,
                                sent_at: schema_1.privateMessages.sent_at,
                                timezone: schema_1.privateMessages.timezone,
                                image_file: schema_1.privateMessages.image_file,
                                image_name: schema_1.privateMessages.image_name,
                                image_url: schema_1.privateMessages.image_url
                            })];
                    case 3:
                        updateResponse = _c.sent();
                        dbResponse[0].image_url = fullFilePath;
                        return [2 /*return*/, updateResponse];
                    case 4: return [2 /*return*/, dbResponse];
                    case 5:
                        err_9 = _c.sent();
                        Sentry.captureException(err_9, {
                            tags: {
                                method: 'createPrivateMessage',
                                senderId: senderId
                            }
                        });
                        return [2 /*return*/, {
                                error: true,
                                reason: err_9.message
                            }];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    return QueryHandlers;
}(auth_models_1.UserSchema));
exports.QueryHandlers = QueryHandlers;
exports["default"] = QueryHandlers;
var templateObject_1, templateObject_2, templateObject_3;
