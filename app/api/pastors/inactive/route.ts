import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Pastor from "@/models/Pastor";

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    // Fetch only pastors with status 'Inactive'
    const pastors = await Pastor.find({ status: "Inactive" }).lean();
    const transformedPastors = pastors.map((pastor: any) => ({
      ...pastor,
      id: pastor._id.toString(),
      church: pastor.church ? pastor.church.toString() : "",
      date_of_birth: pastor.date_of_birth ? new Date(pastor.date_of_birth).toISOString().split("T")[0] : "",
      date_of_appointment: pastor.date_of_appointment
        ? new Date(pastor.date_of_appointment).toISOString().split("T")[0]
        : "",
      first_name: pastor.first_name || "",
      middle_name: pastor.middle_name || "",
      last_name: pastor.last_name || "",
    }));
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
