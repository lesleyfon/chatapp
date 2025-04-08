"use strict";
!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[n]="d45e3f5a-6e53-5338-8e31-8c63b806d4f5")}catch(e){}}();

Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryHandlers = void 0;
const drizzle_orm_1 = require("drizzle-orm");
const db_1 = require("../db");
const schema_1 = require("../schema");
const Auth_model_1 = require("./Auth.model");
class QueryHandlers extends Auth_model_1.UserSchema {
    constructor() {
        super();
        this.db = (0, db_1.connectToDB)();
    }
    isValidInput(...args) {
        return args.every((arg) => (typeof arg === "string" && arg.trim() !== "") ||
            typeof arg === "number");
    }
    async insertMessageToTable({ chatId, user_id, message, sent_at, timezone, }) {
        const [messageResponse] = await Promise.all([
            this.db
                .insert(schema_1.messages)
                .values({
                fk_chat_id: chatId,
                fk_user_id: user_id,
                message_text: message,
                sent_at: sent_at,
                timezone: timezone,
            })
                .returning({
                id: schema_1.messages.id,
                sent_at: schema_1.messages.sent_at,
                fk_user_id: schema_1.messages.fk_user_id,
                fk_chat_id: schema_1.messages.fk_chat_id,
                message_text: schema_1.messages.message_text,
            }),
            this.db.execute((0, drizzle_orm_1.sql) `
        INSERT INTO ${schema_1.chatMembers} (fk_chat_id, fk_user_id, added_at, timezone)
        SELECT ${chatId}, ${user_id}, ${sent_at}, ${timezone}
        WHERE NOT EXISTS (
          SELECT 1 FROM ${schema_1.chatMembers} WHERE fk_chat_id = ${chatId} AND fk_user_id = ${user_id}
        );
      `),
        ]);
        return messageResponse;
    }
    async selectUserChatRoomsWithLastSetMessages(userId) {
        const chatList = await this.db
            .select({
            chat_members: {
                added_at: schema_1.chatMembers.added_at,
                fk_chat_id: schema_1.chatMembers.fk_chat_id,
                fk_user_id: schema_1.chatMembers.fk_user_id,
                id: schema_1.chatMembers.id,
            },
            chats: {
                pk_chats_id: schema_1.chats.pk_chats_id,
                chat_name: schema_1.chats.chat_name,
                createdAt: schema_1.chats.createdAt,
            },
            chat_user: {
                created_at: schema_1.user.created_at,
                email: schema_1.user.email,
                name: schema_1.user.name,
                pk_user_id: schema_1.user.pk_user_id,
            },
        })
            .from(schema_1.chatMembers)
            .where((0, drizzle_orm_1.eq)(schema_1.chatMembers.fk_user_id, userId))
            .leftJoin(schema_1.user, (0, drizzle_orm_1.eq)(schema_1.user.pk_user_id, userId))
            .leftJoin(schema_1.chats, (0, drizzle_orm_1.eq)(schema_1.chats.pk_chats_id, schema_1.chatMembers.fk_chat_id));
        const chatListPromises = chatList.map(async (chat) => {
            var _a, _b;
            const mostRecentMessages = await this.db
                .select()
                .from(schema_1.messages)
                .where((0, drizzle_orm_1.eq)(schema_1.messages.fk_chat_id, (_b = (_a = chat.chats) === null || _a === void 0 ? void 0 : _a.pk_chats_id) !== null && _b !== void 0 ? _b : 0))
                .orderBy((0, drizzle_orm_1.desc)(schema_1.messages.sent_at))
                .limit(1);
            return Object.assign(Object.assign({}, chat), { messages: mostRecentMessages[0] });
        });
        const updatedChatList = await Promise.all(chatListPromises);
        const response = updatedChatList.filter((chat) => chat.messages);
        response.sort((a, b) => {
            return a.messages.sent_at > b.messages.sent_at ? -1 : 1;
        });
        return response.slice(0, 5);
    }
    async getLatestChatRoomMessageSent(userId, chatRoomId) {
        const chatList = await this.db
            .select({
            chats: {
                chat_name: schema_1.chats.chat_name,
                createdAt: schema_1.chats.createdAt,
                pk_chats_id: schema_1.chats.pk_chats_id,
            },
            chat_user: {
                created_at: schema_1.user.created_at,
                email: schema_1.user.email,
                name: schema_1.user.name,
                pk_user_id: schema_1.user.pk_user_id,
            },
            messages: {
                fk_chat_id: schema_1.messages.fk_chat_id,
                fk_user_id: schema_1.messages.fk_user_id,
                id: schema_1.messages.id,
                message_text: schema_1.messages.message_text,
                sent_at: schema_1.messages.sent_at,
            },
        })
            .from(schema_1.chats)
            .where((0, drizzle_orm_1.eq)(schema_1.chats.pk_chats_id, chatRoomId))
            .leftJoin(schema_1.messages, (0, drizzle_orm_1.eq)(schema_1.messages.fk_chat_id, schema_1.chats.pk_chats_id))
            .leftJoin(schema_1.user, (0, drizzle_orm_1.eq)(schema_1.user.pk_user_id, userId))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.messages.sent_at))
            .limit(1);
        const response = chatList.filter((chat) => chat.messages);
        response.sort((a, b) => {
            var _a, _b, _c, _d;
            return ((_b = (_a = a.messages) === null || _a === void 0 ? void 0 : _a.sent_at) !== null && _b !== void 0 ? _b : 0) > ((_d = (_c = b.messages) === null || _c === void 0 ? void 0 : _c.sent_at) !== null && _d !== void 0 ? _d : 0) ? -1 : 1;
        });
        return response;
    }
    async selectChatByChatName(chatName) {
        const chatExist = await this.db
            .select()
            .from(schema_1.chats)
            .where((0, drizzle_orm_1.eq)(schema_1.chats.chat_name, chatName));
        return chatExist;
    }
    async selectChatRoomMessagesByUserId(userId, chatRoomId) {
        try {
            const chatRoomExist = await this.db
                .select()
                .from(schema_1.chats)
                .where((0, drizzle_orm_1.eq)(schema_1.chats.pk_chats_id, chatRoomId));
            if (!chatRoomExist.length) {
                return {
                    error: true,
                    reason: "Chat room does not exist",
                };
            }
            const chatRoomMessages = await this.db
                .select({
                chats: {
                    pk_chats_id: schema_1.chats.pk_chats_id,
                    chat_name: schema_1.chats.chat_name,
                    createdAt: schema_1.chats.createdAt,
                },
                messages: {
                    id: schema_1.messages.id,
                    fk_chat_id: schema_1.messages.fk_chat_id,
                    message_text: schema_1.messages.message_text,
                    sent_at: schema_1.messages.sent_at,
                },
                chat_user: {
                    pk_user_id: schema_1.user.pk_user_id,
                    name: schema_1.user.name,
                    email: schema_1.user.email,
                    created_at: schema_1.user.created_at,
                },
            })
                .from(schema_1.chats)
                .where((0, drizzle_orm_1.eq)(schema_1.chats.pk_chats_id, chatRoomId))
                .orderBy((0, drizzle_orm_1.asc)(schema_1.messages.sent_at))
                .leftJoin(schema_1.messages, (0, drizzle_orm_1.eq)(schema_1.chats.pk_chats_id, schema_1.messages.fk_chat_id))
                .leftJoin(schema_1.user, (0, drizzle_orm_1.eq)(schema_1.messages.fk_user_id, schema_1.user.pk_user_id));
            const mappedMessages = chatRoomMessages.map((data) => {
                var _a;
                const dataUserId = (_a = data.chat_user) === null || _a === void 0 ? void 0 : _a.pk_user_id;
                if (dataUserId === userId) {
                    data.chat_user.sender = "You";
                }
                return {
                    chats: Object.assign(Object.assign({}, data.chats), { pk_chats_id: data.chats.pk_chats_id }),
                    messages: data.messages && Object.assign(Object.assign({}, data.messages), { fk_chat_id: data.messages.fk_chat_id }),
                    chat_user: data.chat_user,
                };
            });
            const typedMessages = mappedMessages.map((msg) => {
                var _a, _b;
                return (Object.assign(Object.assign({}, msg), { messages: msg.messages
                        ? Object.assign(Object.assign({}, msg.messages), { fk_user_id: (_b = (_a = msg.chat_user) === null || _a === void 0 ? void 0 : _a.pk_user_id) !== null && _b !== void 0 ? _b : 0 }) : null, chat_user: msg.chat_user
                        ? Object.assign(Object.assign({}, msg.chat_user), { pk_user_id: msg.chat_user.pk_user_id }) : null }));
            });
            return typedMessages;
        }
        catch (err) {
            if (typeof err === "object" && Object.keys(err).length) {
                return Object.assign(Object.assign({}, err), { error: true, reason: err.message });
            }
            return err;
        }
    }
    async getPrivateRoomMessagesBySenderId({ userId, recipientId, }) {
        var _a, _b;
        try {
            const recipientExist = await this.db
                .select()
                .from(schema_1.user)
                .where((0, drizzle_orm_1.eq)(schema_1.user.pk_user_id, recipientId));
            if (!recipientExist.length) {
                return {
                    error: true,
                    reason: "Recipient does not exist",
                };
            }
            const chatRoomMessages = await this.db
                .select({
                private_chat: {
                    pk_chats_id: schema_1.privateChats.pk_private_chat_id,
                    createdAt: schema_1.privateChats.created_at,
                    sender_id: schema_1.privateChats.sender_id,
                    recipient_id: schema_1.privateChats.recipient_id,
                },
                private_messages: {
                    id: schema_1.privateMessages.id,
                    fk_private_chat_id: schema_1.privateMessages.fk_private_chat_id,
                    message_text: schema_1.privateMessages.message_text,
                    sent_at: schema_1.privateMessages.sent_at,
                    fk_user_id: schema_1.privateMessages.fk_user_id,
                    image_file: schema_1.privateMessages.image_file,
                    image_name: schema_1.privateMessages.image_name,
                    timezone: schema_1.privateMessages.timezone,
                },
            })
                .from(schema_1.privateChats)
                .where((0, drizzle_orm_1.or)((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.privateChats.sender_id, userId), (0, drizzle_orm_1.eq)(schema_1.privateChats.recipient_id, recipientId)), (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.privateChats.recipient_id, userId), (0, drizzle_orm_1.eq)(schema_1.privateChats.sender_id, recipientId))))
                .leftJoin(schema_1.privateMessages, (0, drizzle_orm_1.eq)(schema_1.privateChats.pk_private_chat_id, (0, drizzle_orm_1.sql) `cast(${schema_1.privateMessages.fk_private_chat_id} as int)`))
                .orderBy((0, drizzle_orm_1.asc)(schema_1.privateMessages.sent_at));
            const privateUserDetails = await this.db
                .select({
                pk_user_id: schema_1.user.pk_user_id,
                name: schema_1.user.name,
                email: schema_1.user.email,
                created_at: schema_1.user.created_at,
            })
                .from(schema_1.user)
                .where((0, drizzle_orm_1.or)((0, drizzle_orm_1.eq)(schema_1.user.pk_user_id, userId), (0, drizzle_orm_1.eq)(schema_1.user.pk_user_id, recipientId)));
            const usersMap = new Map([
                [String((_a = privateUserDetails[0]) === null || _a === void 0 ? void 0 : _a.pk_user_id), privateUserDetails[0]],
                [String((_b = privateUserDetails[1]) === null || _b === void 0 ? void 0 : _b.pk_user_id), privateUserDetails[1]],
            ]);
            const mappedMessages = chatRoomMessages.map((data) => {
                var _a, _b, _c, _d;
                const user_id = (_b = (_a = data.private_messages) === null || _a === void 0 ? void 0 : _a.fk_user_id) !== null && _b !== void 0 ? _b : "";
                const chat_user = usersMap.get(user_id.toString());
                if ((_c = data.private_messages) === null || _c === void 0 ? void 0 : _c.image_file) {
                    if (Buffer.isBuffer(data.private_messages.image_file)) {
                        const base64Image = data.private_messages.image_file.toString("base64");
                        data.private_messages.image_file = base64Image;
                    }
                }
                return {
                    private_chat: {
                        pk_private_chat_id: data.private_chat.pk_chats_id,
                        created_at: data.private_chat.createdAt,
                        sender_id: data.private_chat.sender_id,
                        recipient_id: data.private_chat.recipient_id,
                    },
                    private_messages: data.private_messages,
                    chat_user: chat_user
                        ? Object.assign(Object.assign({}, chat_user), { pk_user_id: chat_user.pk_user_id, sender: ((_d = data.private_messages) === null || _d === void 0 ? void 0 : _d.fk_user_id) === userId ? "You" : "" }) : null,
                };
            });
            return mappedMessages.filter((data) => data.private_messages && data.private_chat && data.chat_user);
        }
        catch (err) {
            if (typeof err === "object" && Object.keys(err).length) {
                return Object.assign(Object.assign({}, err), { error: true, reason: err.message });
            }
            return err;
        }
    }
    async getMostRecentChatMessageSent(messageResponse) {
        const messageResponseObj = messageResponse[0];
        const chatRoomMessages = await this.db
            .select({
            pk_user_id: schema_1.user.pk_user_id,
            name: schema_1.user.name,
            email: schema_1.user.email,
        })
            .from(schema_1.user)
            .where((0, drizzle_orm_1.eq)(schema_1.user.pk_user_id, messageResponseObj.fk_user_id));
        return [
            {
                messages: messageResponseObj,
                chat_user: chatRoomMessages[0],
            },
        ];
    }
    async createNewChatRoom({ chatName, created_at, timezone, }) {
        const insertIntoChatResponse = await this.db
            .insert(schema_1.chats)
            .values({
            chat_name: chatName,
            createdAt: created_at,
            timezone: timezone,
        })
            .returning({
            id: schema_1.chats.pk_chats_id,
            chat_name: schema_1.chats.chat_name,
            createdAt: schema_1.chats.createdAt,
            timezone: schema_1.chats.timezone,
        });
        return insertIntoChatResponse;
    }
    async createNewChatroomRoomNameAndByUserId(chatData) {
        const { chatName, userId, created_at, timezone } = chatData;
        if (!this.isValidInput(chatName, userId)) {
            return {
                error: true,
                reason: "Invalid input",
                userId,
            };
        }
        if (timezone === undefined || created_at === undefined) {
            return {
                error: true,
                reason: `Bad Request: timezone, and created_at are required to create a chat room`,
            };
        }
        const chatroomExist = await this.selectChatByChatName(chatName);
        if (chatroomExist.length > 0) {
            return {
                error: true,
                reason: "Chatroom already exists",
                userId,
            };
        }
        try {
            const insertIntoChatResponse = await this.createNewChatRoom({
                chatName,
                timezone,
                created_at,
            });
            const chatResponse = insertIntoChatResponse[0];
            const chatId = chatResponse.id;
            await this.db.execute((0, drizzle_orm_1.sql) `
          INSERT INTO ${schema_1.chatMembers} (fk_chat_id, fk_user_id, added_at, timezone)
          SELECT ${chatId}, ${userId}, ${created_at}, ${timezone}
          WHERE NOT EXISTS (
            SELECT 1 FROM ${schema_1.chatMembers} WHERE fk_chat_id = ${chatId} AND fk_user_id = ${userId}
          );
        `);
            const chatRoom = await this.db
                .select({
                pk_chats_id: schema_1.chats.pk_chats_id,
                chat_name: schema_1.chats.chat_name,
                createdAt: schema_1.chats.createdAt,
            })
                .from(schema_1.chats)
                .where((0, drizzle_orm_1.eq)(schema_1.chats.pk_chats_id, chatId));
            return {
                chats: chatRoom,
            };
        }
        catch (err) {
            return Object.assign(Object.assign({}, err), { error: true, reason: err.message });
        }
    }
    async getAllChatRooms() {
        try {
            const chatRooms = await this.db.select().from(schema_1.chats);
            return chatRooms;
        }
        catch (err) {
            if (typeof err === "object" && Object.keys(err).length) {
                return Object.assign(Object.assign({}, err), { error: true, reason: err.message });
            }
            return err;
        }
    }
    async getAllPrivateChatRooms({ userId, }) {
        try {
            const allUsers = await this.db
                .select({
                pk_user_id: schema_1.user.pk_user_id,
                name: schema_1.user.name,
                email: schema_1.user.email,
            })
                .from(schema_1.user)
                .where((0, drizzle_orm_1.ne)(schema_1.user.pk_user_id, userId));
            return allUsers;
        }
        catch (err) {
            if (typeof err === "object" && Object.keys(err).length) {
                return Object.assign(Object.assign({}, err), { error: true, reason: err.message });
            }
            return err;
        }
    }
    async getPrivateChatsForUser(userId) {
        const latest_messages = await this.db.execute((0, drizzle_orm_1.sql) `
      SELECT *
      FROM (
        SELECT DISTINCT ON (
          LEAST(${schema_1.privateChats.sender_id}, ${schema_1.privateChats.recipient_id}),
          GREATEST(${schema_1.privateChats.sender_id}, ${schema_1.privateChats.recipient_id})
        )
          json_build_object(
            'pk_private_chat_id', ${schema_1.privateChats.pk_private_chat_id},
            'sender_id', ${schema_1.privateChats.sender_id},
            'recipient_id', ${schema_1.privateChats.recipient_id},
            'created_at', ${schema_1.privateChats.created_at}
          ) AS "private_chat",

          json_build_object(
            'pk_user_id', ${schema_1.user.pk_user_id},
            'name', ${schema_1.user.name},
            'email', ${schema_1.user.email},
            'created_at', ${schema_1.user.created_at}
          ) AS "chat_user",

          json_build_object(
            'id', ${schema_1.privateMessages.id},
            'fk_private_chat_id', ${schema_1.privateMessages.fk_private_chat_id},
            'fk_user_id', ${schema_1.privateMessages.fk_user_id},
            'message_text', ${schema_1.privateMessages.message_text},
            'sent_at', ${schema_1.privateMessages.sent_at}
          ) AS "private_messages",

          ${schema_1.privateMessages.sent_at} AS "_ordering_sent_at"  -- Hidden field for ordering

        FROM ${schema_1.privateMessages}
        LEFT JOIN ${schema_1.privateChats}
          ON ${schema_1.privateMessages.fk_private_chat_id} = ${schema_1.privateChats.pk_private_chat_id}
        LEFT JOIN ${schema_1.user}
          ON ${schema_1.user.pk_user_id} = ${userId}
        WHERE ${schema_1.privateChats.sender_id} = ${userId} OR ${schema_1.privateChats.recipient_id} = ${userId}
        ORDER BY
          LEAST(${schema_1.privateChats.sender_id}, ${schema_1.privateChats.recipient_id}),
          GREATEST(${schema_1.privateChats.sender_id}, ${schema_1.privateChats.recipient_id}),
          ${schema_1.privateMessages.sent_at} DESC
      ) AS latest_messages
      ORDER BY latest_messages."_ordering_sent_at" DESC
    `);
        const privateChatsData = latest_messages.rows;
        return privateChatsData;
    }
    async getLatestPrivateChatMessagesSent({ userId, }) {
        try {
            const latest_messages = await this.db.execute((0, drizzle_orm_1.sql) `
      SELECT *
      FROM (
        SELECT DISTINCT ON (
          LEAST(${schema_1.privateChats.sender_id}, ${schema_1.privateChats.recipient_id}),
          GREATEST(${schema_1.privateChats.sender_id}, ${schema_1.privateChats.recipient_id})
        )
          json_build_object(
            'pk_private_chat_id', ${schema_1.privateChats.pk_private_chat_id},
            'sender_id', ${schema_1.privateChats.sender_id},
            'recipient_id', ${schema_1.privateChats.recipient_id},
            'created_at', ${schema_1.privateChats.created_at}
          ) AS "private_chat",
          json_build_object(
            'pk_user_id', ${schema_1.user.pk_user_id},
            'name', ${schema_1.user.name},
            'email', ${schema_1.user.email},
            'created_at', ${schema_1.user.created_at}
          ) AS "chat_user",
          json_build_object(
            'id', ${schema_1.privateMessages.id},
            'fk_private_chat_id', ${schema_1.privateMessages.fk_private_chat_id},
            'fk_user_id', ${schema_1.privateMessages.fk_user_id},
            'message_text', ${schema_1.privateMessages.message_text},
            'sent_at', ${schema_1.privateMessages.sent_at},
            'timezone', ${schema_1.privateMessages.timezone}
          ) AS "private_messages",
          ${schema_1.privateMessages.sent_at} AS "_ordering_sent_at"  -- Hidden field for ordering
        FROM ${schema_1.privateMessages}
        LEFT JOIN ${schema_1.privateChats}
          ON ${schema_1.privateMessages.fk_private_chat_id} = ${schema_1.privateChats.pk_private_chat_id}
        LEFT JOIN ${schema_1.user}
          ON ${schema_1.user.pk_user_id} = ${userId}
        WHERE ${schema_1.privateChats.sender_id} = ${userId} OR ${schema_1.privateChats.recipient_id} = ${userId}
        ORDER BY
          LEAST(${schema_1.privateChats.sender_id}, ${schema_1.privateChats.recipient_id}),
          GREATEST(${schema_1.privateChats.sender_id}, ${schema_1.privateChats.recipient_id}),
          ${schema_1.privateMessages.sent_at} DESC
      ) AS latest_messages
      ORDER BY latest_messages."_ordering_sent_at" DESC
    `);
            const sortedPrivateChatData = latest_messages.rows.map((row) => ({
                private_chat: row.private_chat,
                chat_user: row.chat_user,
                private_messages: row.private_messages,
            }));
            const recipientIds = new Set(sortedPrivateChatData.map((data) => data.private_chat.sender_id === userId
                ? data.private_chat.recipient_id
                : data.private_chat.sender_id));
            if (recipientIds.size === 0) {
                return [];
            }
            const allRecipients = await this.db
                .select({
                recipient: {
                    pk_user_id: schema_1.user.pk_user_id,
                    name: schema_1.user.name,
                    email: schema_1.user.email,
                    created_at: schema_1.user.created_at,
                },
            })
                .from(schema_1.user)
                .where((0, drizzle_orm_1.inArray)(schema_1.user.pk_user_id, Array.from(recipientIds).map((id) => id)));
            const allRecipientMap = new Map(allRecipients.map((recipient) => [
                recipient.recipient.pk_user_id,
                recipient.recipient,
            ]));
            const returnData = sortedPrivateChatData.map((data) => {
                var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t;
                const otherPrivateChatUserId = data.private_chat.sender_id === userId
                    ? data.private_chat.recipient_id
                    : data.private_chat.sender_id;
                const recipientDetails = allRecipientMap.get(otherPrivateChatUserId);
                return {
                    private_chat: {
                        pk_private_chat_id: data.private_chat.pk_private_chat_id,
                        sender_id: data.private_chat.sender_id,
                        recipient_id: data.private_chat.recipient_id,
                        created_at: data.private_chat.created_at,
                    },
                    chat_user: {
                        pk_user_id: (_a = data.chat_user) === null || _a === void 0 ? void 0 : _a.pk_user_id,
                        name: (_c = (_b = data.chat_user) === null || _b === void 0 ? void 0 : _b.name) !== null && _c !== void 0 ? _c : "",
                        email: (_e = (_d = data.chat_user) === null || _d === void 0 ? void 0 : _d.email) !== null && _e !== void 0 ? _e : "",
                        created_at: (_g = (_f = data.chat_user) === null || _f === void 0 ? void 0 : _f.created_at) !== null && _g !== void 0 ? _g : "",
                    },
                    private_messages: {
                        id: (_h = data.private_messages) === null || _h === void 0 ? void 0 : _h.id,
                        fk_private_chat_id: (_k = (_j = data.private_messages) === null || _j === void 0 ? void 0 : _j.fk_private_chat_id) !== null && _k !== void 0 ? _k : "",
                        fk_user_id: (_m = (_l = data.private_messages) === null || _l === void 0 ? void 0 : _l.fk_user_id) !== null && _m !== void 0 ? _m : "",
                        message_text: (_p = (_o = data.private_messages) === null || _o === void 0 ? void 0 : _o.message_text) !== null && _p !== void 0 ? _p : "",
                        sent_at: (_r = (_q = data.private_messages) === null || _q === void 0 ? void 0 : _q.sent_at) !== null && _r !== void 0 ? _r : "",
                        timezone: (_t = (_s = data.private_messages) === null || _s === void 0 ? void 0 : _s.timezone) !== null && _t !== void 0 ? _t : "",
                    },
                    recipient: recipientDetails,
                };
            });
            const seenRecipients = new Map();
            const uniqueRecipients = returnData
                .filter((item) => {
                var _a;
                const recipientId = (_a = item.recipient) === null || _a === void 0 ? void 0 : _a.pk_user_id;
                if (!recipientId || seenRecipients.has(recipientId))
                    return false;
                seenRecipients.set(recipientId, true);
                return true;
            })
                .map((item) => {
                var _a, _b;
                return (Object.assign(Object.assign({}, item), { recipient: Object.assign(Object.assign({}, item.recipient), { pk_user_id: (_b = (_a = item.recipient) === null || _a === void 0 ? void 0 : _a.pk_user_id) !== null && _b !== void 0 ? _b : 0 }) }));
            });
            return uniqueRecipients;
        }
        catch (err) {
            if (typeof err === "object" && Object.keys(err).length) {
                return Object.assign(Object.assign({}, err), { error: true, reason: err.message });
            }
            return {
                error: true,
                reason: err.message,
            };
        }
    }
    async getUserByUserIds({ userIdList }) {
        const userListPromises = userIdList.map((userId) => this.db.select().from(schema_1.user).where((0, drizzle_orm_1.eq)(schema_1.user.pk_user_id, userId)));
        const userListResponse = await Promise.all(userListPromises);
        return userListResponse.map((user) => user.map((user) => ({
            name: user.name,
            pk_user_id: user.pk_user_id,
            email: user.email,
            password: user.password,
            created_at: user.created_at,
            updated_at: user.updated_at,
            timezone: user.timezone,
        })));
    }
    async createPrivateChatEntry(sender, receiver) {
        return await this.db
            .insert(schema_1.privateChats)
            .values({
            sender_id: sender.pk_user_id,
            recipient_id: receiver.pk_user_id,
            created_at: sender.created_at,
            timezone: sender.timezone,
        })
            .returning({
            pk_private_chat_id: schema_1.privateChats.pk_private_chat_id,
            sender_id: schema_1.privateChats.sender_id,
            recipient_id: schema_1.privateChats.recipient_id,
            created_at: schema_1.privateChats.created_at,
            timezone: schema_1.privateChats.timezone,
        });
    }
    async createPrivateMessage({ privateChatsInsertResponse, senderId, message, created_at, timezone, imageFile, imageName, }) {
        return await this.db
            .insert(schema_1.privateMessages)
            .values({
            fk_private_chat_id: privateChatsInsertResponse.pk_private_chat_id,
            fk_user_id: senderId,
            message_text: message,
            image_file: imageFile,
            image_name: imageName,
            sent_at: created_at,
            timezone: timezone,
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
        });
    }
}
exports.QueryHandlers = QueryHandlers;
exports.default = QueryHandlers;
//# sourceMappingURL=QueryHandlers.model.js.map
//# debugId=d45e3f5a-6e53-5338-8e31-8c63b806d4f5
