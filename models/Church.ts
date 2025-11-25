import mongoose, { Schema, model, models } from "mongoose";
import { Church } from "@/types/entities";

const ChurchSchema = new Schema<Church>(
  {
    name: {
      type: String,
      required: [true, "Please provide a church name"],
      maxlength: [100, "Name cannot be more than 100 characters"],
    },
    location: {
      type: String,
      required: [true, "Please provide a location"],
      maxlength: [200, "Location cannot be more than 200 characters"],
    },
    images: {
      type: [String],
      default: [],
    },
    head_pastor: {
      type: String,
      required: [true, "Please provide the head pastor name"],
    },
    members: {
      type: Number,
      required: [true, "Please provide the number of members"],
      min: [0, "Members cannot be negative"],
    },
    income: {
      type: Number,
      required: [true, "Please provide the income"],
      min: [0, "Income cannot be negative"],
    },
  },
  {
    timestamps: true,
  }
);

export default models.Church || model<Church>("Church", ChurchSchema);
