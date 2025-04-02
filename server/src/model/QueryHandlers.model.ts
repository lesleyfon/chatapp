import { and, asc, desc, eq, inArray, ne, or, sql } from "drizzle-orm";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { connectToDB } from "../db";
import {
  chatMembers,
  chats,
  messages,
  privateChats,
  privateMessages,
  user,
} from "../schema";
import {
  ChatListType,
  ChatType,
  MessageType,
  PrivateChatResult,
  PrivateMessageType,
  SQLErrorType,
  TypedMessage,
} from "../types";
import { UserSchema } from "./Auth.model";

export class QueryHandlers extends UserSchema {
  db: NodePgDatabase;

  constructor() {
    super();
    this.db = connectToDB();
  }
  // Private helper methods
  private isValidInput(...args: (string | number)[]): boolean {
    return args.every(
      (arg) =>
        (typeof arg === "string" && arg.trim() !== "") ||
        typeof arg === "number",
    );
  }

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
  async insertMessageToTable({
    chatId,
    user_id,
    message,
    sent_at,
    timezone,
  }: {
    chatId: number;
    user_id: number;
    message: string;
    sent_at: string;
    timezone: string;
  }) {
    const [messageResponse] = await Promise.all([
      this.db
        .insert(messages)
        .values({
          fk_chat_id: chatId,
          fk_user_id: user_id,
          message_text: message,
          sent_at: sent_at,
          timezone: timezone,
        })
        .returning({
          id: messages.id,
          sent_at: messages.sent_at,
          fk_user_id: messages.fk_user_id,
          fk_chat_id: messages.fk_chat_id,
          message_text: messages.message_text,
        }),

      /** @description  Insert a new record into the chatMembers table, but only if that record does not already exist. */
      this.db.execute(sql`
        INSERT INTO ${chatMembers} (fk_chat_id, fk_user_id, added_at, timezone)
        SELECT ${chatId}, ${user_id}, ${sent_at}, ${timezone}
        WHERE NOT EXISTS (
          SELECT 1 FROM ${chatMembers} WHERE fk_chat_id = ${chatId} AND fk_user_id = ${user_id}
        );
      `),
    ]);

    return messageResponse;
  }

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
  async selectUserChatRoomsWithLastSetMessages(
    userId: number,
  ): Promise<ChatListType[]> {
    const chatList = await this.db
      .select({
        chat_members: {
          added_at: chatMembers.added_at,
          fk_chat_id: chatMembers.fk_chat_id,
          fk_user_id: chatMembers.fk_user_id,
          id: chatMembers.id,
        },
        chats: {
          pk_chats_id: chats.pk_chats_id,
          chat_name: chats.chat_name,
          createdAt: chats.createdAt,
        },
        chat_user: {
          created_at: user.created_at,
          email: user.email,
          name: user.name,
          pk_user_id: user.pk_user_id,
        },
      })
      .from(chatMembers)
      .where(eq(chatMembers.fk_user_id, userId))
      .leftJoin(user, eq(user.pk_user_id, userId))
      .leftJoin(chats, eq(chats.pk_chats_id, chatMembers.fk_chat_id));

    const chatListPromises = chatList.map(async (chat) => {
      const mostRecentMessages = await this.db
        .select()
        .from(messages)
        .where(eq(messages.fk_chat_id, chat.chats?.pk_chats_id ?? 0))
        .orderBy(desc(messages.sent_at))
        .limit(1);
      return {
        ...chat,
        messages: mostRecentMessages[0],
      };
    });

    const updatedChatList = await Promise.all(chatListPromises);
    const response = updatedChatList.filter((chat) => chat.messages);
    response.sort((a, b) => {
      return a.messages.sent_at > b.messages.sent_at ? -1 : 1;
    });

    return response.slice(0, 5) as unknown as ChatListType[];
  }

  /**
   * @description Retrieves the latest message sent in a specific chat room.
   * @param {number} userId - The ID of the user.
   * @param {number} chatRoomId - The ID of the chat room.
   * @returns {Promise<TypedMessage[]>} - An array of messages.
   */
  async getLatestChatRoomMessageSent(userId: number, chatRoomId: number) {
    const chatList = await this.db
      .select({
        chats: {
          chat_name: chats.chat_name,
          createdAt: chats.createdAt,
          pk_chats_id: chats.pk_chats_id,
        },
        chat_user: {
          created_at: user.created_at,
          email: user.email,
          name: user.name,
          pk_user_id: user.pk_user_id,
        },
        messages: {
          fk_chat_id: messages.fk_chat_id,
          fk_user_id: messages.fk_user_id,
          id: messages.id,
          message_text: messages.message_text,
          sent_at: messages.sent_at,
        },
      })
      .from(chats)
      .where(eq(chats.pk_chats_id, chatRoomId))
      .leftJoin(messages, eq(messages.fk_chat_id, chats.pk_chats_id))
      .leftJoin(user, eq(user.pk_user_id, userId))
      .orderBy(desc(messages.sent_at))
      .limit(1);
    // SORT THE MESSAGES BY SENT_AT

    const response = chatList.filter((chat) => chat.messages);
    response.sort((a, b) => {
      return (a.messages?.sent_at ?? 0) > (b.messages?.sent_at ?? 0) ? -1 : 1;
    });

    return response;
  }

  /**
   * @description Retrieves a chat room by its name.
   * @param {string} chatName - The name of the chat room.
   * @returns {Promise<ChatType | null>} - The chat room or null if it does not exist.
   */
  async selectChatByChatName(chatName: string) {
    const chatExist = await this.db
      .select()
      .from(chats)
      .where(eq(chats.chat_name, chatName));
    return chatExist;
  }

  /**
   * @description Retrieves all messages for a specific chat room by user ID.
   * @param {number} userId - The ID of the user.
   * @param {number} chatRoomId - The ID of the chat room.
   * @returns {Promise<TypedMessage[] | SQLErrorType>} - An array of messages or an error object.
   */
  async selectChatRoomMessagesByUserId(
    userId: number,
    chatRoomId: number,
  ): Promise<TypedMessage[] | SQLErrorType> {
    try {
      // IF chatRoomId does not exist, return an error
      const chatRoomExist = await this.db
        .select()
        .from(chats)
        .where(eq(chats.pk_chats_id, chatRoomId));

      if (!chatRoomExist.length) {
        return {
          error: true,
          reason: "Chat room does not exist",
        };
      }
      const chatRoomMessages = await this.db
        .select({
          chats: {
            pk_chats_id: chats.pk_chats_id,
            chat_name: chats.chat_name,
            createdAt: chats.createdAt,
          },
          messages: {
            id: messages.id,
            fk_chat_id: messages.fk_chat_id,
            message_text: messages.message_text,
            sent_at: messages.sent_at,
          },
          chat_user: {
            pk_user_id: user.pk_user_id,
            name: user.name,
            email: user.email,
            created_at: user.created_at,
          },
        })
        .from(chats)
        .where(eq(chats.pk_chats_id, chatRoomId))
        .orderBy(asc(messages.sent_at))
        .leftJoin(messages, eq(chats.pk_chats_id, messages.fk_chat_id))
        .leftJoin(user, eq(messages.fk_user_id, user.pk_user_id));

      const mappedMessages = chatRoomMessages.map((data) => {
        const dataUserId = data.chat_user?.pk_user_id;
        if (dataUserId === userId) {
          // @ts-expect-error ignore
          data.chat_user.sender = "You";
        }
        return {
          chats: {
            ...data.chats,
            pk_chats_id: data.chats.pk_chats_id,
          },
          messages: data.messages && {
            ...data.messages,
            fk_chat_id: data.messages.fk_chat_id,
          },
          chat_user: data.chat_user,
        };
      });
      const typedMessages: TypedMessage[] = mappedMessages.map((msg) => ({
        ...msg,

        messages: msg.messages
          ? {
              ...msg.messages,
              fk_user_id: msg.chat_user?.pk_user_id ?? 0,
            }
          : null,
        chat_user: msg.chat_user
          ? {
              ...msg.chat_user,
              pk_user_id: msg.chat_user.pk_user_id,
            }
          : null,
      }));
      return typedMessages;
    } catch (err) {
      if (typeof err === "object" && Object.keys(err as object).length) {
        return {
          ...err,
          error: true,
          reason: err.message,
        };
      }
      return err;
    }
  }

  /**
   * @description Retrieves private messages for a specific chat room by sender ID.
   * @param {number} userId - The ID of the user.
   * @param {number} recipientId - The ID of the recipient.
   * @returns {Promise<PrivateMessageType[] | SQLErrorType>} - An array of private messages or an error object.
   */
  async getPrivateRoomMessagesBySenderId({
    userId,
    recipientId,
  }: {
    userId: number;
    recipientId: number;
  }): Promise<PrivateMessageType[] | SQLErrorType> {
    try {
      // If recipientId does not exist, return an error
      const recipientExist = await this.db
        .select()
        .from(user)
        .where(eq(user.pk_user_id, recipientId));
      if (!recipientExist.length) {
        return {
          error: true,
          reason: "Recipient does not exist",
        };
      }
      const chatRoomMessages = await this.db
        .select({
          private_chat: {
            pk_chats_id: privateChats.pk_private_chat_id,
            createdAt: privateChats.created_at,
            sender_id: privateChats.sender_id,
            recipient_id: privateChats.recipient_id,
          },
          private_messages: {
            id: privateMessages.id,
            fk_private_chat_id: privateMessages.fk_private_chat_id,
            message_text: privateMessages.message_text,
            sent_at: privateMessages.sent_at,
            fk_user_id: privateMessages.fk_user_id,
            image_file: privateMessages.image_file,
            image_name: privateMessages.image_name,
            timezone: privateMessages.timezone,
          },
        })
        .from(privateChats)
        .where(
          or(
            and(
              eq(privateChats.sender_id, userId),
              eq(privateChats.recipient_id, recipientId),
            ),
            and(
              eq(privateChats.recipient_id, userId),
              eq(privateChats.sender_id, recipientId),
            ),
          ),
        )
        .leftJoin(
          privateMessages,
          eq(
            privateChats.pk_private_chat_id,
            sql<number>`cast(${privateMessages.fk_private_chat_id} as int)`,
          ),
        )
        .orderBy(asc(privateMessages.sent_at));

      const privateUserDetails = await this.db
        .select({
          pk_user_id: user.pk_user_id,
          name: user.name,
          email: user.email,
          created_at: user.created_at,
        })
        .from(user)
        .where(
          or(eq(user.pk_user_id, userId), eq(user.pk_user_id, recipientId)),
        );

      const usersMap = new Map([
        [String(privateUserDetails[0]?.pk_user_id), privateUserDetails[0]],
        [String(privateUserDetails[1]?.pk_user_id), privateUserDetails[1]],
      ]);

      const mappedMessages: PrivateMessageType[] = chatRoomMessages.map(
        (data) => {
          const user_id = data.private_messages?.fk_user_id ?? "";
          const chat_user = usersMap.get(user_id.toString());

          if (data.private_messages?.image_file) {
            // Convert Buffer to base64 string only if image_file exists and is a Buffer
            if (Buffer.isBuffer(data.private_messages.image_file)) {
              const base64Image =
                data.private_messages.image_file.toString("base64");
              // Cast to any to avoid type error when assigning string to Buffer type
              (
                data.private_messages as unknown as { image_file: string }
              ).image_file = base64Image;
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
              ? {
                  ...chat_user,
                  pk_user_id: chat_user.pk_user_id,
                  sender:
                    data.private_messages?.fk_user_id === userId ? "You" : "",
                }
              : null,
          };
        },
      );

      return mappedMessages.filter(
        (data) => data.private_messages && data.private_chat && data.chat_user,
      );
    } catch (err) {
      if (typeof err === "object" && Object.keys(err as object).length) {
        // throw new Error(JSON.stringify(err as object));
        return {
          ...err,
          error: true,
          reason: err.message,
        };
      }
      return err;
    }
  }

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
  async getMostRecentChatMessageSent(messageResponse: MessageType[]) {
    const messageResponseObj = messageResponse[0];
    const chatRoomMessages = await this.db
      .select({
        pk_user_id: user.pk_user_id,
        name: user.name,
        email: user.email,
      })
      .from(user)
      .where(eq(user.pk_user_id, messageResponseObj.fk_user_id));

    return [
      {
        messages: messageResponseObj,
        chat_user: chatRoomMessages[0],
      },
    ];
  }

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
  async createNewChatRoom({
    chatName,
    created_at,
    timezone,
  }: {
    chatName: string;
    created_at: string;
    timezone: string;
  }) {
    const insertIntoChatResponse = await this.db
      .insert(chats)
      .values({
        chat_name: chatName,
        createdAt: created_at,
        timezone: timezone,
      })
      .returning({
        id: chats.pk_chats_id,
        chat_name: chats.chat_name,
        createdAt: chats.createdAt,
        timezone: chats.timezone,
      });
    return insertIntoChatResponse;
  }

  /**
   * @description Creates a new chat room with the specified name and user ID.
   * @param {string} chatName - The name of the chat room.
   * @param {number} userId - The ID of the user.
   * @returns {Promise<{ id: number }>} - The ID of the newly created chat room.
   */
  async createNewChatroomRoomNameAndByUserId(
    chatData: {
      chatName: string;
      created_at: string;
      timezone: string;
      userId: number;
    },
  ): Promise<{
    chats?: {
      pk_chats_id: number;
      chat_name: string | null;
      createdAt: string;
    }[];
    error?: boolean;
    reason?: string;
    userId?: number;
  }> {
    const { chatName, userId, created_at, timezone } = chatData;
    if (!this.isValidInput(chatName, userId)) {
      // TODO: ADD logging to the repo
      return {
        error: true,
        reason: "Invalid input",
        userId,
      };
    }
    if ( timezone === undefined || created_at === undefined) {
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

      await this.db.execute(sql`
          INSERT INTO ${chatMembers} (fk_chat_id, fk_user_id, added_at, timezone)
          SELECT ${chatId}, ${userId}, ${created_at}, ${timezone}
          WHERE NOT EXISTS (
            SELECT 1 FROM ${chatMembers} WHERE fk_chat_id = ${chatId} AND fk_user_id = ${userId}
          );
        `);

      const chatRoom = await this.db
        .select({
          pk_chats_id: chats.pk_chats_id,
          chat_name: chats.chat_name,
          createdAt: chats.createdAt,
        })
        .from(chats)
        .where(eq(chats.pk_chats_id, chatId));

      return {
        chats: chatRoom,
      };
    } catch (err) {
      return {
        ...err,
        error: true,
        reason: err.message,
      };
    }
  }

  /**
   * @description - Get all chat rooms
   * @example
   * const chatRooms = await getAllChatRooms();
   * console.log(chatRooms);
   * // Output: [{ id: '...', chat_name: '...' }]
   * @returns {Promise<ChatType[]>}
   * @memberof QueryHandlers
   */
  async getAllChatRooms(): Promise<ChatType[]> {
    try {
      const chatRooms = await this.db.select().from(chats);
      return chatRooms;
    } catch (err) {
      if (typeof err === "object" && Object.keys(err as object).length) {
        return {
          ...err,
          error: true,
          reason: err.message,
        };
      }
      return err;
    }
  }

  /**
   * @description Retrieves all private chat rooms for a specific user.
   * @param {number} userId - The ID of the user.
   * @returns {Promise<unknown[] | { error: boolean; reason: string }>} - An array of private chat rooms or an error object.
   */
  async getAllPrivateChatRooms({
    userId,
  }: {
    userId: number;
  }): Promise<unknown[] | { error: boolean; reason: string }> {
    try {
      const allUsers = await this.db
        .select({
          pk_user_id: user.pk_user_id,
          name: user.name,
          email: user.email,
        })
        .from(user)
        .where(ne(user.pk_user_id, userId));

      return allUsers;
    } catch (err) {
      if (typeof err === "object" && Object.keys(err as object).length) {
        return {
          ...err,
          error: true,
          reason: err.message,
        };
      }
      return err;
    }
  }
  /**
   * @description [WIP]Retrieves private chat rooms for a specific user.
   * @param {number} userId - The ID of the user.
   * @returns {Promise<PrivateChatResult[]>} - An array of private chat rooms.
   */
  async getPrivateChatsForUser(userId: number) {
    // Subquery to get the latest message for each chat
    const latestMessages = await this.db.$with("latest_messages").as(
      this.db
        .select({
          fkPrivateChatId: privateMessages.fk_private_chat_id,
          maxSentAt: sql`MAX(${privateMessages.sent_at})`.as("latest_sent_at"),
        })
        .from(privateMessages)
        .groupBy(privateMessages.fk_private_chat_id),
    );

    // Main query
    const privateChatsData = await this.db
      .with(latestMessages)
      .select({
        chatId: privateChats.pk_private_chat_id,
        senderId: privateChats.sender_id,
        recipientId: privateChats.recipient_id,
        chatCreatedAt: privateChats.created_at,
        messageId: privateMessages.id,
        messageSenderId: privateMessages.fk_user_id,
        messageText: privateMessages.message_text,
        imageName: privateMessages.image_name,
        sentAt: privateMessages.sent_at,
        userName: user.name,
        userEmail: user.email,
      })
      .from(privateChats)
      .innerJoin(
        latestMessages,
        eq(privateChats.pk_private_chat_id, latestMessages.fkPrivateChatId),
      )
      .innerJoin(
        privateMessages,
        sql`${privateMessages.fk_private_chat_id} = ${privateChats.pk_private_chat_id} AND ${privateMessages.sent_at} = ${latestMessages.maxSentAt}`,
      )
      .innerJoin(user, eq(user.pk_user_id, userId))
      .where(
        or(
          eq(privateChats.sender_id, userId),
          eq(privateChats.recipient_id, userId),
        ),
      )
      .orderBy(desc(privateMessages.sent_at));

    return privateChatsData;
  }

  /**
   * @description Retrieves the latest private chat messages sent by a user.
   * @param {number} userId - The ID of the user.
   * @returns {Promise<PrivateChatResult[]>} - An array of private chat messages.
   */
  async getLatestPrivateChatMessagesSent({
    userId,
  }: {
    userId: number;
  }): Promise<PrivateChatResult[]> {
    const privateChatsData = await this.db
      .selectDistinctOn([privateChats.recipient_id, privateChats.sender_id], {
        private_chat: {
          pk_private_chat_id: privateChats.pk_private_chat_id,
          sender_id: privateChats.sender_id,
          recipient_id: privateChats.recipient_id,
          created_at: privateChats.created_at,
        },
        chat_user: {
          pk_user_id: user.pk_user_id,
          name: user.name,
          email: user.email,
          created_at: user.created_at,
        },
        private_messages: {
          id: privateMessages.id,
          fk_private_chat_id: privateMessages.fk_private_chat_id,
          fk_user_id: privateMessages.fk_user_id,
          message_text: privateMessages.message_text,
          sent_at: privateMessages.sent_at,
        },
      })
      .from(privateChats)
      .where(
        or(
          eq(privateChats.sender_id, userId),
          eq(privateChats.recipient_id, userId),
        ),
      )
      .orderBy(
        privateChats.recipient_id,
        privateChats.sender_id,
        desc(privateMessages.sent_at),
      )
      .leftJoin(user, eq(user.pk_user_id, userId))
      .leftJoin(
        privateMessages,
        eq(privateMessages.fk_private_chat_id, privateChats.pk_private_chat_id),
      );

    // THIS GETS THE LATEST MESSAGE SENT AND DOES NOT SORT THE QUERIED DATA.
    const sortedPrivateChatData = [...privateChatsData].sort((chatA, chatB) => {
      return new Date(chatA.private_messages?.sent_at || 0) >
        new Date(chatB.private_messages?.sent_at || 0)
        ? -1
        : 1;
    });

    // Get unique recipient IDs that are not the current user
    const recipientIds = new Set(
      sortedPrivateChatData.map((data) =>
        data.private_chat.sender_id === userId
          ? data.private_chat.recipient_id
          : data.private_chat.sender_id,
      ),
    );

    if (recipientIds.size === 0) {
      return [];
    }
    // Fetch recipient details from user table
    const allRecipients = await this.db
      .select({
        recipient: {
          pk_user_id: user.pk_user_id,
          name: user.name,
          email: user.email,
          created_at: user.created_at,
        },
      })
      .from(user)
      .where(
        inArray(
          user.pk_user_id,
          Array.from(recipientIds).map((id) => id),
        ),
      );

    // Map privateChatsData and ensure unique recipients
    const returnData = sortedPrivateChatData.map((data) => {
      // Determine the correct recipient ID based on the current user
      const otherUserId =
        data.private_chat.sender_id === userId
          ? data.private_chat.recipient_id
          : data.private_chat.sender_id;

      // Find the recipient details
      const recipientDetails = allRecipients.find(
        (d) => d.recipient.pk_user_id === otherUserId,
      )?.recipient;

      return {
        private_chat: {
          pk_private_chat_id: data.private_chat.pk_private_chat_id,
          sender_id: data.private_chat.sender_id,
          recipient_id: data.private_chat.recipient_id,
          created_at: data.private_chat.created_at,
        },
        chat_user: {
          pk_user_id: data.chat_user?.pk_user_id,
          name: data.chat_user?.name ?? "",
          email: data.chat_user?.email ?? "",
          created_at: data.chat_user?.created_at ?? new Date(0),
        },
        private_messages: {
          id: data.private_messages?.id as unknown as string,
          fk_private_chat_id: data.private_messages?.fk_private_chat_id ?? "",
          fk_user_id: data.private_messages?.fk_user_id ?? "",
          message_text: data.private_messages?.message_text ?? "",
          sent_at: data.private_messages?.sent_at ?? new Date(0),
        },
        recipient: recipientDetails, // Use the found recipient details
      };
    });

    // Use a Set to filter unique recipients based on their IDs
    const uniqueRecipients = Array.from(
      new Map(
        returnData.map((item) => [String(item.recipient?.pk_user_id), item]),
      ).values(),
    ).map((item) => ({
      private_chat: {
        ...item.private_chat,
        pk_private_chat_id: item.private_chat.pk_private_chat_id,
        sender_id: item.private_chat.sender_id,
        recipient_id: item.private_chat.recipient_id,
        created_at: item.private_chat.created_at,
      },
      chat_user: {
        ...item.chat_user,
        name: item.chat_user?.name ?? "",
        email: item.chat_user?.email ?? "",
        created_at: item.chat_user?.created_at ?? new Date(0),
        pk_user_id: item.chat_user?.pk_user_id || undefined,
      },
      private_messages: {
        ...item.private_messages,
        id: parseInt(item.private_messages.id),
        fk_private_chat_id: item.private_messages
          .fk_private_chat_id as unknown as number,
        fk_user_id: item.private_messages.fk_user_id as unknown as number,
      },
      recipient: {
        pk_user_id: item.recipient?.pk_user_id ?? 0,
        name: item.recipient?.name ?? "",
        email: item.recipient?.email ?? "",
        created_at: item.recipient?.created_at ?? new Date(0),
      },
    }));

    return uniqueRecipients as unknown as PrivateChatResult[];
  }

  /**
   * @description Retrieves user details by a list of user IDs.
   * @param {number[]} userIdList - An array of user IDs.
   * @returns {Promise<{ name: string | null; pk_user_id: number; email: string | null; password: string | null; created_at: Date; updated_at: Date; }[][]>} - An array of user details.
   */
  async getUserByUserIds({ userIdList }: { userIdList: number[] }): Promise<
    {
      name: string | null;
      pk_user_id: number;
      email: string | null;
      password: string | null;
      created_at: string;
      updated_at: string;
      timezone: string;
    }[][]
  > {
    const userListPromises = userIdList.map((userId) =>
      this.db.select().from(user).where(eq(user.pk_user_id, userId)),
    );

    const userListResponse = await Promise.all(userListPromises);

    return userListResponse.map((user) =>
      user.map((user) => ({
        name: user.name,
        pk_user_id: user.pk_user_id,
        email: user.email,
        password: user.password,
        created_at: user.created_at,
        updated_at: user.updated_at,
        timezone: user.timezone,
      })),
    );
  }

  /**
   * @description Creates a new private chat entry.
   * @param {UserBase} sender - The sender of the chat.
   * @param {UserBase} receiver - The receiver of the chat.
   * @returns {Promise<{ pk_private_chat_id: number; sender_id: number; recipient_id: number; created_at: Date; }>} - The created chat entry.
   */
  async createPrivateChatEntry(
    sender: {
      name: string | null;
      pk_user_id: number;
      email: string | null;
      password: string | null;
      created_at: string;
      updated_at: string;
      timezone: string;
    },
    receiver: {
      name: string | null;
      pk_user_id: number;
      email: string | null;
      password: string | null;
      created_at: string;
      updated_at: string;
      timezone: string;
    },
  ) {
    return await this.db
      .insert(privateChats)
      .values({
        sender_id: sender.pk_user_id,
        recipient_id: receiver.pk_user_id,
        created_at: sender.created_at,
        timezone: sender.timezone,
      })
      .returning({
        pk_private_chat_id: privateChats.pk_private_chat_id,
        sender_id: privateChats.sender_id,
        recipient_id: privateChats.recipient_id,
        created_at: privateChats.created_at,
        timezone: privateChats.timezone,
      });
  }

  /**
   * @description Creates a new private message.
   * @param {PrivateChatsInsertResponse} privateChatsInsertResponse - The response from creating a private chat.
   * @param {number} senderId - The ID of the sender.
   * @param {string} message - The message to be sent.
   * @param {Buffer | undefined} imageFile - The image file to be sent.
   * @param {string | undefined} imageName - The name of the image file.
   * @returns {Promise<{ id: number; fk_private_chat_id: number; fk_user_id: number; message_text: string; sent_at: Date; image_file: Buffer | null; image_name: string | null; }>} - The created message.
   */
  async createPrivateMessage({
    privateChatsInsertResponse,
    senderId,
    message,
    created_at,
    timezone,
    imageFile,
    imageName,
  }: {
    privateChatsInsertResponse: {
      pk_private_chat_id: number;
      sender_id: number;
      recipient_id: number;
      created_at: string;
    };
    senderId: number;
    message: string;
    created_at: string;
    timezone: string;
    imageFile?: Buffer;
    imageName?: string;
  }) {
    return await this.db
      .insert(privateMessages)
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
        id: privateMessages.id,
        fk_private_chat_id: privateMessages.fk_private_chat_id,
        fk_user_id: privateMessages.fk_user_id,
        message_text: privateMessages.message_text,
        sent_at: privateMessages.sent_at,
        timezone: privateMessages.timezone,
        image_file: privateMessages.image_file,
        image_name: privateMessages.image_name,
      });
  }
}

export default QueryHandlers;
