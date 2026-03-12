import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import * as XLSX from "xlsx";
import { authOptions } from "@/lib/auth";
import { getWeekRange, toIsoDateString } from "@/lib/attendance";
import { getErrorMessage } from "@/lib/error";
import dbConnect from "@/lib/mongodb";
import Attendance from "@/models/Attendance";
import Pastor from "@/models/Pastor";

type IdLike = {
  toString(): string;
};

type MatchedPastorRecord = {
  _id: IdLike;
  personal_code?: string;
};

type ExistingAttendanceRecord = {
  pastor: IdLike;
};

type AttendanceInsertRecord = {
  pastor: IdLike;
  pastor_code?: string;
  attendance_date: Date;
  week_start: Date;
  week_end: Date;
  marked_by: string;
  source: "bulk-upload";
};

function normalizeCode(value: unknown) {
  if (typeof value !== "string") {
    if (value === undefined || value === null) {
      return "";
    }

    return String(value).trim().toUpperCase();
  }

  return value.trim().toUpperCase();
}

function extractCodesFromWorksheet(worksheet: XLSX.WorkSheet) {
  const rows = XLSX.utils.sheet_to_json<(string | number | undefined)[]>(worksheet, {
    header: 1,
    blankrows: false,
    defval: "",
  });

  const extractedCodes: string[] = [];

  rows.forEach((row, index) => {
    const firstCell = normalizeCode(row[0]);

    if (!firstCell) {
      return;
    }

    if (index === 0 && ["CODE", "PASTOR CODE", "PERSONAL CODE"].includes(firstCell)) {
      return;
    }

    extractedCodes.push(firstCell);
  });

  return extractedCodes;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Admin access required to bulk upload attendance." },
        { status: 403 },
      );
    }

    await dbConnect();

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const attendanceDateInput = formData.get("attendanceDate");

    if (!file) {
      return NextResponse.json({ success: false, error: "No file uploaded." }, { status: 400 });
    }

    if (typeof attendanceDateInput !== "string" || !attendanceDateInput) {
      return NextResponse.json({ success: false, error: "Attendance date is required." }, { status: 400 });
    }

    const { attendanceDate, weekStart, weekEnd } = getWeekRange(attendanceDateInput);

    const bytes = await file.arrayBuffer();
    const workbook = XLSX.read(Buffer.from(bytes), { type: "buffer" });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const codes = extractCodesFromWorksheet(firstSheet);

    if (codes.length === 0) {
      return NextResponse.json(
        { success: false, error: "The uploaded file does not contain any codes." },
        { status: 400 },
      );
    }

    const uniqueCodes = Array.from(new Set(codes));
    const duplicateCodesInFile = uniqueCodes.length < codes.length ? codes.length - uniqueCodes.length : 0;
    const pastors = await Pastor.find({
      personal_code: { $in: uniqueCodes },
      status: { $ne: "Inactive" },
    }).lean<MatchedPastorRecord[]>();
    const pastorByCode = new Map(
      pastors.filter((pastor) => pastor.personal_code).map((pastor) => [pastor.personal_code as string, pastor]),
    );

    const matchedPastorIds = pastors.map((pastor) => pastor._id);
    const existingAttendance = await Attendance.find({
      pastor: { $in: matchedPastorIds },
      attendance_date: attendanceDate,
    }).lean<ExistingAttendanceRecord[]>();
    const alreadyMarkedPastorIds = new Set(existingAttendance.map((record) => record.pastor.toString()));

    const unmatchedCodes: string[] = [];
    const alreadyMarkedCodes: string[] = [];
    const recordsToInsert: AttendanceInsertRecord[] = [];

    for (const code of uniqueCodes) {
      const pastor = pastorByCode.get(code);

      if (!pastor) {
        unmatchedCodes.push(code);
        continue;
      }

      if (alreadyMarkedPastorIds.has(pastor._id.toString())) {
        alreadyMarkedCodes.push(code);
        continue;
      }

      recordsToInsert.push({
        pastor: pastor._id,
        pastor_code: pastor.personal_code,
        attendance_date: attendanceDate,
        week_start: weekStart,
        week_end: weekEnd,
        marked_by: session.user.id,
        source: "bulk-upload",
      });
    }

    if (recordsToInsert.length > 0) {
      await Attendance.insertMany(recordsToInsert, { ordered: false });
    }

    return NextResponse.json({
      success: true,
      data: {
        attendanceDate: toIsoDateString(attendanceDate),
        weekStart: toIsoDateString(weekStart),
        weekEnd: toIsoDateString(weekEnd),
        totalRows: codes.length,
        uniqueCodes: uniqueCodes.length,
        created: recordsToInsert.length,
        duplicateCodesInFile,
        alreadyMarkedCodes,
        unmatchedCodes,
      },
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error, "Failed to bulk upload attendance."),
      },
      { status: 400 },
    );
  }
}
