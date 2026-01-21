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
      type: [String],
      enum: ["Bishop", "Mother", "Sister", "Reverend", "Pastor", "Not Applicable"],
      required: [true, "Please select at least one title"],
      validate: {
        validator: function (v: string[]) {
          // Require at least one title
          if (!v || v.length === 0) return false;
          // Allow maximum of 2 titles
          if (v.length > 2) return false;
          return true;
        },
        message: "A pastor must have at least one title (maximum of 2)",
      },
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
      default: null,
    },
    gender: {
      type: String,
      enum: ["Male", "Female"],
      required: false,
    },
    council: {
      type: String,
      trim: true,
      required: [true, "Please select a council"],
    },
    area: {
      type: String,
      trim: true,
      required: [true, "Please select an area"],
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
    contact_number: {
      type: String,
      required: false,
    },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
      required: false,
    },
    function: {
      type: [String],
      required: false,
      default: [],
      set: (v: string | string[]) => {
        if (!v) return [];
        const arr = Array.isArray(v) ? v : [v];
        return [...new Set(arr.filter(Boolean))];
      },
      validate: {
        validator: function (v: string[]) {
          if (!Array.isArray(v)) return false;
          // If "Not Applicable" is selected, it must be the only function
          if (v.includes("Not Applicable")) {
            return v.length === 1;
          }
          // Otherwise, allow any number of functions
          return true;
        },
        message: "If 'Not Applicable' is selected, no other functions can be selected",
      },
    },
  },
  {
    timestamps: true,
  },
);

// Add compound index for duplicate checking
PastorSchema.index({ first_name: 1, last_name: 1, date_of_birth: 1 });

export default models.Pastor || model<PastorDocument>("Pastor", PastorSchema);
