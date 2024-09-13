import { getBearer } from '../lib/utils';

export interface UserInterface {
	id: number;
	name: string;
	email: string;
	password: string;
	createdAt?: string;
	updatedAt?: string;
}
class HttpServer {
	apiBasePath = 'http://localhost:3010';

	async login(userCredential: { email: string; password: string }) {
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
	async register(userCredential: { email: string; password: string; name: string }) {
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
