import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { IJWTPayload } from "../@types/user";
import { Logger } from "../logs/logger";
import { BizCardsError } from "../error/biz-cards-error";

const authService = {
  hashPassword: (plainTextPassword: string, rounds = 12) => {
    return bcrypt.hash(plainTextPassword, rounds);
  },

  validatePassword: (plainTextPassword: string, hash: string) => {
    return bcrypt.compare(plainTextPassword, hash);
  },

  generateJWT: (payload: IJWTPayload) => {
    try {
      const secret = process.env.JWT_SECRET!;
      return jwt.sign(payload, secret);
    } catch (error) {
      Logger.error("Error generating JWT", 500, error);
      throw new BizCardsError("Internal Server Error", 500);
    }
  },

  verifyJWT: (token: string) => {
    try {
      const secret = process.env.JWT_SECRET!;
      const payload = jwt.verify(token, secret);
      return payload as IJWTPayload & { iat: number };
    } catch (error) {
      Logger.error("Error verifying JWT", 401, error);
      throw new BizCardsError("Unauthorized", 401);
    }
  },
};

export { authService as auth };
