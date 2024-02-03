import { RequestHandler, Request } from "express";
import { auth } from "../service/auth-service";
import { User } from "../database/model/user";
import { extractToken } from "./is-admin";
import { BizCardsError } from "../error/biz-cards-error";
import { Logger } from "../logs/logger";

const isAdminOrUser: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    const token = extractToken(req);
    const { email } = auth.verifyJWT(token);

    //get user from database:
    const user = await User.findOne({ email });

    if (!user) {
      Logger.error("User does not exist", 401, { email });
      throw new BizCardsError("User does not exist", 401);
    }

    if (id == user.id) return next();

    if (user.isAdmin) return next();

    Logger.error("Permission Denied", 401, {
      message: "Only admin/The id must belong to the user",
      userId: user._id,
      requestedUserId: id,
    });

    res
      .status(401)
      .json({ message: "Only admin/The id must belong to the user" });
  } catch (e) {
    next(e);
  }
};

export { isAdminOrUser };
