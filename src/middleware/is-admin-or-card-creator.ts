import { RequestHandler } from "express";
import { auth } from "../service/auth-service";
import { User } from "../database/model/user";
import { Card } from "../database/model/card";
import { extractToken } from "./is-admin";
import { BizCardsError } from "../error/biz-cards-error";
import { Logger } from "../logs/logger";

const isAdminOrCardCreator: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    const token = extractToken(req);
    const { email } = auth.verifyJWT(token);

    // Get user from the database:
    const user = await User.findOne({ email });

    if (!user) {
      Logger.error("User does not exist", 401, { email });
      throw new BizCardsError("User does not exist", 401);
    }

    // Check if the user is an admin
    if (user.isAdmin) {
      return next();
    }

    // Check if the user is the creator of the card
    const card = await Card.findOne({ _id: id, userId: user._id });

    if (card) {
      return next(); // User is the creator of the card
    }

    // If not an admin and not the card creator, deny permission
    Logger.error("Permission Denied", 403, {
      message: "You are not an admin or not the card creator",
      userId: user._id,
      cardId: id,
    });
    res.status(403).json({
      error: "Permission Denied, you are not an admin or not the card creator",
    });
  } catch (e) {
    Logger.error("Error in isAdminOrCardCreator middleware", 500, e);
    next(e);
  }
};

export { isAdminOrCardCreator };

export { isAdminOrUser };
