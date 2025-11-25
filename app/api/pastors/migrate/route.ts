import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Pastor from "@/models/Pastor";

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    // Remove the 'age' field from all documents
    const result = await Pastor.updateMany({ age: { $exists: true } }, { $unset: { age: "" } });

    return NextResponse.json({
      success: true,
      message: `Migration completed. Updated ${result.modifiedCount} documents.`,
      data: result,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 400 }
    );
  }
}
