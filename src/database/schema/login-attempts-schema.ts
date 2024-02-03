import { Schema, model, Document } from "mongoose";

interface ILoginAttempts extends Document {
  email: string;
  attempts: number;
  dates: Date[];
}

const loginAttemptsSchema = new Schema<ILoginAttempts>({
  email: { type: String, required: true, unique: true },
  attempts: { type: Number, default: 0 },
  dates: { type: [Date], default: [] },
});

const LoginAttempts = model<ILoginAttempts>(
  "LoginAttempts",
  loginAttemptsSchema
);

export { ILoginAttempts, LoginAttempts };
