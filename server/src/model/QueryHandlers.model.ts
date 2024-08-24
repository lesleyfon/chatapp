import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { connectToDB } from "../db";
import { chatMembers, messages, chats, user } from "../schema";
import { UserSchema } from "./Auth.model";
import { sql, desc, eq } from "drizzle-orm";


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


export class QueryHandlers extends UserSchema {
  db: NodePgDatabase;

  constructor(){
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
  async insertMessageToTable(chatId:string, user_id:string, message: string){

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
  async selectUserChatRoomsWithLastSetMessages(userId: string): Promise<ChatListType>{
    const chatList: ChatListType = await this.db.select().from(chatMembers)
      .where(eq(chatMembers.fk_user_id , userId))
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

  async selectChatByChatName(chatName: string){
    const chatExist = await this.db.select().from(chats).where(eq(chats.chat_name, chatName));
    return chatExist;
  }


  async selectChatRoomMessagesByUserId(userId: string, chatRoomId:string) {
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
      .where(eq(chats.pk_chats_id , chatRoomId))
      .leftJoin(messages, eq(chats.pk_chats_id, messages.fk_chat_id))
      .leftJoin(user, eq(messages.fk_user_id, user.pk_user_id));
			
    const mappedMessages = chatRoomMessages.map(data => {
      const dataUserId = (data.chat_user?.pk_user_id)?.toString();
      if(dataUserId === userId){
        //@ts-expect-error ignore
        data.chat_user.sender = 'You';
      }
      return data;
    });
    return mappedMessages;
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
  async getMostRecentChatMessageSent(messageResponse:MessageType[]){
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
  async createNewChatRoom(chatName:string){
    const insertIntoChatResponse = await this.db
      .insert(chats)
      .values({ chat_name: chatName })
      .returning({
        id: chats.pk_chats_id,
      });
    return insertIntoChatResponse;
  }
}

export default QueryHandlers;


