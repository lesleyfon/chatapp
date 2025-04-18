import { eq } from 'drizzle-orm';
import type { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import jwt from 'jsonwebtoken';
import { UserSchema } from '../model/auth.model';
import { user } from '../schema';
import type { JWT_RETURN_USER, RequestWithUser, UserInterface } from '../types';

export class AuthMiddleware extends UserSchema {
  constructor() {
    super();
    this.authenticateRequests = this.authenticateRequests.bind(this);
    this.authenticateUserLoginMiddleware = this.authenticateUserLoginMiddleware.bind(this);
  }
  /**
   * @description Authenticates the request by checking the authorization header.
   * @param {RequestWithUser} req - The request object.
   * @param {Response} res - The response object.
   * @param {NextFunction} next - The next function.
   * @returns {Promise<void>} - A promise that resolves to void.
   */
  async authenticateRequests(req: RequestWithUser, res: Response, next: NextFunction) {
    const authorization = req.headers.authorization;
    if (!authorization || !authorization.includes('Bearer')) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        reason: 'Unauthorized',
        code: StatusCodes.UNAUTHORIZED,
      });
    }
    const token = authorization.split(' ')[1];
    const user = jwt.decode(token) as JWT_RETURN_USER;

    if (!user) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        reason: 'Unauthorized',
        code: StatusCodes.UNAUTHORIZED,
      });
    }

    const userExist = await this.getUser({ email: user.email });

    if (userExist === undefined) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        reason: 'Unauthorized',
        code: StatusCodes.UNAUTHORIZED,
      });
    }

    req.user = {
      pk_user_id: user.userId,
      email: user.email,
      name: user.name,
    };

    next();
    return;
  }

  /**
   * @description Authenticates the user login by checking the email and password.
   * @param {Request} req - The request object.
   * @param {Response} res - The response object.
   * @param {NextFunction} next - The next function.
   * @returns {Promise<Response<any, Record<string, any>> | void>} - A promise that resolves to void.
   */
  async authenticateUserLoginMiddleware(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response<unknown, Record<string, unknown>> | void> {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        reason: 'Bad Request email and password are required',
        code: StatusCodes.BAD_REQUEST,
      });
    }

    const response = await this.getAuthUser({ email, password });
    if (response.code) {
      return res.status(response.code).json(response);
    }

    // @ts-expect-error Description: Ignoring type error because user is not recognized by TypeScript.
    req.user = response.user as UserInterface;
    // @ts-expect-error Description: Ignoring type error because token is not recognized by TypeScript.
    req.token = response.token;

    return next();
  }

  /**
   * @description Authenticates the user register by checking the email, password, and name.
   * @param {Request} req - The request object.
   * @param {Response} res - The response object.
   * @param {NextFunction} next - The next function.
   * @returns {Promise<Response<any, Record<string, any>> | void>} - A promise that resolves to void.
   */
  async authenticateUserRegisterMiddleware(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response<unknown, Record<string, unknown>> | void> {
    const { email, password, name, timezone, created_at } = req.body;
    if (!email || !password || !name) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        reason: 'Bad Request email name, and password are required to register',
      });
    }
    if (!timezone || !created_at) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        reason: 'Bad Request timezone, and created_at are required to register',
      });
    }
    const userExist = await this.db.select().from(user).where(eq(user.email, email));
    if (userExist.length > 0) {
      return res.status(StatusCodes.FORBIDDEN).json({
        reason: 'User with email already exist. Try another email',
        code: StatusCodes.FORBIDDEN,
      });
    }

    const userObj = await this.createUser({
      email,
      password,
      name,
      timezone,
      created_at,
    });

    if (!userExist) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        reason: 'Error occurred while creating a new user',
        code: StatusCodes.INTERNAL_SERVER_ERROR,
      });
    }
    // @ts-expect-error Description: Ignoring type error because user is not recognized by TypeScript.
    req.user = {
      name,
      email,
      userId: userObj?.id,
      timezone: userObj?.timezone,
    };
    // @ts-expect-error Description: Ignoring type error because user is not recognized by TypeScript.
    req.token = await this.createJWT({ name, email, userId: userObj?.id });
    return next();
  }
}

export default AuthMiddleware;
