import { Request } from "express";

import { IUser } from "./user";

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}
