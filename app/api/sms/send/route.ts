import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getErrorMessage } from "@/lib/error";
import { sendSms } from "@/lib/codeslaw-bms";

type SendPayload = {
  recipients?: string[];
  message?: string;
  senderId?: string;
  campaignName?: string;
  isScheduled?: boolean;
  scheduleDate?: string;
};

export async function POST(request: NextRequest) {
  try {
    const adminCheck = await requireAdmin();
    if (adminCheck instanceof NextResponse) return adminCheck;

    const body = (await request.json()) as SendPayload;

    if (!Array.isArray(body.recipients) || body.recipients.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "At least one recipient is required.",
        },
        { status: 400 },
      );
    }

    if (!body.message?.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "Message is required.",
        },
        { status: 400 },
      );
    }

    if (body.isScheduled && !body.scheduleDate) {
      return NextResponse.json(
        {
          success: false,
          error: "scheduleDate is required when isScheduled is true.",
        },
        { status: 400 },
      );
    }

    const result = await sendSms({
      recipients: body.recipients,
      message: body.message,
      senderId: body.senderId,
      campaignName: body.campaignName,
      isScheduled: body.isScheduled,
      scheduleDate: body.scheduleDate,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Failed to send SMS.",
          reason: result.reason,
        },
        { status: result.statusCode || 400 },
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        messageId: result.messageId,
        recipientsSent: result.recipientsSent,
        invalidRecipients: result.invalidRecipients,
        creditsUsed: result.creditsUsed,
        remainingCredits: result.remainingCredits,
      },
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error, "Failed to send SMS."),
      },
      { status: 500 },
    );
  }
}
