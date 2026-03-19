import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getErrorMessage } from "@/lib/error";
import { getSmsMessageStatus } from "@/lib/codeslaw-bms";

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

export async function GET(_request: Request, { params }: { params: Promise<{ messageId: string }> }) {
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

    const { messageId } = await params;

    if (!messageId) {
      return NextResponse.json(
        {
          success: false,
          error: "messageId is required.",
        },
        { status: 400 },
      );
    }

    const result = await getSmsMessageStatus(messageId);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Failed to fetch SMS status.",
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
        error: getErrorMessage(error, "Failed to fetch SMS status."),
      },
      { status: 500 },
    );
  }
}
