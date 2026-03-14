import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getErrorMessage } from "@/lib/error";
import { getSmsHistory, SmsHistoryQuery } from "@/lib/mnotify";

const ALLOWED_STATUS = new Set(["PENDING", "SENT", "DELIVERED", "FAILED"]);

function isAdmin(session: Awaited<ReturnType<typeof getServerSession>>) {
  if (!session || typeof session !== "object") {
    return false;
  }

  const user = (session as { user?: unknown }).user;

  if (!user || typeof user !== "object") {
    return false;
  }

  const role = (user as { role?: unknown }).role;

  return role === "admin";
}

function parseNumber(value: string | null, fallback: number) {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);

  return Number.isFinite(parsed) ? parsed : fallback;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!isAdmin(session)) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized. Admin access required.",
        },
        { status: 403 },
      );
    }

    const page = Math.max(1, parseNumber(request.nextUrl.searchParams.get("page"), 1));
    const limit = Math.min(100, Math.max(1, parseNumber(request.nextUrl.searchParams.get("limit"), 20)));
    const status = request.nextUrl.searchParams.get("status");
    const startDate = request.nextUrl.searchParams.get("startDate") || undefined;
    const endDate = request.nextUrl.searchParams.get("endDate") || undefined;

    if (status && !ALLOWED_STATUS.has(status)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid status filter.",
        },
        { status: 400 },
      );
    }

    const query: SmsHistoryQuery = {
      page,
      limit,
      startDate,
      endDate,
      ...(status ? { status: status as SmsHistoryQuery["status"] } : {}),
    };

    const result = await getSmsHistory(query);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Failed to fetch SMS history.",
          reason: result.reason,
        },
        { status: result.statusCode || 400 },
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error, "Failed to fetch SMS history."),
      },
      { status: 500 },
    );
  }
}
