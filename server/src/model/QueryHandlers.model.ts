
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { connectToDB } from "../db";
import { chatMembers, messages, chats, user, privateChats, privateMessages } from "../schema";
import { UserSchema } from "./Auth.model";
import { sql, desc, eq, asc, and, or, inArray, } from "drizzle-orm";

export type SQLErrorType = {
  error: boolean,
  reason: string
}

export type MessageType = {
  id: number;
  fk_chat_id: string;
  fk_user_id: string;
  message_text: string | null;
  sent_at: Date;
}

export type ChatType = {
  pk_chats_id: string;
  chat_name: string | null;
  createdAt: Date;
} | null

export type ChatMembersType = {
  id: string | null;
  fk_chat_id: string;
  fk_user_id: string;
  added_at: Date;
}

export type ChatListType = {
  chat_members: ChatMembersType
  chats: ChatType
  messages?: MessageType
}[]

export type DBUserInterface = {
  name: string | null;
  password: string | null;
  email: string | null;
  pk_user_id: string;
  created_at: Date;
  updated_at: Date;
}

export type PrivateChatResult = {
  private_chat: {
    pk_private_chat_id: string; // Assuming UUID or similar
    sender_id: string;
    recipient_id: string;
    created_at: Date; // Assuming it's a timestamp
  };
  chat_user: {
    pk_user_id: string; // Assuming UUID or similar
    name: string;
    email: string;
    created_at: Date; // Assuming it's a timestamp
  };
  private_messages: {
    id: string; // Assuming UUID or similar
    fk_private_chat_id: string;
    fk_user_id: string;
    message_text: string;
    sent_at: Date; // Assuming it's a timestamp
  };
}

export class QueryHandlers extends UserSchema {
  db: NodePgDatabase;

  constructor() {
    super();
    this.db = connectToDB();
  }


  /**
 * Inserts a message into the `messages` table and ensures the user is a member of the chat.
 * 
 * This function performs two operations:
 * 1. Inserts a new message into the `messages` table.
 * 2. Ensures that the user is added to the `chatMembers` table if they are not already a member.
 * 
 * @example
 * const messageResponse = await insertMessageToTable('chat123', 'user456', 'Hello World');
 * console.log(messageResponse);
 * // Output: { id: '...', sent_at: '...', fk_user_id: 'user456', fk_chat_id: 'chat123', message_text: 'Hello World' }
 */
  async insertMessageToTable(chatId: string, user_id: string, message: string) {

    const [messageResponse] = await Promise.all([
      this.db.insert(messages)
        .values({ fk_chat_id: chatId, fk_user_id: user_id, message_text: message })
        .returning({
          id: messages.id,
          sent_at: messages.sent_at,
          fk_user_id: messages.fk_user_id,
          fk_chat_id: messages.fk_chat_id,
          message_text: messages.message_text,
        }),

      /** @description  Insert a new record into the chatMembers table, but only if that record does not already exist. */
      this.db.execute(sql`
        INSERT INTO ${chatMembers} (fk_chat_id, fk_user_id)
        SELECT ${chatId}, ${user_id}
        WHERE NOT EXISTS (
          SELECT 1 FROM ${chatMembers} WHERE fk_chat_id = ${chatId} AND fk_user_id = ${user_id}
        );
      `)
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
  async selectUserChatRoomsWithLastSetMessages(userId: string): Promise<ChatListType> {
    const chatList: ChatListType = await this.db.select({
      chat_members: {
        added_at: chatMembers.added_at,
        fk_chat_id: chatMembers.fk_chat_id,
        fk_user_id: chatMembers.fk_user_id,
        id: chatMembers.id
      },
      chats: {
        pk_chats_id: chats.pk_chats_id,
        chat_name: chats.chat_name,
        createdAt: chats.createdAt
      },
      chat_user: {
        created_at: user.created_at,
        email: user.email,
        name: user.name,
        pk_user_id: user.pk_user_id,
      },

    }).from(chatMembers)
      .where(eq(chatMembers.fk_user_id, userId))
      .leftJoin(user, eq(user.pk_user_id, userId))
      .leftJoin(chats, eq(chats.pk_chats_id, chatMembers.fk_chat_id));


    const chatListPromises = chatList.map(async (chat) => {
      const mostRecentMessages = await this.db.select().from(messages)
        .where(eq(messages.fk_chat_id, chat.chats?.pk_chats_id as string))
        .orderBy(desc(messages.sent_at))
        .limit(1);
      return {
        ...chat,
        messages: mostRecentMessages[0],
      };
    });


    const updatedChatList = await Promise.all(chatListPromises);

    return updatedChatList;
  }


  async getLatestChatRoomMessageSent(userId: string, chatRoomId: string) {
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

    return chatList;
  }
  async selectChatByChatName(chatName: string) {
    const chatExist = await this.db.select().from(chats).where(eq(chats.chat_name, chatName));
    return chatExist;
  }


  async selectChatRoomMessagesByUserId(userId: string, chatRoomId: string): Promise<{
    chats: {
      pk_chats_id: string,
      chat_name: string | null,
      createdAt: Date
    } | null,
    messages: {
      id: number;
      fk_chat_id: string;
      message_text: string | null;
      sent_at: Date;
    } | null,
    chat_user: {
      pk_user_id: string,
      name: string | null,
      email: string | null,
      sender?: string
    } | null
  }[] | SQLErrorType> {
    try {

      const chatRoomMessages = await this.db.select({
        chats: {
          pk_chats_id: chats.pk_chats_id,
          chat_name: chats.chat_name,
          createdAt: chats.createdAt
        },
        messages: {
          id: messages.id,
          fk_chat_id: messages.fk_chat_id,
          message_text: messages.message_text,
          sent_at: messages.sent_at
        },
        chat_user: {
          pk_user_id: user.pk_user_id,
          name: user.name,
          email: user.email,
        }
      }).from(chats)
        .where(eq(chats.pk_chats_id, chatRoomId))
        .orderBy(asc(messages.sent_at))
        .leftJoin(messages, eq(chats.pk_chats_id, messages.fk_chat_id))
        .leftJoin(user, eq(messages.fk_user_id, user.pk_user_id));


      const mappedMessages = chatRoomMessages.map(data => {
        const dataUserId = (data.chat_user?.pk_user_id)?.toString();
        if (dataUserId === userId) {
          // @ts-expect-error ignore
          data.chat_user.sender = 'You';
        }
        return data;
      });
      return mappedMessages;
    } catch (err) {
      if (typeof err === "object" && Object.keys(err as object).length) {
        // throw new Error(JSON.stringify(err as object));
        return {
          error: true,
          reason: err.message,
          ...err
        };
      }
      return err;
    }
  }


  async getPrivateRoomMessagesBySenderId({userId, recipientId}:{userId: string, recipientId: string}): Promise<{
    chats: {
      pk_chats_id: string,
      chat_name: string | null,
      createdAt: Date
    } | null,
    messages: {
      id: number;
      fk_chat_id: string;
      message_text: string | null;
      sent_at: Date;
    } | null,
    chat_user: {
      pk_user_id: string,
      name: string | null,
      email: string | null,
      sender?: string
    } | null
  }[] | SQLErrorType> {
    try {
      const chatRoomMessages = await this.db.select({
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
          fk_user_id: privateMessages.fk_user_id
        },
      }).from(privateChats)
        .where(or(and(eq(privateChats.sender_id, userId),
          eq(privateChats.recipient_id, recipientId)),
        and(eq(privateChats.recipient_id, userId),
          eq(privateChats.sender_id, recipientId))))
          
        .leftJoin(privateMessages,
          eq(privateChats.pk_private_chat_id,
            sql<number>`cast(${privateMessages.fk_private_chat_id} as int)`))
        .orderBy(asc(privateMessages.sent_at));

      const privateUserDetails = await this.db.select({
        pk_user_id: user.pk_user_id,
        name: user.name,
        email: user.email,

      })
        .from(user).where(or(eq(user.pk_user_id, userId),
          eq(user.pk_user_id, recipientId)));

      const usersMap = new Map([
        [String(privateUserDetails[0]?.pk_user_id), privateUserDetails[0]],
        [String(privateUserDetails[1]?.pk_user_id), privateUserDetails[1]],
      ]);

      const mappedMessages = chatRoomMessages.map(data => {
        const user_id = data.private_messages?.fk_user_id ?? '';
        const chat_user = usersMap.get(user_id);

        // @ts-expect-error ignore
        data['chat_user'] = chat_user;

        if (String(data.private_messages?.fk_user_id) === userId) {
          // @ts-expect-error ignore
          data.chat_user.sender = 'You';
        }
        return data;
      });
      // @ts-expect-error error 
      return mappedMessages;
    } catch (err) {
      if (typeof err === "object" && Object.keys(err as object).length) {
        // throw new Error(JSON.stringify(err as object));
        return {
          error: true,
          reason: err.message,
          ...err
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
    const chatRoomMessages = await this.db.select({
      pk_user_id: user.pk_user_id,
      name: user.name,
      email: user.email,

    })
      .from(user)
      .where(eq(user.pk_user_id, messageResponseObj.fk_user_id));

    return [
      {
        messages: messageResponseObj,
        chat_user: chatRoomMessages[0]
      }
    ];
  }

  /**
 * @description - Creates a new chat room with the specified name.
    This method inserts a new record into the `chats` table with the provided chat name and
    returns the ID of the newly created chat room.
 * @example
 * const newChatRoom = await createNewChatRoom('General Chat');
 * console.log(newChatRoom);
 * // Output: { id: 'newChatRoomId' }
 */
  async createNewChatRoom(chatName: string) {
    const insertIntoChatResponse = await this.db
      .insert(chats)
      .values({ chat_name: chatName })
      .returning({
        id: chats.pk_chats_id,
      });
    return insertIntoChatResponse;
  }

  async createNewChatroomRoomNameAndByUserId(chatName: string, userId: string) {
    const insertIntoChatResponse = await this.db
      .insert(chats)
      .values({ chat_name: chatName })
      .returning({
        id: chats.pk_chats_id,
      });

    const chatResponse = insertIntoChatResponse[0];
    const chatId = chatResponse.id;


    await this.db.execute(sql`
        INSERT INTO ${chatMembers} (fk_chat_id, fk_user_id)
        SELECT ${chatId}, ${userId}
        WHERE NOT EXISTS (
          SELECT 1 FROM ${chatMembers} WHERE fk_chat_id = ${chatId} AND fk_user_id = ${userId}
        );
      `);


    const chatRoom = await this.db.select({
      chats: {
        pk_chats_id: chats.pk_chats_id,
        chat_name: chats.chat_name,
        createdAt: chats.createdAt
      },
    }).from(chats).where(eq(chats.pk_chats_id, chatId));


    return {
      chats: chatRoom,
      chat_user: chatResponse,
      messages: []
    };
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
          error: true,
          reason: err.message,
          ...err
        };
      }
      return err;
    }
  }

  async getLatestPrivateChatMessagesSent({ userId }: { userId: string }): Promise<PrivateChatResult[]> {
    const privateChatsData = await this.db.selectDistinctOn([privateChats.recipient_id, privateChats.sender_id],
      {
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
        }
      })
      .from(privateChats)
      .where(or(eq(privateChats.sender_id, String(userId)),
        eq(privateChats.recipient_id, String(userId))))
      .orderBy(privateChats.recipient_id, privateChats.sender_id, desc(privateChats.created_at))
      .leftJoin(user, eq(user.pk_user_id, sql<number>`cast(${userId} as int)`))
      .leftJoin(privateMessages, eq(privateMessages.fk_private_chat_id, sql<string>`cast(${privateChats.pk_private_chat_id} as text)`));
  
    // Get unique recipient IDs that are not the current user
    const recipientIds = new Set(privateChatsData.map(data => 
      String(data.private_chat.sender_id) === String(userId) 
        ? String(data.private_chat.recipient_id) 
        : String(data.private_chat.sender_id)));
  
    // Fetch recipient details from user table
    const allRecipients = await this.db.select({
      recipient: {
        pk_user_id: user.pk_user_id,
        name: user.name,
        email: user.email,
        created_at: user.created_at,
      },
    }).from(user).where(inArray(user.pk_user_id, Array.from(recipientIds)));
  
    // Map privateChatsData and ensure unique recipients
    const returnData = privateChatsData.map(data => {
      // Determine the correct recipient ID based on the current user
      const otherUserId = String(data.private_chat.sender_id) === String(userId)
        ? String(data.private_chat.recipient_id)
        : String(data.private_chat.sender_id);
  
      // Find the recipient details
      const recipientDetails = allRecipients.find(d => String(d.recipient.pk_user_id) === otherUserId)?.recipient;
  
      return {
        private_chat: {
          pk_private_chat_id: data.private_chat.pk_private_chat_id,
          sender_id: data.private_chat.sender_id,
          recipient_id: data.private_chat.recipient_id,
          created_at: data.private_chat.created_at,
        },
        chat_user: {
          pk_user_id: data.chat_user?.pk_user_id as string,
          name: data.chat_user?.name ?? '',
          email: data.chat_user?.email ?? '',
          created_at: data.chat_user?.created_at ?? new Date(0),
        },
        private_messages: {
          id: data.private_messages?.id as unknown as string,
          fk_private_chat_id: data.private_messages?.fk_private_chat_id ?? '',
          fk_user_id: data.private_messages?.fk_user_id ?? '',
          message_text: data.private_messages?.message_text ?? '',
          sent_at: data.private_messages?.sent_at ?? new Date(0),
        },
        recipient: recipientDetails, // Use the found recipient details
      };
    });
  
    // Use a Set to filter unique recipients based on their IDs
    const uniqueRecipients = Array.from(new Map(returnData.map(item => 
      // Use recipient pk_user_id as the key
      [item.recipient?.pk_user_id, item])).values());
  
    return uniqueRecipients; // Return the unique recipients
  }
  
}


export default QueryHandlers;