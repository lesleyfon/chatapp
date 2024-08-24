import { Request, Response, Router } from "express";
import { UserInterface, UserSchema } from "../model/Auth.model";
import { StatusCodes } from "http-status-codes";
import AuthMiddleware from "../middleware/auth";

export type RequestWithUser = Request & {
	user: UserInterface;
	token: string;
};

export class AuthRouter extends AuthMiddleware {
  router = Router();
  userModels: UserSchema;

  constructor() {
    super();
    this.userModels = new UserSchema();
    // Bindings
    this.register = this.register.bind(this);
    this.authenticateUserRegisterMiddleware = this.authenticateUserRegisterMiddleware.bind(this);
    this.authenticateUserLoginMiddleware = this.authenticateUserLoginMiddleware.bind(this);

    // Middlewares
    this.router.post("/register",
      this.authenticateUserRegisterMiddleware,
      (req: Request, res: Response) => this.register(req as RequestWithUser, res));
    this.router.post("/login",
      this.authenticateUserLoginMiddleware,
      (req: Request, res: Response) => this.login(req as RequestWithUser, res));
  }

  async register(req: RequestWithUser, res: Response) {
    const user = req.user;
    const token = req.token;
    res.status(StatusCodes.CREATED).json({ user, token, userId: req.user.pk_user_id });
  }

  async login(req: RequestWithUser, res: Response) {
    const { password, email } = req.body;
    if (!email || !password) {
      throw res.status(StatusCodes.BAD_REQUEST).send("Please provide email and password");
    }

    res.status(StatusCodes.OK).json({
      user: {
        name: req.user.name,
        email: req.user.email,
        userId: req.user.pk_user_id
      },
      token: req.token,
    });
  }
}
export const authRouter = new AuthRouter().router;
