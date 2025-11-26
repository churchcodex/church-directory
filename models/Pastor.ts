import mongoose, { Schema, model, models, Document } from "mongoose";
import { Pastor, ClergyType, MaritalStatus } from "@/types/entities";

interface PastorDocument extends Omit<Pastor, "id" | "date_of_birth" | "church">, Document {
  date_of_birth: Date;
  church: mongoose.Types.ObjectId;
}

const PastorSchema = new Schema<PastorDocument>(
  {
    first_name: {
      type: String,
      required: [true, "Please provide a first name"],
      maxlength: [50, "First name cannot be more than 50 characters"],
    },
    middle_name: {
      type: String,
      required: false,
      maxlength: [50, "Middle name cannot be more than 50 characters"],
    },
    last_name: {
      type: String,
      required: [true, "Please provide a last name"],
      maxlength: [50, "Last name cannot be more than 50 characters"],
    },
    date_of_birth: {
      type: Date,
      required: false,
    },
    position: {
      type: String,
      required: false,
      maxlength: [100, "Position cannot be more than 100 characters"],
    },
    profile_image: {
      type: String,
      required: false,
    },
    clergy_type: {
      type: String,
      enum: ["Bishop", "Mother", "Sister", "Reverend", "Pastor"],
      required: false,
    },
    marital_status: {
      type: String,
      enum: ["Single", "Married", "Divorced", "Widowed"],
      required: false,
    },
    church: {
      type: Schema.Types.ObjectId,
      ref: "Church",
      required: false,
    },
    gender: {
      type: String,
      enum: ["Male", "Female"],
      required: false,
    },
    council: {
      type: String,
      enum: ["Philippians", "Galatians", "2 Corinthians", "Anagkazo", "Area 1", "Area 3", "Area 4"],
      required: false,
    },
    occupation: {
      type: String,
      required: false,
    },
    country: {
      type: String,
      required: false,
    },
    phone_number: {
      type: String,
      required: false,
    },
    whatsapp_number: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

export default models.Pastor || model<PastorDocument>("Pastor", PastorSchema);
