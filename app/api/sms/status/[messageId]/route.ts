import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getErrorMessage } from "@/lib/error";
import { getSmsMessageStatus } from "@/lib/codeslaw-bms";

export async function GET(_request: Request, { params }: { params: Promise<{ messageId: string }> }) {
  try {
    const adminCheck = await requireAdmin();
    if (adminCheck instanceof NextResponse) return adminCheck;

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
