import * as Sentry from '@sentry/node';
import type { Request, Response } from 'express';
import { Router } from 'express';
import { StatusCodes } from 'http-status-codes';

import AuthMiddleware from '../middleware/auth';
import QueryHandlers from '../model/query-handlers.model';
import type { RequestWithUser } from '../types';

export type ClassType = new (...args: unknown[]) => object;

export const AuthMiddlewareMixin = (Base: ClassType) =>
  class extends Base {
    authMiddleware: AuthMiddleware;

    constructor(...args: unknown[]) {
      super(...args);
      this.authMiddleware = new AuthMiddleware();
    }
  };

export const QueryHandlersMixin = (Base: ClassType) =>
  class extends Base {
    queryHandlers: QueryHandlers;

    constructor(...args: unknown[]) {
      super(...args);
      this.queryHandlers = new QueryHandlers();
    }
  };

class BaseClass {}

export class Chat extends AuthMiddlewareMixin(QueryHandlersMixin(BaseClass)) {
  router = Router();
  queryHandlers: QueryHandlers;
  constructor() {
    super();

    // Method Binding
    this.getChatMessagesById = this.getChatMessagesById.bind(this);
    this.getPrivateMessagesById = this.getPrivateMessagesById.bind(this);
    this.getAllChatRooms = this.getAllChatRooms.bind(this);
    this.createChatRoom = this.createChatRoom.bind(this);

    // Middlewares
    this.router.get('/', this.baseRoute);
    this.router.get('/:chatId', this.authMiddleware.authenticateRequests, this.getChatMessagesById);
    this.router.get(
      '/private-message/:uniquePrivateChatKey',
      this.authMiddleware.authenticateRequests,
      this.getPrivateMessagesById,
    );
    this.router.get(
      '/all/chat-rooms',
      this.authMiddleware.authenticateRequests,
      this.getAllChatRooms,
    );
    // Get all private chat rooms
    this.router.get(
      '/all/private-chat-rooms',
      this.authMiddleware.authenticateRequests,
      this.getAllPrivateChatRooms,
    );
    this.router.post(
      '/chat/new-chatroom',
      this.authMiddleware.authenticateRequests,
      this.createChatRoom,
    );
  }

  /**
   * Get chat messages by chatId
   * @param req - Request with user
   * @param res - Response
   * @returns - Chat messages
   */
  async getChatMessagesById(req: Request, res: Response) {
    try {
      const { chatId } = req.params;
      if (!chatId) {
        // Report Error to Sentry
        const eventId = Sentry.captureEvent({
          level: 'error',
          extra: {
            message: `Bad Request: chatId is required chatId = ${chatId}`,
            chatId,
            userId: req.user.pk_user_id,
          },
        });

        return res.status(StatusCodes.BAD_REQUEST).json({
          messages: `Bad Request: chatId is required chatId = ${chatId}`,
          eventId,
          error: true,
        });
      }

      const userId = req.user.pk_user_id;
      const chatMessages = await this.queryHandlers.selectChatRoomMessagesByUserId(
        userId,
        Number.parseInt(chatId),
      );

      if ('error' in chatMessages) {
        // Report Error to Sentry
        const eventId = Sentry.captureEvent({
          level: 'error',
          extra: {
            message: `Bad Request: chatMessages error = ${chatMessages}`,
            chatMessages,
            userId: req.user.pk_user_id,
          },
        });
        return res.status(StatusCodes.BAD_REQUEST).json({
          ...chatMessages,
          eventId,
        });
      }

      Sentry.captureMessage(
        `Success: retrieved chat messages for userId = ${userId} and chatId = ${chatId}`,
        {
          level: 'info',
          extra: {
            message: `Success: retrieved chat messages for userId = ${userId} and chatId = ${chatId}`,
            userId,
            chatId,
          },
        },
      );
      // Return Success
      return res.status(StatusCodes.OK).json({ msg: chatMessages });
    } catch (error) {
      Sentry.captureException(error, {
        extra: {
          method: 'getChatMessagesById',
          userId: req.user.pk_user_id,
          chatId: req.params.chatId,
        },
      });
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: 'Internal Server Error',
      });
    }
  }

  /**
   * Get private messages by recipientId
   * @param req - Request with user
   * @param res - Response
   * @returns - Private messages
   */
  async getPrivateMessagesById(req: RequestWithUser, res: Response) {
    try {
      const { uniquePrivateChatKey } = req.params;
      if (!uniquePrivateChatKey) {
        // Report Error to Sentry
        const eventId = Sentry.captureEvent({
          level: 'error',
          extra: {
            messages: `Bad Request: recipientId is required: uniquePrivateChatKey = ${uniquePrivateChatKey}`,
            uniquePrivateChatKey,
            userId: req.user.pk_user_id,
          },
        });

        return res.status(StatusCodes.BAD_REQUEST).json({
          error: true,
          messages: `Bad Request: uniquePrivateChatKey is required: uniquePrivateChatKey = ${uniquePrivateChatKey}`,
          eventId,
        });
      }

      const userId = req.user.pk_user_id;
      const privateMessages = await this.queryHandlers.getPrivateRoomMessagesBySenderId({
        userId,
        uniquePrivateChatKey,
      });

      if ('error' in privateMessages) {
        // Report Error to Sentry
        const eventId = Sentry.captureEvent({
          level: 'error',
          extra: {
            message: `Bad Request: privateMessages error = ${privateMessages}`,
            privateMessages,
            userId,
            uniquePrivateChatKey,
          },
        });

        return res.status(StatusCodes.BAD_REQUEST).json({
          ...privateMessages,
          eventId,
        });
      }

      Sentry.captureMessage(
        `Success: retrieved private messages for uniquePrivateChatKey = ${uniquePrivateChatKey}`,
        {
          level: 'info',
          extra: {
            message: `Success: retrieved private messages for userId = ${userId} and uniquePrivateChatKey = ${uniquePrivateChatKey}`,
            userId,
            uniquePrivateChatKey,
          },
        },
      );
      // Return Success
      return res.status(StatusCodes.OK).json({ msg: privateMessages });
    } catch (error) {
      Sentry.captureException(error, {
        extra: {
          userId: req.user.pk_user_id,
          uniquePrivateChatKey: req.params.uniquePrivateChatKey,
          method: 'getPrivateMessagesById',
        },
      });
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: 'Internal Server Error',
      });
    }
  }

  async getAllChatRooms(_req: Request, res: Response) {
    const chatRooms = await this.queryHandlers.getAllChatRooms();
    if ('error' in chatRooms) {
      return res.status(StatusCodes.BAD_REQUEST).json(chatRooms);
    }
    return res.status(StatusCodes.OK).json(chatRooms);
  }

  getAllPrivateChatRooms = async (req: RequestWithUser, res: Response) => {
    try {
      const userId = req.user?.pk_user_id;
      const privateChatRooms = await this.queryHandlers.getAllPrivateChatRooms({
        userId,
      });

      if ('error' in privateChatRooms) {
        return res.status(StatusCodes.BAD_REQUEST).json(privateChatRooms);
      }

      return res.status(StatusCodes.OK).json(privateChatRooms);
    } catch (error) {
      if (error instanceof Error) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          msg: error.message,
        });
      }
      return res.status(StatusCodes.BAD_REQUEST).json({
        msg: 'An unknown error occurred',
      });
    }
  };

  async createChatRoom(req: RequestWithUser, res: Response) {
    const { chat_name, created_at, timezone } = req.body;
    const userId = req.user.pk_user_id;

    if (chat_name?.length === 0) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        msg: 'Room name cant be a falsy value',
      });
    }

    if (!timezone || !created_at) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        reason: 'Bad Request: timezone, and created_at are required to create a chat room',
      });
    }

    const chatRooms = await this.queryHandlers.createNewChatroomRoomNameAndByUserId({
      chatName: chat_name,
      created_at,
      timezone,
      userId: userId,
    });

    if ('error' in chatRooms) {
      return res.status(StatusCodes.BAD_REQUEST).json(chatRooms);
    }

    return res.status(StatusCodes.OK).json(chatRooms);
  }

  baseRoute(_req: Request, res: Response) {
    res.json({ Base: 'Routes' });
  }
}

export const chatRouter = new Chat().router;
