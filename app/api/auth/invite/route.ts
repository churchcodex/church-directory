import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import crypto from "crypto";
import dbConnect from "@/lib/mongodb";
import InviteToken from "@/models/InviteToken";
import { authOptions } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 403 });
    }

    const { expiresInDays = 7 } = await request.json();

    await dbConnect();

    // Generate unique token
    const token = crypto.randomBytes(32).toString("hex");

    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    // Create invite token
    const inviteToken = await InviteToken.create({
      token,
      createdBy: (session.user as any).id,
      expiresAt,
    });

    // Generate signup URL
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const signupUrl = `${baseUrl}/signup?token=${token}`;

    return NextResponse.json(
      {
        message: "Invite token generated successfully",
        token: inviteToken.token,
        signupUrl,
        expiresAt: inviteToken.expiresAt,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Generate invite error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate invite token" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 403 });
    }

    await dbConnect();

    const tokens = await InviteToken.find()
      .populate("createdBy", "email")
      .populate("usedBy", "email")
      .sort({ createdAt: -1 });

    return NextResponse.json({ tokens }, { status: 200 });
  } catch (error: any) {
    console.error("Get invites error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch invite tokens" }, { status: 500 });
  }
}
