import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getErrorMessage } from "@/lib/error";
import { getSmsBalance } from "@/lib/mnotify";

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

export async function GET() {
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
