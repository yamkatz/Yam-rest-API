import {
  getUserLoginAttempts,
  clearLoginAttempts,
} from "../database/connection";
import { Logger } from "../logs/logger";

const checkBlockedUser = async (req, res, next) => {
  const { email } = req.body;

  try {
    const userAttempts = await getUserLoginAttempts(email);

    if (userAttempts && userAttempts.attempts >= 3) {
      const lastAttemptDate = userAttempts.dates[userAttempts.dates.length - 1];
      const blockTime = new Date(
        lastAttemptDate.getTime() + 24 * 60 * 60 * 1000
      );

      if (blockTime > new Date()) {
        Logger.error("Unauthorized - User is blocked for 24 hours", 401, {
          email,
        });
        res
          .status(401)
          .json({ message: "Unauthorized - User is blocked for 24 hours..." });
        return;
      } else {
        // Clear login attempts after 24 hours
        await clearLoginAttempts(email);
      }
    }

    next();
  } catch (error) {
    Logger.error("Error checking blocked user", 500, error);
    next(error);
  }
};

export { checkBlockedUser };
