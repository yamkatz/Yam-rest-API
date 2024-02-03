import { IUser } from "../@types/user";
import { User } from "../database/model/user";
import { BizCardsError } from "../error/biz-cards-error";
import { auth } from "./auth-service";
import { Logger } from "../logs/logger";

const createUser = async (userData: IUser) => {
  try {
    const user = new User(userData);
    user.password = await auth.hashPassword(user.password);
    return user.save();
  } catch (error) {
    Logger.error("Error creating user", 500, error);
    throw error;
  }
};

const validateUser = async (email: string, password: string) => {
  try {
    const user = await User.findOne({ email });

    if (!user) {
      throw new BizCardsError("Bad credentials", 401);
    }

    const isPasswordValid = await auth.validatePassword(
      password,
      user.password
    );

    if (!isPasswordValid) {
      throw new BizCardsError("Bad credentials", 401);
    }

    const jwt = auth.generateJWT({ email });

    return { jwt };
  } catch (error) {
    Logger.error("Error validating user", 500, error);
    throw error;
  }
};
export { createUser, validateUser };
