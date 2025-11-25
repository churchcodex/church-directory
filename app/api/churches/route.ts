import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Church from "@/models/Church";

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const churches = await Church.find({});
    return NextResponse.json({ success: true, data: churches });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch churches" }, { status: 400 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();
    const church = await Church.create(body);
    return NextResponse.json({ success: true, data: church }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
