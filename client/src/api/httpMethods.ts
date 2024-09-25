import { getBearer } from '../lib/utils';
import { PrivateChatResultType } from '../types';

export interface UserInterface {
	id: number;
	name: string;
	email: string;
	password: string;
	createdAt?: string;
	updatedAt?: string;
}

type AuthFormDataType = Pick<UserInterface, "name" | "email" > & {"password"?: string}


class HttpServer {
	apiBasePath = 'http://localhost:3010';

	async login(userCredential: AuthFormDataType) {
		try {
			const myHeaders = new Headers();
			myHeaders.append('Content-Type', 'application/json');
			const raw = JSON.stringify(userCredential);

			const response = await fetch(`${this.apiBasePath}/auth/login`, {
				method: 'POST',
				headers: myHeaders,
				body: raw,
				redirect: 'follow',
			});
			const result = await response.text();
			return result;
		} catch (error) {
			return error;
		}
	}
	async register(userCredential: AuthFormDataType) {
		try {
			const myHeaders = new Headers();
			myHeaders.append('Content-Type', 'application/json');
			const raw = JSON.stringify(userCredential);

			const response = await fetch(`${this.apiBasePath}/auth/register`, {
				method: 'POST',
				headers: myHeaders,
				body: raw,
				redirect: 'follow',
			});
			const result = await response.text();
			return result;
		} catch (error) {
			return error;
		}
	}

	async fetchChatListsDataFromChatId  (chatId: string) {
		const response = await fetch(`${this.apiBasePath}/chats/${chatId}`, {
			headers: {
				Authorization: getBearer(),
			},
		});
		return await response.json();
	}

/**
 * This TypeScript function fetches private message lists data from a recipient ID using an API call
 * with authorization.
 * @param {string} recipientId - RecipientId is a string parameter that represents the unique
 * identifier of the recipient for whom you want to fetch private message lists data.
 * @returns The function `fetchPrivateMessageListsDataFromRecipientId` returns a Promise that resolves
 * to an object with a property `msg` containing an array of `PrivateChatResultType` items.
 */
	async fetchPrivateMessageListsDataFromRecipientId  (recipientId: string): Promise<{msg: PrivateChatResultType[]}> {
		
		const response = await fetch(`${this.apiBasePath}/chats/private-message/${recipientId}`, {
			headers: {
				Authorization: getBearer(),
			},
		});
		const data =  await response.json()

		return data
	}

	async fetchAllChatroom (){
		const response = await fetch(`${this.apiBasePath}/chats/all/chat-rooms`, {
			headers: {
				Authorization: getBearer(),
			},
		});
		return await response.json();
	}
}

export default new HttpServer();
