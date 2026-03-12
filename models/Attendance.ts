import mongoose, { Document, Schema, model, models } from "mongoose";

export interface IAttendance extends Document {
  pastor: mongoose.Types.ObjectId;
  pastor_code: string;
  attendance_date: Date;
  week_start: Date;
  week_end: Date;
  marked_by?: mongoose.Types.ObjectId;
  source: "manual" | "bulk-upload";
  createdAt: Date;
  updatedAt: Date;
}

const AttendanceSchema = new Schema<IAttendance>(
  {
    pastor: {
      type: Schema.Types.ObjectId,
      ref: "Pastor",
      required: true,
      index: true,
    },
    pastor_code: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    attendance_date: {
      type: Date,
      required: true,
      index: true,
    },
    week_start: {
      type: Date,
      required: true,
      index: true,
    },
    week_end: {
      type: Date,
      required: true,
    },
    marked_by: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    source: {
      type: String,
      enum: ["manual", "bulk-upload"],
      default: "manual",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

AttendanceSchema.index({ pastor: 1, attendance_date: 1 }, { unique: true });

const Attendance = models.Attendance || model<IAttendance>("Attendance", AttendanceSchema);

export default Attendance;
