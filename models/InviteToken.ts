import mongoose, { Schema, model, models } from "mongoose";

export interface IInviteToken extends mongoose.Document {
  token: string;
  email: string;
  council: string;
  createdBy: mongoose.Types.ObjectId;
  isUsed: boolean;
  usedBy?: mongoose.Types.ObjectId;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const InviteTokenSchema = new Schema<IInviteToken>(
  {
    token: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    council: {
      type: String,
      required: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isUsed: {
      type: Boolean,
      default: false,
    },
    usedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const InviteToken = models.InviteToken || model<IInviteToken>("InviteToken", InviteTokenSchema);

export default InviteToken;
