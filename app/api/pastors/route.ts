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
      date_of_birth: pastor.date_of_birth ? new Date(pastor.date_of_birth).toISOString().split("T")[0] : "",
    }));
    return NextResponse.json({ success: true, data: transformedPastors });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch pastors" }, { status: 400 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();
    const pastor: any = await Pastor.create(body);
    const transformedPastor = {
      ...pastor.toObject(),
      id: pastor._id.toString(),
      date_of_birth: pastor.date_of_birth ? new Date(pastor.date_of_birth).toISOString().split("T")[0] : "",
    };
    return NextResponse.json({ success: true, data: transformedPastor }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
