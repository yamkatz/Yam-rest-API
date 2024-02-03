import { Logger } from "../logs/logger";
import { User } from "./model/user";
import { users } from "./users";
import { cards } from "./cards";

const initDB = async () => {
  const usersCount = await User.countDocuments();
  if (usersCount != 0) return;

  for (let user of users) {
    const saved = await new User(user).save();
    Logger.verbose("Added user: ", saved);
  }

  const cardsCount = await User.countDocuments();
  if (cardsCount != 0) return;

  for (let card of cards) {
    const saved = await new User(card).save();
    Logger.verbose("Added card: ", saved);
  }
};

export { initDB };
