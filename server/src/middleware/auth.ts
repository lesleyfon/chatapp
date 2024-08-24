import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import { UserSchema } from "../model/Auth.model";
import { user } from "../schema";
import { eq } from "drizzle-orm";
import jwt from "jsonwebtoken";
import { RequestWithUser } from "src/routes/auth";

interface UserInterface {
	id: number;
	name: string;
	email: string;
	password: string;
	createdAt?: string;
	updatedAt?: string;
  pk_user_id: string
  userId: number
}

export class AuthMiddleware extends UserSchema {
  constructor() {
    super();
    this.authenticateRequests = this.authenticateRequests.bind(this);
    this.authenticateUserLoginMiddleware = this.authenticateUserLoginMiddleware.bind(this);
  }
  async authenticateRequests(req: RequestWithUser, res: Response, next: NextFunction) {
    const authorization = req.headers["authorization"];
    if (!authorization || !authorization.includes("Bearer")) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        message: "Unauthorized",
        code: StatusCodes.UNAUTHORIZED,
      });
    }
    const token = authorization.split(" ")[1];
    const user = jwt.decode(token) as UserInterface;

    if (!user) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        message: "Unauthorized",
        code: StatusCodes.UNAUTHORIZED,
      });
    }

    const userExist = await this.getUser({ email: user.email });

    if (userExist === undefined) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        message: "Unauthorized",
        code: StatusCodes.UNAUTHORIZED,
      });
    }
    req.user = {
      pk_user_id: user.userId.toString(),
      email: user.email,
      name: user.name,
    };
    
    next();
    return; 
  }

  async authenticateUserLoginMiddleware(req: Request, res: Response, next: NextFunction) {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: `Bad Request email and password are required`,
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

  async authenticateUserRegisterMiddleware(req: Request, res: Response, next: NextFunction) {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: `Bad Request email name, and password are required to register`,
      });
    }
    const userExist = await this.db.select().from(user).where(eq(user.email, email));
    if (userExist.length > 0) {
      return res.status(StatusCodes.FORBIDDEN).json({
        message: "User with email already exist. Try another email",
        code: StatusCodes.FORBIDDEN,
      });
    }

    const userObj = await this.createUser({
      email,
      password,
      name,
    });
    if (!userExist) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: "Error occurred while creating a new user",
        code: StatusCodes.INTERNAL_SERVER_ERROR,
      });
    }
    // @ts-expect-error Description: Ignoring type error because user is not recognized by TypeScript.
    req.user = {
      name,
      email,
      password: userObj?.password as string,
      userId: userObj?.id,
    };
    // @ts-expect-error Description: Ignoring type error because user is not recognized by TypeScript.
    req.token = await this.createJWT({ name, email });
    return next();
  }
}

export default AuthMiddleware;
