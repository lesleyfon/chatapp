
import { Router, Response, Request } from "express";
import { StatusCodes } from "http-status-codes";

import AuthMiddleware from "../middleware/auth";
import QueryHandlers from "../model/QueryHandlers.model";
import { RequestWithUser } from "./auth";

export type ClassType = new (...args: unknown[]) => object


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

class BaseClass { }

export class Chat extends AuthMiddlewareMixin(QueryHandlersMixin(BaseClass)) {
  router = Router();
  queryHandlers: QueryHandlers;
  constructor() {
    super();


    // Method Binding
    this.getChatMessagesById = this.getChatMessagesById.bind(this);
    this.getAllChatRooms = this.getAllChatRooms.bind(this);
    this.createChatRoom = this.createChatRoom.bind(this);


    // Middlewares
    this.router.get('/', this.baseRoute);
    this.router.get('/:chatId',
      // @ts-expect-error desc
      this.authMiddleware.authenticateRequests,
      this.getChatMessagesById);
    this.router.get('/all/chat-rooms',
      // @ts-expect-error desc
      this.authMiddleware.authenticateRequests,
      this.getAllChatRooms);
    this.router.post('/chat/new-chatroom',
      // @ts-expect-error desc
      this.authMiddleware.authenticateRequests,
      this.createChatRoom);

  }

  async getChatMessagesById(req: RequestWithUser, res: Response) {

    const { chatId } = req.params;
    if (!chatId) {
      res.status(StatusCodes.BAD_REQUEST).json({
        messages: `Bad Request: chatId is required chatId = ${chatId}`
      });
    }

    const userId = req.user.pk_user_id;
    const chatMessages = await this.queryHandlers.selectChatRoomMessagesByUserId(userId, chatId);
    if ('error' in chatMessages) {
      return res.status(StatusCodes.BAD_REQUEST).json(chatMessages);
    }
    return res.status(StatusCodes.OK).json({ msg: chatMessages });
  }

  async getAllChatRooms(_req: Request, res: Response) {

    const chatRooms = await this.queryHandlers.getAllChatRooms();
    if ('error' in chatRooms) {
      return res.status(StatusCodes.BAD_REQUEST).json(chatRooms);
    }
    return res.status(StatusCodes.OK).json(chatRooms);
  }
  async createChatRoom(req: RequestWithUser, res: Response) {

    const { chat_name } = req.body;
    const userId = req.user.pk_user_id;

    if(chat_name?.length === 0){
      return res.status(StatusCodes.BAD_REQUEST).json({
        msg: "Room name cant be a falsy value"
      });
    }
    const chatRooms = await this.queryHandlers.createNewChatroomRoomNameAndByUserId(chat_name, userId);

    if ('error' in chatRooms) {
      return res.status(StatusCodes.BAD_REQUEST).json(chatRooms);
    }

    return res.status(StatusCodes.OK).json(chatRooms);
  }


  baseRoute(_req: Request, res: Response) {
    res.json({ 'Base': "Routes" });
  }
}


export const chatRouter = new Chat().router;
