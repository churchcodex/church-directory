import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/lib/mongodb";
import { authOptions } from "@/lib/auth";
import { generateUniquePastorCode } from "@/lib/pastor-code";
import Pastor from "@/models/Pastor";
import { buildPastorDisplayName, sendPastorCodeSms } from "@/lib/mnotify";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized. Admin access required to run migrations.",
        },
        { status: 403 },
      );
    }

    await dbConnect();

    const pastorsWithoutCodes = await Pastor.find({
      $or: [
        { personal_code: { $exists: false } },
        { personal_code: null },
        { personal_code: "" },
        { personal_code: { $not: /^G-\d{4}$/ } },
      ],
    });

    let updatedCount = 0;
    const sms = {
      attempted: 0,
      sent: 0,
      failed: 0,
      errors: [] as Array<{
        pastorId: string;
        pastorName: string;
        phoneNumber?: string;
        reason?: string;
        error: string;
      }>,
    };

    for (const pastor of pastorsWithoutCodes) {
      const code = await generateUniquePastorCode();
      // Use the raw collection driver to bypass Mongoose's immutable field guard,
      // which silently strips $set operations on immutable paths in updateOne().
      await Pastor.collection.updateOne({ _id: pastor._id }, { $set: { personal_code: code } });
      updatedCount += 1;

      sms.attempted += 1;

      const pastorName = buildPastorDisplayName(pastor.first_name, pastor.middle_name, pastor.last_name);
      const smsResult = await sendPastorCodeSms({
        phoneNumber: pastor.contact_number,
        pastorName,
        code,
      });

      if (smsResult.success) {
        sms.sent += 1;
      } else {
        sms.failed += 1;
        sms.errors.push({
          pastorId: String(pastor._id),
          pastorName,
          phoneNumber: pastor.contact_number,
          reason: smsResult.reason,
          error: smsResult.error || "Failed to send pastor code SMS.",
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Migration completed. Standardized ${updatedCount} pastors.`,
      data: { updatedCount, sms },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 400 },
    );
  }
}
