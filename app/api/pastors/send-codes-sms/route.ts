import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getErrorMessage } from "@/lib/error";
import Pastor from "@/models/Pastor";
import { sendPastorCodeSms, buildPastorDisplayName } from "@/lib/codeslaw-bms";
import dbConnect from "@/lib/mongodb";

type SendCodesPayload = {
  pastorIds?: string[] | null;
};

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

export async function POST(request: NextRequest) {
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

    await dbConnect();

    const body = (await request.json()) as SendCodesPayload;
    const pastorIds = body.pastorIds;

    // Build query filter
    let query: any = {
      personal_code: { $exists: true, $ne: "" },
    };

    if (Array.isArray(pastorIds) && pastorIds.length > 0) {
      query._id = { $in: pastorIds };
    }

    // Fetch pastors with codes
    const pastors = await Pastor.find(query).select("_id first_name last_name personal_code contact_number").lean();

    if (!pastors || pastors.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "No pastors found with codes to send SMS to.",
        },
        { status: 400 },
      );
    }

    // Send SMS to each pastor
    const results = {
      sent: 0,
      failed: 0,
      attempted: 0,
      failedPastors: [] as Array<{ name: string; reason: string }>,
    };

    for (const pastor of pastors) {
      results.attempted++;

      const pastorName = buildPastorDisplayName(pastor.first_name, "", pastor.last_name);
      const result = await sendPastorCodeSms({
        phoneNumber: pastor.contact_number,
        pastorName,
        code: pastor.personal_code,
      });

      if (result.success) {
        results.sent++;
      } else {
        results.failed++;
        results.failedPastors.push({
          name: pastorName,
          reason: result.error || "Unknown error",
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        summary: results,
      },
    });
  } catch (error: unknown) {
    console.error("Failed to send pastor codes SMS:", error);
    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error, "Failed to send pastor codes via SMS."),
      },
      { status: 500 },
    );
  }
}
