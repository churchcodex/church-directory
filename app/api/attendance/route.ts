import { Session, getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { getTodayIsoDate, getWeekDates, getWeekRange, toIsoDateString } from "@/lib/attendance";
import { getErrorMessage } from "@/lib/error";
import dbConnect from "@/lib/mongodb";
import Attendance from "@/models/Attendance";
import Pastor from "@/models/Pastor";

type IdLike = {
  toString(): string;
};

type AttendanceSource = "manual" | "bulk-upload";

type PastorWeekRecord = {
  _id: IdLike;
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  personal_code?: string;
  council?: string[] | string;
  area?: string;
};

type AttendanceWeekRecord = {
  _id: IdLike;
  pastor: IdLike;
  attendance_date: Date;
  source: AttendanceSource;
};

function getPastorName(pastor: PastorWeekRecord) {
  return [pastor.first_name, pastor.middle_name, pastor.last_name].filter(Boolean).join(" ");
}

async function requireAdminSession(): Promise<Session | null> {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "admin") {
    return null;
  }

  return session;
}

export async function GET(request: NextRequest) {
  try {
    const session = await requireAdminSession();

    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized. Admin access required." }, { status: 403 });
    }

    await dbConnect();

    const weekStartParam = request.nextUrl.searchParams.get("weekStart") || request.nextUrl.searchParams.get("date");
    const { weekStart, weekEnd } = getWeekRange(weekStartParam || getTodayIsoDate());
    const weekStartIso = toIsoDateString(weekStart);
    const weekEndIso = toIsoDateString(weekEnd);

    const [pastors, attendanceRecords] = await Promise.all([
      Pastor.find({ status: { $ne: "Inactive" } })
        .sort({ first_name: 1, last_name: 1 })
        .lean<PastorWeekRecord[]>(),
      Attendance.find({
        attendance_date: {
          $gte: weekStart,
          $lte: weekEnd,
        },
      }).lean<AttendanceWeekRecord[]>(),
    ]);

    const days = getWeekDates(weekStart).map((day) => ({ ...day, marked: false }));
    const attendanceByPastorDate = new Map<string, AttendanceWeekRecord>();

    for (const record of attendanceRecords) {
      const recordDate = toIsoDateString(new Date(record.attendance_date));
      attendanceByPastorDate.set(`${record.pastor.toString()}-${recordDate}`, record);
    }

    const rows = pastors.map((pastor) => {
      const pastorId = pastor._id.toString();
      const dateCells = days.map((day) => {
        const record = attendanceByPastorDate.get(`${pastorId}-${day.date}`);

        return {
          date: day.date,
          label: day.label,
          marked: Boolean(record),
          recordId: record?._id?.toString(),
        };
      });

      return {
        pastorId,
        pastorName: getPastorName(pastor),
        pastorCode: pastor.personal_code || "",
        council: Array.isArray(pastor.council) ? pastor.council : pastor.council ? [pastor.council] : [],
        area: pastor.area || "",
        totalMarks: dateCells.filter((cell) => cell.marked).length,
        dates: dateCells,
      };
    });

    const totalMarks = rows.reduce((sum, row) => sum + row.totalMarks, 0);
    const markedPastors = rows.filter((row) => row.totalMarks > 0).length;

    return NextResponse.json({
      success: true,
      data: {
        weekStart: weekStartIso,
        weekEnd: weekEndIso,
        days,
        rows,
        totalPastors: rows.length,
        markedPastors,
        totalMarks,
      },
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error, "Failed to fetch attendance."),
      },
      { status: 400 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdminSession();

    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized. Admin access required." }, { status: 403 });
    }

    await dbConnect();

    const body = (await request.json()) as { code?: string; attendanceDate?: string };
    const code = typeof body.code === "string" ? body.code.trim().toUpperCase() : "";
    const attendanceDateValue = typeof body.attendanceDate === "string" ? body.attendanceDate : "";

    if (!code) {
      return NextResponse.json({ success: false, error: "Pastor code is required." }, { status: 400 });
    }

    const { attendanceDate, weekStart, weekEnd } = getWeekRange(attendanceDateValue);
    const pastor = await Pastor.findOne({
      personal_code: code,
      status: { $ne: "Inactive" },
    });

    if (!pastor) {
      return NextResponse.json({ success: false, error: `No active pastor found for code ${code}.` }, { status: 404 });
    }

    const existingRecord = await Attendance.findOne({
      pastor: pastor._id,
      attendance_date: attendanceDate,
    }).lean<AttendanceWeekRecord | null>();

    if (existingRecord) {
      const pastorData = pastor.toObject() as PastorWeekRecord;

      return NextResponse.json({
        success: true,
        duplicate: true,
        message: `${code} was already marked for ${toIsoDateString(attendanceDate)}.`,
        data: {
          id: existingRecord._id.toString(),
          pastorId: pastor._id.toString(),
          pastorName: getPastorName(pastorData),
          pastorCode: pastor.personal_code,
          attendanceDate: toIsoDateString(attendanceDate),
          weekStart: toIsoDateString(weekStart),
          weekEnd: toIsoDateString(weekEnd),
          source: existingRecord.source,
        },
      });
    }

    const attendanceRecord = await Attendance.create({
      pastor: pastor._id,
      pastor_code: pastor.personal_code,
      attendance_date: attendanceDate,
      week_start: weekStart,
      week_end: weekEnd,
      marked_by: session.user.id,
      source: "manual",
    });
    const pastorData = pastor.toObject() as PastorWeekRecord;

    return NextResponse.json({
      success: true,
      message: `${code} marked successfully.`,
      data: {
        id: attendanceRecord._id.toString(),
        pastorId: pastor._id.toString(),
        pastorName: getPastorName(pastorData),
        pastorCode: pastor.personal_code,
        attendanceDate: toIsoDateString(attendanceDate),
        weekStart: toIsoDateString(weekStart),
        weekEnd: toIsoDateString(weekEnd),
        source: attendanceRecord.source,
      },
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error, "Failed to mark attendance."),
      },
      { status: 400 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await requireAdminSession();

    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized. Admin access required." }, { status: 403 });
    }

    await dbConnect();

    const id = request.nextUrl.searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Attendance record id is required." }, { status: 400 });
    }

    const deletedRecord = await Attendance.findByIdAndDelete(id);

    if (!deletedRecord) {
      return NextResponse.json({ success: false, error: "Attendance record not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Attendance mark removed." });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error, "Failed to remove attendance mark."),
      },
      { status: 400 },
    );
  }
}
