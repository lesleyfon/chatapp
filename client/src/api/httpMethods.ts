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

type AuthFormDataType = Pick<UserInterface,  "password" | "email" > & { "name"?: string};


class HttpServer {
	apiBasePath = 'http://localhost:3010';
	apiHeaders = new Headers({ 'Content-Type': 'application/json'});

	async login(userCredential: AuthFormDataType) {
		try {
			const raw = JSON.stringify(userCredential);

			const response = await fetch(`${this.apiBasePath}/auth/login`, {
				method: 'POST',
				headers: this.apiHeaders,
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
			const raw = JSON.stringify(userCredential);

			const response = await fetch(`${this.apiBasePath}/auth/register`, {
				method: 'POST',
				headers: this.apiHeaders,
				body: raw,
				redirect: 'follow',
			});
			const result = await response.text();
			return result;
		} catch (error) {
			return error;
		}
	}

	/**
	 * @description The method `setBearerTokenToHeader` sets a bearer token to the Authorization header if it is not
	 * already set.
	 */
	setBearerTokenToHeader():void {
		const BEARER_TOKEN:string =  getBearer();
		if(this.apiHeaders.get('Authorization') === null){
			this.apiHeaders.set('Authorization', BEARER_TOKEN);
		}
	}

	async fetchChatListsDataFromChatId  (chatId: string) {
		this.setBearerTokenToHeader();

		const response = await fetch(`${this.apiBasePath}/chats/${chatId}`, {
			headers: this.apiHeaders,
		});
		const data =  await response.json();
		
		return data
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
		this.setBearerTokenToHeader();
		
		const response = await fetch(`${this.apiBasePath}/chats/private-message/${recipientId}`, {
			headers: this.apiHeaders,
		});
		const data =  await response.json();

		return data
	}

	async fetchAllChatroom (){
		this.setBearerTokenToHeader();

		const response = await fetch(`${this.apiBasePath}/chats/all/chat-rooms`, {
			headers: this.apiHeaders,
		});

		const data =  await response.json();
		
		return data
	}
}

export default new HttpServer();
