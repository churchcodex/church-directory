import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/lib/mongodb";
import Church from "@/models/Church";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const churches = await Church.find({}).lean();
    const transformedChurches = churches.map((church: any) => ({
      ...church,
      id: church._id.toString(),
    }));
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
    const session = await getServerSession(authOptions);

    // Only admins can create churches
    if (!session || (session.user as any).role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized. Admin access required to create churches.",
        },
        { status: 403 }
      );
    }

    await dbConnect();
    const body = await request.json();
    const church: any = await Church.create(body);
    const transformedChurch = {
      ...church.toObject(),
      id: church._id.toString(),
    };
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
