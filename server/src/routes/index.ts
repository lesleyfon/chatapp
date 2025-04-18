import { Router } from 'express';
import type { Request, Response } from 'express';

import { authRouter } from './auth';
import { chatRouter } from './chats';

class App_Routes {
  router = Router();
  constructor() {
    this.router.get('/', (_req: Request, res: Response) => {
      res.send('Hello world');
    });
    // Base Routes
    this.router.use('/api/auth', authRouter);
    this.router.use('/api/chats', chatRouter);

    this.router.get('/api', this.baseRoute);
  }

  baseRoute(_req: Request, res: Response) {
    res.send('Hello world');
  }
}
export const appRouter = new App_Routes().router;
