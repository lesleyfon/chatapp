import * as Sentry from '@sentry/node';
import { asc, desc, eq, inArray, ne, or, sql } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

import { connectToDB } from '../db';
import { chatMembers, chats, messages, privateChats, privateMessages, user } from '../schema';
import type {
  ChatListType,
  ChatType,
  CreateNewChatroomRoomNameAndByUserIdReturnTypes,
  CreatePrivateMessageType,
  InsertMessageToTableType,
  MessageType,
  PrivateChatBase,
  PrivateChatResult,
  PrivateMessageTypeWithoutImageFile,
  SQLErrorType,
  TypedMessage,
  UserBase,
} from '../types';
import { getEnvs } from '../utils/get-envs';
import { ObfuscatedChatKey } from '../utils/obfuscated-chat-key';
import { UserSchema } from './auth.models';

type CreatePrivateChatEntryType = Omit<UserBase, 'name' | 'email'>;

export class QueryHandlers extends UserSchema {
  db: NodePgDatabase;

  constructor() {
    super();
    this.db = connectToDB();
  }
  // Private helper methods
  private isValidInput(...args: (string | number)[]): boolean {
    return args.every(
      (arg) => (typeof arg === 'string' && arg.trim() !== '') || typeof arg === 'number',
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
  async insertMessageToChannelsTable({
    chatId,
    user_id,
    message,
    sent_at,
    timezone,
    imageFile,
    imageName,
  }: InsertMessageToTableType) {
    try {
      let imageProcessingPromise: Promise<Buffer | null> | null = null;
      if (imageFile) {
        imageProcessingPromise = this.processImageForStorage(imageFile);
      }

      const [messageResponse, _, processedImage] = await Promise.all([
        this.db.transaction(async (tx) => {
          const [msg] = await tx
            .insert(messages)
            .values({
              fk_chat_id: chatId,
              fk_user_id: user_id,
              message_text: message,
              sent_at: sent_at,
              timezone: timezone,
              image_name: null,
              image_url: null,
            })
            .returning({
              id: messages.id,
              sent_at: messages.sent_at,
              fk_user_id: messages.fk_user_id,
              fk_chat_id: messages.fk_chat_id,
              message_text: messages.message_text,
              timezone: messages.timezone,
              image_name: messages.image_name,
              image_url: messages.image_url,
            });
          return [msg];
        }),
        /** @description  Insert a new record into the chatMembers table, but only if that record does not already exist. */
        this.db.execute(sql`
          INSERT INTO ${chatMembers} (fk_chat_id, fk_user_id, added_at, timezone)
          SELECT ${chatId}, ${user_id}, ${sent_at}, ${timezone}
          WHERE NOT EXISTS (
            SELECT 1 FROM ${chatMembers} WHERE fk_chat_id = ${chatId} AND fk_user_id = ${user_id}
          );
        `),
        imageProcessingPromise,
      ]);

      // If we have an image to upload, do it after DB insertion
      if (processedImage && imageName) {
        //TODO: look into streaming the image from the response to the client
        const bucketResponse = await this.uploadImageToChannelChatImageBucket(
          processedImage,
          imageName,
        );

        if (bucketResponse) {
          const { SUPABASE_BUCKET_URL } = getEnvs();
          const fullFilePath = `${SUPABASE_BUCKET_URL}/storage/v1/object/public/${bucketResponse.fullPath}`;
          // TODO: Make this Promise chaining(.then().catch()) and stream the image to the client
          const updateResponse = await this.db
            .update(messages)
            .set({ image_url: fullFilePath, image_name: imageName })
            .where(eq(messages.id, messageResponse[0].id))
            .returning({
              id: messages.id,
              fk_chat_id: messages.fk_chat_id,
              fk_user_id: messages.fk_user_id,
              message_text: messages.message_text,
              sent_at: messages.sent_at,
              timezone: messages.timezone,
              image_name: messages.image_name,
              image_url: messages.image_url,
            });

          messageResponse[0].image_url = fullFilePath;
          return updateResponse;
        }
      }

      return messageResponse;
    } catch (err) {
      Sentry.captureException(err, {
        extra: {
          chatId,
          user_id,
          sent_at,
          timezone,
          method: 'insertMessageToChannelsTable',
        },
        tags: {
          method: 'insertMessageToChannelsTable',
        },
      });
      return {
        error: true,
        reason: err instanceof Error ? err.message : 'Unknown error',
        details: err,
      };
    }
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
  async selectUserChatRoomsWithLastSetMessages(userId: number): Promise<ChatListType[]> {
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

    return response as unknown as ChatListType[];
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
    const chatExist = await this.db.select().from(chats).where(eq(chats.chat_name, chatName));
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

      if (chatRoomExist.length === 0) {
        return {
          error: true,
          reason: 'Chat room does not exist',
        };
      }
      const chatRoomMessages = await this.db
        .select({
          chats: {
            pk_chats_id: chats.pk_chats_id,
            chat_name: chats.chat_name,
            createdAt: chats.createdAt,
            timezone: chats.timezone,
          },
          messages: {
            id: messages.id,
            fk_chat_id: messages.fk_chat_id,
            message_text: messages.message_text,
            sent_at: messages.sent_at,
            timezone: messages.timezone,
            image_name: messages.image_name,
            image_url: messages.image_url,
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
          data.chat_user.sender = 'You';
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
      if (typeof err === 'object' && Object.keys(err as object).length > 0) {
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
   * @returns {Promise<PrivateMessageTypeWithoutImageFile[] | SQLErrorType>} - An array of private messages or an error object.
   */
  async getPrivateRoomMessagesBySenderId({
    userId,
    uniquePrivateChatKey,
  }: {
    userId: number;
    uniquePrivateChatKey: string;
  }): Promise<PrivateMessageTypeWithoutImageFile[] | SQLErrorType> {
    try {
      const privateChatData = await this.getPrivateChatEntryByUniquePrivateChatKey({
        uniquePrivateChatKey,
      });

      // If recipientId does not exist, return an error
      if (privateChatData.length === 0) {
        return {
          error: true,
          reason: 'Private chat does not exist',
        };
      }
      const { user_a_id, user_b_id } = privateChatData[0];
      const recipientId = userId === user_a_id ? user_b_id : user_a_id;

      const recipientExist = await this.db
        .select()
        .from(user)
        .where(eq(user.pk_user_id, recipientId));
      if (recipientExist.length === 0) {
        return {
          error: true,
          reason: 'Recipient does not exist',
        };
      }

      const [chatRoomMessages, privateUserDetails] = await Promise.all([
        this.db
          .select({
            private_chat: {
              pk_chats_id: privateChats.pk_private_chat_id,
              createdAt: privateChats.created_at,
              user_a_id: privateChats.user_a_id,
              user_b_id: privateChats.user_b_id,
              unique_chat_key: privateChats.unique_chat_key,
            },
            private_messages: {
              id: privateMessages.id,
              fk_private_chat_id: privateMessages.fk_private_chat_id,
              message_text: privateMessages.message_text,
              sent_at: privateMessages.sent_at,
              fk_user_id: privateMessages.fk_user_id,
              image_url: privateMessages.image_url,
              image_name: privateMessages.image_name,
              timezone: privateMessages.timezone,
            },
          })
          .from(privateChats)
          .where(eq(privateChats.unique_chat_key, uniquePrivateChatKey)) // gives a single unique chat key
          .leftJoin(
            privateMessages,
            eq(privateMessages.fk_private_chat_unique_key, privateChats.unique_chat_key), // joins on the unique chat key
          )
          .orderBy(asc(privateMessages.sent_at)),
        this.db
          .select({
            pk_user_id: user.pk_user_id,
            name: user.name,
            email: user.email,
            created_at: user.created_at,
          })
          .from(user)
          .where(or(eq(user.pk_user_id, user_a_id), eq(user.pk_user_id, user_b_id))),
      ]);

      const usersMap = new Map([
        [String(privateUserDetails[0]?.pk_user_id), privateUserDetails[0]],
        [String(privateUserDetails[1]?.pk_user_id), privateUserDetails[1]],
      ]);

      const mappedMessages: PrivateMessageTypeWithoutImageFile[] = chatRoomMessages.map((data) => {
        const user_id = data.private_messages?.fk_user_id ?? '';
        const chat_user = usersMap.get(user_id.toString());

        return {
          private_chat: {
            pk_private_chat_id: data.private_chat.pk_chats_id,
            created_at: data.private_chat.createdAt,
            user_a_id: data.private_chat.user_a_id,
            user_b_id: data.private_chat.user_b_id,
            unique_chat_key: data.private_chat.unique_chat_key,
          },
          private_messages: data.private_messages,
          chat_user: chat_user
            ? {
                ...chat_user,
                pk_user_id: chat_user.pk_user_id,
                sender: data.private_messages?.fk_user_id === userId ? 'You' : '',
              }
            : null,
        };
      });

      return mappedMessages.filter(
        (data) => data.private_messages && data.private_chat && data.chat_user,
      );
    } catch (err) {
      Sentry.captureException(err, {
        tags: {
          method: 'getPrivateRoomMessagesBySenderId',
        },
      });

      if (typeof err === 'object' && Object.keys(err as object).length > 0) {
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
        pk_chats_id: chats.pk_chats_id,
      });
    return insertIntoChatResponse;
  }

  /**
   * @description Creates a new chat room with the specified name and user ID.
   * @param {string} chatName - The name of the chat room.
   * @param {number} userId - The ID of the user.
   * @returns {Promise<{ id: number }>} - The ID of the newly created chat room.
   */
  async createNewChatroomRoomNameAndByUserId(chatData: {
    chatName: string;
    created_at: string;
    timezone: string;
    userId: number;
  }): Promise<CreateNewChatroomRoomNameAndByUserIdReturnTypes> {
    const { chatName, userId, created_at, timezone } = chatData;
    if (!this.isValidInput(chatName, userId)) {
      // TODO: ADD logging to the repo
      return {
        error: true,
        reason: 'Invalid input',
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
        reason: 'Chatroom already exists',
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
      if (typeof err === 'object' && Object.keys(err as object).length > 0) {
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
          unique_chat_key: privateChats.unique_chat_key,
        })
        .from(user)
        .leftJoin(
          privateChats,
          or(
            eq(privateChats.user_a_id, user.pk_user_id),
            eq(privateChats.user_b_id, user.pk_user_id),
          ),
        )
        .where(ne(user.pk_user_id, userId));

      return allUsers;
    } catch (err) {
      if (typeof err === 'object' && Object.keys(err as object).length > 0) {
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
   * @description Retrieves the latest private chat messages sent by a user.
   * @param {number} userId - The ID of the user.
   * @returns {Promise<PrivateChatResult[]>} - An array of private chat messages.
   */
  async getLatestPrivateChatMessagesSent({
    userId,
  }: {
    userId: number;
  }): Promise<PrivateChatResult[] | SQLErrorType> {
    try {
      const latest_messages = await this.db.execute(sql`
      SELECT *
        FROM (
          SELECT DISTINCT ON (c.unique_chat_key)
            json_build_object(
              'pk_private_chat_id', c.pk_private_chat_id,
              'user_a_id', c.user_a_id,
              'user_b_id', c.user_b_id,
              'unique_chat_key', c.unique_chat_key,
              'created_at', c.created_at -- from private_chat table
            ) AS private_chat,
            json_build_object(
              'pk_user_id', u_other.pk_user_id,
              'name', u_other.name,
              'email', u_other.email,
              'created_at', u_other.created_at -- from chat_user table (u_other)
            ) AS chat_user,
            json_build_object(
              'id', m.id,
              'fk_private_chat_id', m.fk_private_chat_id,
              'fk_user_id', m.fk_user_id,
              'message_text', m.message_text,
              'sent_at', m.sent_at, -- from private_messages table
              'timezone', m.timezone
            ) AS private_messages,
            m.sent_at -- This is private_messages.sent_at, used for outer sort
          FROM private_chat c
          JOIN private_messages m
            ON m.fk_private_chat_unique_key = c.unique_chat_key
          LEFT JOIN chat_user u_other
            ON u_other.pk_user_id = 
              CASE 
                WHEN c.user_a_id = ${userId} THEN c.user_b_id
                ELSE c.user_a_id
              END
          WHERE c.user_a_id = ${userId} OR c.user_b_id = ${userId}
          ORDER BY c.unique_chat_key, m.sent_at DESC 
        ) as aggregatedData3
        ORDER BY sent_at DESC;

    `);
      // return early
      if (!latest_messages.rows || latest_messages.rows.length === 0) {
        return [];
      }
      const sortedPrivateChatData = latest_messages.rows.map((row) => ({
        private_chat: row.private_chat as PrivateChatResult['private_chat'],
        chat_user: row.chat_user as PrivateChatResult['chat_user'],
        private_messages: row.private_messages as PrivateChatResult['private_messages'],
      }));

      // Get unique recipient IDs that are not the current user
      const recipientIds = new Set(
        sortedPrivateChatData.map((data) =>
          // if the current user is the sender, then get the recipient id, otherwise get the sender id
          data.private_chat.user_a_id === userId
            ? data.private_chat.user_b_id
            : data.private_chat.user_a_id,
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
      // Added the recipient details to a map for faster lookup
      const allRecipientMap = new Map(
        allRecipients.map((recipient) => [recipient.recipient.pk_user_id, recipient.recipient]),
      );

      // Map sortedPrivateChatData and ensure unique recipients
      const returnData = sortedPrivateChatData.map((data) => {
        // Get the ID of the other user in the private chat
        const otherPrivateChatUserId =
          data.private_chat.user_a_id === userId
            ? data.private_chat.user_b_id
            : data.private_chat.user_a_id;

        // Get the recipient details from the allRecipients array
        const recipientDetails = allRecipientMap.get(otherPrivateChatUserId);
        return {
          private_chat: {
            pk_private_chat_id: data.private_chat.pk_private_chat_id,
            user_a_id: data.private_chat.user_a_id,
            user_b_id: data.private_chat.user_b_id,
            created_at: data.private_chat.created_at,
            unique_chat_key: data.private_chat.unique_chat_key,
          },
          chat_user: {
            pk_user_id: data.chat_user?.pk_user_id,
            name: data.chat_user?.name ?? '',
            email: data.chat_user?.email ?? '',
            created_at: data.chat_user?.created_at ?? '',
          },
          private_messages: {
            id: data.private_messages?.id as unknown as string,
            fk_private_chat_id: data.private_messages?.fk_private_chat_id ?? '',
            fk_user_id: data.private_messages?.fk_user_id ?? '',
            message_text: data.private_messages?.message_text ?? '',
            sent_at: data.private_messages?.sent_at ?? '',
            timezone: data.private_messages?.timezone ?? '',
          },
          recipient: recipientDetails, // Use the found recipient details
        };
      });

      // Use a Set to filter unique recipients based on their IDs
      // Create a map to ensure uniqueness based on recipient ID
      const seenRecipients = new Map();
      const uniqueRecipients = returnData
        .filter((item) => {
          const recipientId = item.recipient?.pk_user_id;

          if (!recipientId || seenRecipients.has(recipientId)) return false;

          seenRecipients.set(recipientId, true);
          return true;
        })
        .map((item) => ({
          ...item,
          recipient: {
            ...item.recipient,
            pk_user_id: item.recipient?.pk_user_id ?? 0,
          },
        }));

      return uniqueRecipients as unknown as PrivateChatResult[];
    } catch (err) {
      if (typeof err === 'object' && Object.keys(err as object).length > 0) {
        return {
          ...err,
          error: true,
          reason: err.message,
        };
      }
      return {
        error: true,
        reason: err.message,
      };
    }
  }

  /**
   * @description Retrieves user details by a list of user IDs.
   * @param {number[]} userIdList - An array of user IDs.
   * @returns {Promise<{ name: string | null; pk_user_id: number; email: string | null; password: string | null; created_at: Date; updated_at: Date; }[][]>} - An array of user details.
   */
  async getUserByUserIds({
    userAId,
    userBId,
  }: { userAId: number; userBId: number }): Promise<(UserBase & { timezone: string })[][]> {
    const userListPromises = [
      this.db.select().from(user).where(eq(user.pk_user_id, userAId)),
      this.db.select().from(user).where(eq(user.pk_user_id, userBId)),
    ];

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
   * @description Retrieves a private chat entry by unique chat key.
   * @param {string} uniqueChatKey - The unique chat key.
   * @returns {Promise<{ pk_private_chat_id: number; user_a_id: number; user_b_id: number; created_at: Date; unique_chat_key: string }>} - The private chat entry.
   */
  async getPrivateChatEntryByUniquePrivateChatKey({
    uniquePrivateChatKey,
  }: { uniquePrivateChatKey: string }): Promise<(PrivateChatBase & { timezone: string })[]> {
    try {
      const privateChatEntry = await this.db
        .select()
        .from(privateChats)
        .where(eq(privateChats.unique_chat_key, uniquePrivateChatKey));
      return privateChatEntry;
    } catch (err) {
      if (typeof err === 'object' && Object.keys(err as object).length > 0) {
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
   * @description Creates a new private chat entry.
   * @param {UserBase} sender - The sender of the chat.
   * @param {UserBase} receiver - The receiver of the chat.
   * @returns {Promise<{ pk_private_chat_id: number; user_a_id: number; user_b_id: number; created_at: Date; unique_chat_key: string }>} - The created chat entry.
   */
  async createPrivateChatEntry(
    sender: CreatePrivateChatEntryType & { timezone: string },
    receiver: CreatePrivateChatEntryType & { timezone: string },
    uniquePrivateChatKey: string,
  ): Promise<PrivateChatBase[]> {
    // If an entry already exists, return the existing entry
    const existingEntry = await this.getPrivateChatEntryByUniquePrivateChatKey({
      uniquePrivateChatKey,
    });

    if (existingEntry.length > 0) {
      return existingEntry;
    }

    const [user_a_id, user_b_id] = [sender.pk_user_id, receiver.pk_user_id].sort((a, b) => a - b);

    return await this.db
      .insert(privateChats)
      .values({
        user_a_id: user_a_id,
        user_b_id: user_b_id,
        created_at: sender.created_at,
        timezone: sender.timezone,
        unique_chat_key: ObfuscatedChatKey.getObfuscatedChatKey(user_a_id, user_b_id),
      })
      .returning({
        pk_private_chat_id: privateChats.pk_private_chat_id,
        user_a_id: privateChats.user_a_id,
        user_b_id: privateChats.user_b_id,
        created_at: privateChats.created_at,
        timezone: privateChats.timezone,
        unique_chat_key: privateChats.unique_chat_key,
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
  }: CreatePrivateMessageType) {
    try {
      let imageProcessingPromise: Promise<Buffer | null> | null = null;

      // Start image processing early
      if (imageFile) {
        imageProcessingPromise = this.processImageForStorage(imageFile);
      }

      // Start DB insertion immediately
      const dbInsertPromise = this.db
        .insert(privateMessages)
        .values({
          fk_private_chat_id: privateChatsInsertResponse.pk_private_chat_id,
          fk_user_id: senderId,
          message_text: message,
          image_file: null,
          image_name: imageName,
          image_url: null,
          sent_at: created_at,
          timezone: timezone,
          fk_private_chat_unique_key: privateChatsInsertResponse.unique_chat_key,
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
          image_url: privateMessages.image_url,
        });

      // Process image and DB insertion in parallel
      const [processedImage, response] = await Promise.all([
        imageProcessingPromise,
        dbInsertPromise,
      ]);

      return { processedImage, response };
    } catch (err) {
      Sentry.captureException(err, {
        tags: {
          method: 'createPrivateMessage',
          senderId,
        },
      });
      return {
        error: true,
        reason: err.message,
      };
    }
  }

  syncPrivateMessage({
    processedImage,
    imageName,
    messageId,
  }: {
    processedImage: Buffer;
    imageName: string;
    messageId: number;
  }): Promise<string | null> {
    // Add retries to the uploadImageToPrivateImageBucket function
    return this.uploadImageToPrivateImageBucket(processedImage, imageName).then(
      (bucketResponse) => {
        if (!bucketResponse) {
          throw new Error('Failed to upload image to private image bucket');
        }
        const { SUPABASE_BUCKET_URL } = getEnvs();
        const fullFilePath = `${SUPABASE_BUCKET_URL}/storage/v1/object/public/${bucketResponse.fullPath}`;

        // Return the database update promise so the caller gets the result when it actually completes
        return this.db
          .update(privateMessages)
          .set({ image_url: fullFilePath })
          .where(eq(privateMessages.id, messageId))
          .returning({ image_url: privateMessages.image_url })
          .then((response) => {
            if (response.length === 0) {
              throw new Error('Failed to update private message with image URL');
            }
            return response[0].image_url;
          })
          .catch((err) => {
            Sentry.captureException(err, {
              extra: {
                messageId,
                method: 'syncPrivateMessage',
              },
            });
            throw new Error('Failed to update private message with image URL');
          });
      },
    );
  }
}

export default QueryHandlers;
