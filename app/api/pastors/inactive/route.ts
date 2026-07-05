import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Pastor from "@/models/Pastor";
import { serializePastor } from "@/lib/pastor";

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const pastors = await Pastor.find({ status: "Inactive" }).lean();
    const transformedPastors = pastors.map((pastor: any) => serializePastor(pastor));
    return NextResponse.json({ success: true, data: transformedPastors });
  } catch (error: any) {
    console.error("Error fetching inactive pastors:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch inactive pastors",
      },
      { status: 500 }
    );
  }
}
