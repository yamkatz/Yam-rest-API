import { RequestHandler, Request } from "express";
import { auth } from "../service/auth-service";
import { User } from "../database/model/user";
import { extractToken } from "./is-admin";
import { BizCardsError } from "../error/biz-cards-error";
import { IUser } from "../@types/user";
import { Logger } from "../logs/logger";

const isUser: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    const token = extractToken(req);
    const { email } = auth.verifyJWT(token);

    //get user from database
    const user = (await User.findOne({ email }).lean()) as IUser;

    req.user = user;

    if (!user) {
      Logger.error("User does not exist", 401, { email });
      throw new BizCardsError("User does not exist", 401);
    }

    if (id == user?._id) return next();

    Logger.error("The id must belong to the user", 401, {
      email,
      userId: user._id,
      requestedUserId: id,
    });
    res.status(401).json({ message: "The id must belong to the user" });
  } catch (e) {
    Logger.error("Error in isUser middleware", 500, e);
    next(e);
  }
};

export { isUser };
