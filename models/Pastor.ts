import mongoose, { Schema, model, models, Document } from "mongoose";
import { Pastor, ClergyType, MaritalStatus } from "@/types/entities";

interface PastorDocument extends Omit<Pastor, "id" | "date_of_birth" | "church">, Document {
  date_of_birth: Date;
  church: mongoose.Types.ObjectId;
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
      enum: ["Bishop", "Mother", "Sister", "Reverend", "Pastor"],
      required: [true, "Please provide a pastor title"],
    },
    marital_status: {
      type: String,
      enum: ["Single", "Married", "Divorced", "Widowed"],
      required: [true, "Please provide a marital status"],
    },
    church: {
      type: Schema.Types.ObjectId,
      ref: "Church",
      required: [true, "Please provide a church reference"],
    },
    gender: {
      type: String,
      enum: ["Male", "Female"],
      required: [true, "Please provide a gender"],
    },
    council: {
      type: String,
      enum: ["Philippians", "Galatians", "2 Corinthians", "Anagkazo", "Area 1", "Area 3", "Area 4"],
      required: [true, "Please provide a council"],
    },
    occupation: {
      type: String,
      required: [true, "Please provide an occupation"],
    },
    country: {
      type: String,
      required: [true, "Please provide a country"],
    },
    phone_number: {
      type: String,
      required: [true, "Please provide a phone number"],
    },
    whatsapp_number: {
      type: String,
      required: [true, "Please provide a WhatsApp number"],
    },
  },
  {
    timestamps: true,
  }
);

export default models.Pastor || model<PastorDocument>("Pastor", PastorSchema);
