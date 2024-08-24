import bcrypt from "bcrypt";

import jwt from "jsonwebtoken";
import { getEnvs } from "../utils/getEnvs";
import { connectToDB } from "../db";
import { user } from "../schema";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
import { StatusCodes } from "http-status-codes";

const { JWT_LIFETIME, JWT_SECRET } = getEnvs();
export interface UserInterface {
	pk_user_id: string;
	id?: string;
	name: string;
	email: string;
	password?: string;
	createdAt?: string;
	updatedAt?: string;
}

export class UserSchema {
  db: NodePgDatabase<Record<string, never>>;
  constructor() {
    this.db = connectToDB();
  }

  async createUser({
    name,
    password,
    email,
  }: {
    name: string;
    password: string;
    email: string;
  }): Promise<UserInterface | undefined> {

    try {
      const hashedPassword = await this.hashPassword({ password });
      const response = await this.db
        .insert(user)
        .values({ name, password: hashedPassword, email })
        .returning({
          id: user.pk_user_id,
          name: user.name,
          email: user.email,
        });
  
      return {
        name,
        email,
        password: hashedPassword,
        id: response[0].id,
        pk_user_id: response[0].id,
      };
    } catch (err) {
      if (typeof err === "object" && Object.keys(err as object).length) {
        throw new Error(JSON.stringify(err as object));
      }
    }
    return; 
  }


  async getUser({ email }: { email: string }) {
    try{
      const userExist = await this.db.select().from(user).where(eq(user.email, email));
      if (userExist.length === 0) {
        return undefined;
      }
      return userExist[0];
    } catch (err) {
      if (typeof err === "object" && Object.keys(err as object).length) {
        throw new Error(JSON.stringify(err as object));
      }
      return err; 
    }
  }


  async getAuthUser({ email, password }: { email: string; password: string }): Promise<
		| ({ user: UserInterface; token: string } & {
			code?: StatusCodes;
			message?: string;
		})
		| { code: StatusCodes; message: string }
	> {
    const userExist = await this.db.select().from(user).where(eq(user.email, email));
    
    
    if (userExist.length === 0) {
      return { code: StatusCodes.NOT_FOUND, message: "User does not exist" };
    }

    const dbUser = userExist[0] as UserInterface;

    const isPasswordCorrect = await this.comparePassword({
      password,
      encryptedPassword: dbUser?.password as string,
    });

    if (!isPasswordCorrect) {
      return {
        message: "Incorrect password",
        code: StatusCodes.UNAUTHORIZED,
      };
    }
    const token = await this.createJWT({
      name: dbUser.name ?? "",
      email: dbUser?.email as string,
      userId: dbUser.pk_user_id
    });
    return {
      user: {
        id: dbUser.pk_user_id,
        pk_user_id: dbUser.pk_user_id,
        name: dbUser.name ?? "",
        email: dbUser.email as string,
        password: dbUser.password as string,
      },
      token,
    };
  }


  async createJWT({ name, email, userId }: { name: string; email: string, userId: string }) {
    const token = jwt.sign({
      userId,
      name: name,
      email: email,
    },
    JWT_SECRET,
    { expiresIn: JWT_LIFETIME });
    return token;
  }

  async decodeJWT(token: string | null): Promise<undefined | { userId: string, name: string, email: string }> {

    if (!token) {
      return;
    }
    const response = await jwt.verify(token, JWT_SECRET) as { userId: string, name: string, email: string };
    return response;
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

