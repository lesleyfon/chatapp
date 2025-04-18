import { getBearer, getBrowserTimeZone, getCurrentDateTimeWithTimezone } from '../lib';
import type { PrivateChatResultType } from '../types';

export interface UserInterface {
  id: number;
  name: string;
  email: string;
  password: string;
  createdAt?: string;
  updatedAt?: string;
}
export interface ErrorResponse {
  error: boolean;
  reason: string;
}

export interface SuccessResponse {
  msg: PrivateChatResultType[];
}

type AuthFormDataType = Pick<UserInterface, 'password' | 'email'> & {
  name?: string;
};

class HttpServer {
  apiBasePath: string;
  apiHeaders = new Headers({ 'Content-Type': 'application/json' });
  INPUT_NAME = 'new-chat-name';

  constructor() {
    const APP_ENV = import.meta.env.VITE_APP_ENV;
    const { API_BASE_PATH } = JSON.parse(APP_ENV) as { API_BASE_PATH: string };
    if (!API_BASE_PATH) {
      throw Error(`No API_BASE_PATH value: API_BASE_PATH: ${API_BASE_PATH}`);
    }
    this.apiBasePath = `${API_BASE_PATH}/api`;
  }

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
      const timezone = getBrowserTimeZone();
      const created_at = getCurrentDateTimeWithTimezone();
      const raw = JSON.stringify({
        ...userCredential,
        timezone,
        created_at,
      });
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
  setBearerTokenToHeader(): void {
    const BEARER_TOKEN: string = getBearer() ?? '';
    if (this.apiHeaders.get('Authorization') === null) {
      this.apiHeaders.set('Authorization', BEARER_TOKEN);
    }
  }

  async fetchChatListsDataFromChatId(chatId: string) {
    this.setBearerTokenToHeader();

    const response = await fetch(`${this.apiBasePath}/chats/${chatId}`, {
      headers: this.apiHeaders,
    });
    const data = await response.json();

    return data;
  }

  /**
   * This TypeScript function fetches private message lists data from a recipient ID using an API call
   * with authorization.
   * @param {string} recipientId - RecipientId is a string parameter that represents the unique
   * identifier of the recipient for whom you want to fetch private message lists data.
   * @returns The function `fetchPrivateMessageListsDataFromRecipientId` returns a Promise that resolves
   * to an object with a property `msg` containing an array of `PrivateChatResultType` items.
   */

  async fetchPrivateMessageListsDataFromRecipientId(
    recipientId: string,
  ): Promise<SuccessResponse | ErrorResponse> {
    this.setBearerTokenToHeader();

    const response = await fetch(`${this.apiBasePath}/chats/private-message/${recipientId}`, {
      headers: this.apiHeaders,
    });
    const data = (await response.json()) as SuccessResponse | ErrorResponse;

    return data;
  }

  async fetchAllChatroom() {
    this.setBearerTokenToHeader();

    const response = await fetch(`${this.apiBasePath}/chats/all/chat-rooms`, {
      headers: this.apiHeaders,
    });

    const data = await response.json();

    return data;
  }
  async fetchAllPrivateChatroom() {
    this.setBearerTokenToHeader();

    const response = await fetch(`${this.apiBasePath}/chats/all/private-chat-rooms`, {
      headers: this.apiHeaders,
    });

    const data = await response.json();

    return data;
  }

  createNewRoomMutationFn = async (data: { [key: string]: string }) => {
    const bearer = getBearer();
    if (!bearer) {
      throw new Error('No authorization token found. Logout and login again.');
    }
    const timezone = getBrowserTimeZone();
    const created_at = getCurrentDateTimeWithTimezone();

    const response = await fetch(`${this.apiBasePath}/chats/chat/new-chatroom`, {
      method: 'POST',
      headers: this.apiHeaders,
      body: JSON.stringify({
        chat_name: data?.[this.INPUT_NAME],
        created_at,
        timezone,
      }),
    });

    if (!response.ok) {
      const errorResponse = await response.json();
      throw new Error(JSON.stringify(errorResponse));
    }
    return response;
  };
}

export default new HttpServer();
