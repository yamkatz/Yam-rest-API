import { Router } from "express";
import { ILogin, IUser } from "../@types/user";
import { User } from "../database/model/user";
import { validateLogin, validateRegistration } from "../middleware/validation";
import { createUser, validateUser } from "../service/user-service";
import { isAdmin } from "../middleware/is-admin";
import { isAdminOrUser } from "../middleware/is-admin-or-user";
import { isUser } from "../middleware/is-user";
import { auth } from "../service/auth-service";
import { Logger, logger } from "../logs/logger";
import { validateToken } from "../middleware/validate-token";
import {
  getUserLoginAttempts,
  logFailedAttempt,
  clearLoginAttempts,
} from "../database/connection";
import { checkBlockedUser } from "../middleware/check-blocked-user";
import { error } from "winston";

const router = Router();

router.get("/", isAdmin, async (req, res, next) => {
  try {
    const allUsers = await User.find();

    res.json(allUsers);
  } catch (e) {
    logger.error("Unauthorized: You must be an Admin user.", 401, error);
    next(e);
  }
});

router.put("/:id", isUser, validateRegistration, async (req, res, next) => {
  try {
    //hash the password:
    req.body.password = await auth.hashPassword(req.body.password);

    const editUser = await User.findByIdAndUpdate(
      { _id: req.params.id },
      req.body,
      { new: true }
    );

    res.json({ user: editUser });
  } catch (e) {
    Logger.error("Internal Server Error", 500, error);
    next(e);
  }
});

router.patch("/:id", validateToken, async (req, res, next) => {
  try {
    const userIdFromToken = req.user._id.toString();
    const userIdFromPath = req.params.id;

    if (userIdFromToken !== userIdFromPath) {
      return res
        .status(403)
        .json({ error: "Unauthorized: You can only update your own status." });
    }

    if (req.body && typeof req.body === "object") {
      const isBusiness = req.body.isBusiness;

      if (isBusiness !== undefined) {
        const user = await User.findByIdAndUpdate(
          { _id: userIdFromPath },
          { $set: { isBusiness } },
          { new: true }
        );

        if (!user) {
          return res.status(404).json({ error: "User not found" });
        }

        return res.json(user);
      } else {
        return res
          .status(400)
          .json({ error: "Missing required parameter: isBusiness" });
      }
    }
  } catch (error) {
    console.error("Error updating user:", error);
    next(error);
  }
});

router.get("/:id", isAdminOrUser, async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = (await User.findById(id).lean()) as IUser;

    const { password, ...rest } = user;
    return res.json({ user: rest });
  } catch (e) {
    next(e);
  }
});

router.delete("/:id", isAdminOrUser, validateToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleteUser = await User.findOneAndDelete({ _id: id });
    Logger.verbose("deleted the user");
    return res.json(deleteUser);
  } catch (e) {
    next(e);
  }
});

router.post("/", validateRegistration, async (req, res, next) => {
  try {
    const saved = await createUser(req.body as IUser);
    res.status(201).json({ message: "Saved", user: saved });
  } catch (err) {
    next(err);
  }
});

//login, if failed 3 attempts with invalid password = blocked for 24 hours
router.post(
  "/login",
  checkBlockedUser,
  validateLogin,
  async (req, res, next) => {
    try {
      const { email, password } = req.body as ILogin;
      try {
        const userAttempts = await getUserLoginAttempts(email);

        if (userAttempts && userAttempts.attempts >= 3) {
          const lastAttemptDate =
            userAttempts.dates[userAttempts.dates.length - 1];
          const blockTime = new Date(
            lastAttemptDate.getTime() + 24 * 60 * 60 * 1000
          );

          if (blockTime > new Date()) {
            res.status(401).json({
              message: "Unauthorized - User is blocked for 24 hours...",
            });
            return;
          } else {
            // Clear login attempts after 24 hours
            clearLoginAttempts(email);
          }
        }

        const jwt = await validateUser(email, password);
        res.json(jwt);
      } catch (e) {
        // Log failed attempt
        logFailedAttempt(email);

        // Handle invalid email/password
        res.status(401).json({ message: "Invalid email or password." });
      }
    } catch (e) {
      next(e);
    }
  }
);

export { router as usersRouter };
