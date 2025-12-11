import mongoose, { Schema, model, models, Document } from "mongoose";

interface PastorFieldOptionsDocument extends Document {
  fieldName: string;
  options: string[];
  updatedAt: Date;
  updatedBy: mongoose.Types.ObjectId;
}

const PastorFieldOptionsSchema = new Schema<PastorFieldOptionsDocument>(
  {
    fieldName: {
      type: String,
      required: true,
      unique: true,
      enum: [
        "clergyTypes",
        "areas",
        "councils",
        "occupations",
        "maritalStatuses",
        "genders",
        "statuses",
        "pastorFunctions",
      ],
    },
    options: {
      type: [String],
      required: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default models.PastorFieldOptions ||
  model<PastorFieldOptionsDocument>("PastorFieldOptions", PastorFieldOptionsSchema);
