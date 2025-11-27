import mongoose, { Schema, model, models, Document } from "mongoose";
import { Pastor, ClergyType, MaritalStatus } from "@/types/entities";

interface PastorDocument extends Omit<Pastor, "id" | "date_of_birth" | "date_of_appointment" | "church">, Document {
  date_of_birth: Date;
  date_of_appointment: Date;
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
    date_of_appointment: {
      type: Date,
      required: false,
    },
    profile_image: {
      type: String,
      required: false,
    },
    clergy_type: {
      type: String,
      enum: ["Bishop", "Mother", "Sister", "Reverend", "Pastor", "Governor"],
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
    area: {
      type: String,
      enum: [
        "HGE Area 1",
        "HGE Area 2",
        "HGE Area 3",
        "HGE Area",
        "Experience Area 1",
        "Experience Area 2",
        "Experience Area 3",
        "Experience Area 4",
      ],
      required: false,
    },
    ministry: {
      type: String,
      enum: ["GLGC", "Film Stars", "Dancing Stars", "Praise and Worship"],
      required: false,
    },
    creative_arts: {
      type: String,
      required: false,
    },
    basonta: {
      type: String,
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
    email: {
      type: String,
      required: false,
      lowercase: true,
      trim: true,
    },
    phone_number: {
      type: String,
      required: false,
    },
    whatsapp_number: {
      type: String,
      required: false,
    },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

// Add compound index for duplicate checking
PastorSchema.index({ first_name: 1, last_name: 1, date_of_birth: 1 });

export default models.Pastor || model<PastorDocument>("Pastor", PastorSchema);
