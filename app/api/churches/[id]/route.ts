import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/lib/mongodb";
import Church from "@/models/Church";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;
    const church: any = await Church.findById(id).lean();

    if (!church) {
      return NextResponse.json({ success: false, error: "Church not found" }, { status: 404 });
    }

    const transformedChurch = {
      ...church,
      id: church._id.toString(),
    };

    return NextResponse.json({ success: true, data: transformedChurch });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch church" }, { status: 400 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    // Only admins can update churches
    if (!session || (session.user as any).role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized. Admin access required to update churches.",
        },
        { status: 403 }
      );
    }

    await dbConnect();
    const { id } = await params;
    const body = await request.json();
    const church: any = await Church.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    }).lean();

    if (!church) {
      return NextResponse.json({ success: false, error: "Church not found" }, { status: 404 });
    }

    const transformedChurch = {
      ...church,
      id: church._id.toString(),
    };

    return NextResponse.json({ success: true, data: transformedChurch });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    // Only admins can delete churches
    if (!session || (session.user as any).role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized. Admin access required to delete churches.",
        },
        { status: 403 }
      );
    }

    await dbConnect();
    const { id } = await params;
    const deletedChurch = await Church.findByIdAndDelete(id);

    if (!deletedChurch) {
      return NextResponse.json({ success: false, error: "Church not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: {} });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to delete church" }, { status: 400 });
  }
}
