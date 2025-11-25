import mongoose, { Schema, model, models, Document } from "mongoose";
import { Pastor, ClergyType, MaritalStatus } from "@/types/entities";

interface PastorDocument extends Omit<Pastor, "id" | "date_of_birth">, Document {
  date_of_birth: Date;
}

const PastorSchema = new Schema<PastorDocument>(
  {
    name: {
      type: String,
      required: [true, "Please provide a name"],
      maxlength: [100, "Name cannot be more than 100 characters"],
    },
    date_of_birth: {
      type: Date,
      required: [true, "Please provide a date of birth"],
    },
    position: {
      type: String,
      required: [true, "Please provide a position"],
      maxlength: [100, "Position cannot be more than 100 characters"],
    },
    profile_image: {
      type: String,
      required: [true, "Please provide a profile image"],
    },
    clergy_type: {
      type: String,
      enum: ["Bishop", "Mother", "Sister", "Reverend", "Pastor", "Basonta Leader", "Governor"],
      required: [true, "Please provide a clergy type"],
    },
    marital_status: {
      type: String,
      enum: ["Single", "Married", "Divorced", "Widowed"],
      required: [true, "Please provide a marital status"],
    },
    church: {
      type: String,
      required: [true, "Please provide a church reference"],
    },
  },
  {
    timestamps: true,
  }
);

export default models.Pastor || model<PastorDocument>("Pastor", PastorSchema);
