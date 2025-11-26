import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Pastor from "@/models/Pastor";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;
    const pastor: any = await Pastor.findById(id).lean();

    if (!pastor) {
      return NextResponse.json({ success: false, error: "Pastor not found" }, { status: 404 });
    }

    const transformedPastor = {
      ...pastor,
      id: pastor._id.toString(),
      church: pastor.church.toString(),
      date_of_birth: pastor.date_of_birth ? new Date(pastor.date_of_birth).toISOString().split("T")[0] : "",
      first_name: pastor.first_name || "",
      middle_name: pastor.middle_name || "",
      last_name: pastor.last_name || "",
    };

    return NextResponse.json({ success: true, data: transformedPastor });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch pastor" }, { status: 400 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;
    const body = await request.json();
    const pastor: any = await Pastor.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    }).lean();

    if (!pastor) {
      return NextResponse.json({ success: false, error: "Pastor not found" }, { status: 404 });
    }

    const transformedPastor = {
      ...pastor,
      id: pastor._id.toString(),
      church: pastor.church.toString(),
      date_of_birth: pastor.date_of_birth ? new Date(pastor.date_of_birth).toISOString().split("T")[0] : "",
      first_name: pastor.first_name || "",
      middle_name: pastor.middle_name || "",
      last_name: pastor.last_name || "",
    };

    return NextResponse.json({ success: true, data: transformedPastor });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;
    const deletedPastor = await Pastor.findByIdAndDelete(id);

    if (!deletedPastor) {
      return NextResponse.json({ success: false, error: "Pastor not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: {} });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to delete pastor" }, { status: 400 });
  }
}
