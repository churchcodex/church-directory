import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/lib/mongodb";
import { authOptions } from "@/lib/auth";
import { generateUniquePastorCode } from "@/lib/pastor-code";
import Pastor from "@/models/Pastor";

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
      $or: [{ personal_code: { $exists: false } }, { personal_code: null }, { personal_code: "" }],
    });

    let updatedCount = 0;

    for (const pastor of pastorsWithoutCodes) {
      const code = await generateUniquePastorCode();
      // Use the raw collection driver to bypass Mongoose's immutable field guard,
      // which silently strips $set operations on immutable paths in updateOne().
      await Pastor.collection.updateOne({ _id: pastor._id }, { $set: { personal_code: code } });
      updatedCount += 1;
    }

    return NextResponse.json({
      success: true,
      message: `Migration completed. Backfilled ${updatedCount} pastors.`,
      data: { updatedCount },
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
