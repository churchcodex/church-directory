import mongoose, { Schema, model, models } from "mongoose";

export interface IUser extends mongoose.Document {
  email: string;
  password: string;
  role: "admin" | "user" | "viewer";
  council?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
    },
    role: {
      type: String,
      enum: ["admin", "user", "viewer"],
      default: "user",
    },
    council: {
      type: String,
      required: function () {
        return this.role === "user";
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

const User = models.User || model<IUser>("User", UserSchema);

export default User;
