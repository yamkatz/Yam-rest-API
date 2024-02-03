// pnpm add mongoose
import { Logger } from "../logs/logger";
import { initDB } from "./initDB";
import mongoose from "mongoose";
import { LoginAttempts, ILoginAttempts } from "./schema/login-attempts-schema";
import { error } from "console";

const connect = async () => {
  try {
    //read the connection string from dotenv file:
    const connectionString = process.env.DB_CONNECTION_STRING;

    if (!connectionString) {
      Logger.error(
        "DB_CONNECTION_STRING IS NOT DEFINED IN your .env file",
        0,
        error
      );
      return;
    }

    //connect to the database:
    await mongoose.connect(connectionString);

    //blue:
    Logger.debug("Database Connected");
    //init the database:
    await initDB();
  } catch (err) {
    Logger.error("Error Connecting to database", 500, err);
  }
};

const getUserLoginAttempts = async (
  email: string
): Promise<ILoginAttempts | null> =>
  await LoginAttempts.findOne({ email }).exec();

const logFailedAttempt = async (email: string) => {
  const userAttempts = await getUserLoginAttempts(email);

  if (userAttempts) {
    userAttempts.attempts += 1;
    userAttempts.dates.push(new Date());
    await userAttempts.save();
  } else {
    await LoginAttempts.create({ email, attempts: 1, dates: [new Date()] });
  }
};

const clearLoginAttempts = async (email: string) =>
  await LoginAttempts.findOneAndUpdate(
    { email },
    { attempts: 0, dates: [] }
  ).exec();

export { connect, getUserLoginAttempts, logFailedAttempt, clearLoginAttempts };
