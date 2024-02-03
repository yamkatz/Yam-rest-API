import { RequestHandler, Request } from "express";
import { BizCardsError } from "../error/biz-cards-error";
import { auth } from "../service/auth-service";
import { User } from "../database/model/user";
import { Logger } from "../logs/logger";
import { error } from "console";

const extractToken = (req: Request) => {
  const authHeader = req.header("Authorization");

  if (
    authHeader &&
    authHeader.length > 7 &&
    authHeader.toLowerCase().startsWith("bearer ")
  ) {
    return authHeader.substring(7);
  }
  throw new BizCardsError("token is missing in Authorization header", 400);
};

const validateToken: RequestHandler = async (req, res, next) => {
  try {
    const token = extractToken(req);

    const { email } = auth.verifyJWT(token);
    const user = await User.findOne({ email });
    if (!user) {
      Logger.error("User not found for the given token", 401, error);
      throw new BizCardsError("User does not exist", 401);
    }
    req.user = user;
    next();
  } catch (e) {
    next(e);
  }
};

export { validateToken };
