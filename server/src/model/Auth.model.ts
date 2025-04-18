import bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { StatusCodes } from 'http-status-codes';
import jwt, { TokenExpiredError } from 'jsonwebtoken';

import { connectToDB } from '../db';
import { user } from '../schema';
import type { JWT_RETURN_USER, UserInterface } from '../types';
import { getEnvs } from '../utils/get-envs';

const { JWT_SECRET } = getEnvs();

export class UserSchema {
  db: NodePgDatabase<Record<string, never>>;
  constructor() {
    this.db = connectToDB();
  }

  async createUser({
    name,
    password,
    email,
    timezone,
    created_at,
  }: {
    name: string;
    password: string;
    email: string;
    timezone: string;
    created_at: string;
  }): Promise<(Omit<UserInterface, 'created_at'> & { timezone: string }) | undefined> {
    try {
      const hashedPassword = await this.hashPassword({ password });

      const response = await this.db
        .insert(user)
        .values({ name, password: hashedPassword, email, timezone, created_at }) // Default all users to UTC timezone
        .returning({
          id: user.pk_user_id,
          name: user.name,
          email: user.email,
          timezone: user.timezone,
        });

      return {
        name,
        email,
        id: response[0].id,
        pk_user_id: response[0].id,
        timezone: response[0].timezone,
      };
    } catch (err) {
      if (typeof err === 'object' && Object.keys(err as object).length > 0) {
        throw new Error(JSON.stringify(err as object));
      }
    }
    return;
  }

  async getUser({ email }: { email: string }) {
    try {
      const userExist = await this.db.select().from(user).where(eq(user.email, email));

      if (userExist.length === 0) {
        return undefined;
      }

      return userExist[0];
    } catch (err) {
      if (typeof err === 'object' && Object.keys(err as object).length > 0) {
        throw new Error(JSON.stringify(err as object));
      }
      return {
        reason: 'Failed to retrieve user',
        code: StatusCodes.INTERNAL_SERVER_ERROR,
      };
    }
  }

  async getAuthUser({
    email,
    password,
  }: {
    email: string;
    password: string;
  }): Promise<
    | ({ user: UserInterface; token: string } & {
        code?: StatusCodes;
        message?: string;
      })
    | { code: StatusCodes; reason: string }
  > {
    const userExist = await this.db.select().from(user).where(eq(user.email, email));

    if (userExist.length === 0) {
      return { code: StatusCodes.NOT_FOUND, reason: 'User does not exist' };
    }

    const dbUser = {
      ...userExist[0],
      pk_user_id: userExist[0].pk_user_id,
    } as unknown as UserInterface;

    const isPasswordCorrect = await this.comparePassword({
      password,
      encryptedPassword: dbUser?.password as string,
    });

    if (!isPasswordCorrect) {
      return {
        reason: 'Incorrect password',
        code: StatusCodes.UNAUTHORIZED,
      };
    }
    const token = await this.createJWT({
      name: dbUser.name ?? '',
      email: dbUser?.email as string,
      userId: dbUser.pk_user_id,
      timezone: dbUser.timezone as string,
      created_at: dbUser.created_at as string,
    });
    return {
      user: {
        id: dbUser.pk_user_id,
        pk_user_id: dbUser.pk_user_id,
        name: dbUser.name ?? '',
        email: dbUser.email as string,
        password: dbUser.password as string,
        timezone: dbUser.timezone ?? 'UTC',
        created_at: dbUser.created_at as string,
      },
      token,
    };
  }

  createJWT({
    name,
    email,
    userId,
    timezone,
    created_at,
  }: {
    name: string;
    email: string;
    userId: number;
    timezone: string;
    created_at: string;
  }) {
    const token = jwt.sign(
      {
        userId,
        name: name,
        email: email,
        timezone,
        created_at,
      },
      JWT_SECRET,
      {
        expiresIn: '24h',
        algorithm: 'HS256',
      },
    );
    return token;
  }

  async decodeJWT(
    token: string | null,
  ): Promise<undefined | JWT_RETURN_USER | { reason: string; code: number }> {
    try {
      if (!token) {
        return;
      }

      const response = (await jwt.verify(token, JWT_SECRET)) as JWT_RETURN_USER;

      return response;
    } catch (err) {
      if (err instanceof TokenExpiredError) {
        return {
          reason: 'Unauthorized',
          code: StatusCodes.UNAUTHORIZED,
        };
      }
      return undefined;
    }
  }

  async comparePassword({
    encryptedPassword,
    password,
  }: {
    encryptedPassword: string;
    password: string;
  }) {
    const isMatch = await bcrypt.compare(password, encryptedPassword);
    return isMatch;
  }

  async hashPassword({ password }: { password: string }): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    return passwordHash;
  }
}
