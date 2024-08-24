
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

class BaseClass {}

export class Chat extends AuthMiddlewareMixin(QueryHandlersMixin(BaseClass)) {
  router = Router();
  queryHandlers: QueryHandlers;
  constructor() {
    super();


    // Method Binding
    this.getChatMessagesById = this.getChatMessagesById.bind(this);


    // Middlewares
    this.router.get('/', this.baseRoute);
    this.router.get('/:chatId', 
      // @ts-expect-error desc
      this.authMiddleware.authenticateRequests, 
      this.getChatMessagesById);
  }

  async getChatMessagesById(req:RequestWithUser , res: Response){
    
    const { chatId } = req.params;
    if(!chatId){
      res.status(StatusCodes.BAD_REQUEST).json({
        messages: `Bad Request: chatId is required chatId = ${chatId}`  
      });
    }

    const userId = req.user.pk_user_id;
    const chatMessages = await this.queryHandlers.selectChatRoomMessagesByUserId(userId, chatId);

    res.status(StatusCodes.OK).json({ msg: chatMessages });
  }

  
  baseRoute(_req:Request, res: Response){
    res.json({ 'Base': "Routes" });
  }
}


export const chatRouter = new Chat().router;
