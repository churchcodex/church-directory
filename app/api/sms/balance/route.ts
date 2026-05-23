import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getErrorMessage } from "@/lib/error";
import { getSmsBalance } from "@/lib/codeslaw-bms";

export async function GET() {
  try {
    const adminCheck = await requireAdmin();
    if (adminCheck instanceof NextResponse) return adminCheck;

    const result = await getSmsBalance();

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Failed to fetch SMS balance.",
          reason: result.reason,
        },
        { status: result.statusCode || 400 },
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        balance: result.balance,
        currency: result.currency,
        accountName: result.accountName,
        accountPhone: result.accountPhone,
      },
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error, "Failed to fetch SMS balance."),
      },
      { status: 500 },
    );
  }
}
