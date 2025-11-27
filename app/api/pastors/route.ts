import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Pastor from "@/models/Pastor";

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const pastors = await Pastor.find({}).lean();
    const transformedPastors = pastors.map((pastor: any) => ({
      ...pastor,
      id: pastor._id.toString(),
      church: pastor.church.toString(),
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
    console.error("Error fetching pastors:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch pastors",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();

    // Check for duplicate pastor based on first name, last name, and date of birth
    const existingPastor = await Pastor.findOne({
      first_name: body.first_name,
      last_name: body.last_name,
      ...(body.date_of_birth && { date_of_birth: new Date(body.date_of_birth) }),
    });

    if (existingPastor) {
      return NextResponse.json(
        {
          success: false,
          error: "A pastor with the same first name, last name, and date of birth already exists",
        },
        { status: 409 }
      );
    }

    const pastor: any = await Pastor.create(body);
    const transformedPastor = {
      ...pastor.toObject(),
      id: pastor._id.toString(),
      church: pastor.church?.toString() || "",
      date_of_birth: pastor.date_of_birth ? new Date(pastor.date_of_birth).toISOString().split("T")[0] : "",
      date_of_appointment: pastor.date_of_appointment
        ? new Date(pastor.date_of_appointment).toISOString().split("T")[0]
        : "",
      first_name: pastor.first_name || "",
      middle_name: pastor.middle_name || "",
      last_name: pastor.last_name || "",
    };
    return NextResponse.json({ success: true, data: transformedPastor }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating pastor:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to create pastor",
      },
      { status: 400 }
    );
  }
}
