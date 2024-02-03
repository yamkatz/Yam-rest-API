import { RequestHandler, Request } from "express";
import { BizCardsError } from "../error/biz-cards-error";
import { auth } from "../service/auth-service";
import { User } from "../database/model/user";
import { Logger } from "../logs/logger";

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

const isAdmin: RequestHandler = async (req, res, next) => {
  try {
    const token = extractToken(req);
    const { email } = auth.verifyJWT(token);

    //get user from database
    const user = await User.findOne({ email });

    const isAdmin = user?.isAdmin;
    if (isAdmin) {
      return next();
    }

    Logger.error("Must be admin", 401, { email });
    return res.status(401).json({ message: "Must be admin" });
  } catch (e) {
    Logger.error("Error in isAdmin middleware", 500, e);
    next(e);
  }
};

export { isAdmin, extractToken };
