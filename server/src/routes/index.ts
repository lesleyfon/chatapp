import { Router, Request, Response } from "express";
import { authRouter } from "./auth";
import { chatRouter } from "./chats";

class App_Routes {
  router = Router();
  constructor() {
    // Base Routes
    this.router.use("/auth", authRouter);
    this.router.use("/chats", chatRouter);
    
    this.router.get("/", this.baseRoute);
  }

  baseRoute(_req: Request, res: Response) {
    res.send("Hello world");
  }
}
export const appRouter = new App_Routes().router;
