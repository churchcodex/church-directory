import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Church from "@/models/Church";
import { requireAdmin } from "@/lib/auth";
import { serializeChurch } from "@/lib/church";

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const churches = await Church.find({}).lean();
    const transformedChurches = churches.map((church: any) => serializeChurch(church));
    return NextResponse.json({ success: true, data: transformedChurches });
  } catch (error: any) {
    console.error("Error fetching churches:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch churches",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminCheck = await requireAdmin();
    if (adminCheck instanceof NextResponse) return adminCheck;

    await dbConnect();
    const body = await request.json();
    const church: any = await Church.create(body);
    const transformedChurch = serializeChurch(church.toObject());
    return NextResponse.json({ success: true, data: transformedChurch }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating church:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to create church",
      },
      { status: 400 }
    );
  }
}
