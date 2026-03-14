const MNOTIFY_QUICK_SMS_URL = "https://api.mnotify.com/api/sms/quick";
const REQUEST_TIMEOUT_MS = 10000;
const SENDER_NAME = "FL Admin";

export type SmsFailureReason = "config_missing" | "missing_number" | "invalid_number" | "request_failed";

export interface PastorCodeSmsResult {
  success: boolean;
  campaignId?: string;
  normalizedPhone?: string;
  error?: string;
  reason?: SmsFailureReason;
}

interface SendPastorCodeSmsInput {
  phoneNumber?: string;
  pastorName: string;
  code: string;
}

function buildPastorCodeMessage(pastorName: string, code: string): string {
  return `Dear ${pastorName}, your pastor code is ${code}. Use it for tithe tracking.`;
}

export function normalizeGhanaPhoneNumber(phoneNumber?: string | null): string | null {
  if (!phoneNumber) {
    return null;
  }

  const digitsOnly = phoneNumber.replace(/\D/g, "");

  if (!digitsOnly) {
    return null;
  }

  let normalized = digitsOnly;

  if (normalized.startsWith("00233")) {
    normalized = `0${normalized.slice(5)}`;
  } else if (normalized.startsWith("233")) {
    normalized = `0${normalized.slice(3)}`;
  }

  if (!/^0\d{9}$/.test(normalized)) {
    return null;
  }

  return normalized;
}

export async function sendPastorCodeSms({
  phoneNumber,
  pastorName,
  code,
}: SendPastorCodeSmsInput): Promise<PastorCodeSmsResult> {
  const apiKey = process.env.MNOTIFY_API_KEY;

  if (!apiKey) {
    return {
      success: false,
      reason: "config_missing",
      error: "MNOTIFY_API_KEY is not configured.",
    };
  }

  if (!phoneNumber?.trim()) {
    return {
      success: false,
      reason: "missing_number",
      error: "Pastor has no contact number.",
    };
  }

  const normalizedPhone = normalizeGhanaPhoneNumber(phoneNumber);

  if (!normalizedPhone) {
    return {
      success: false,
      reason: "invalid_number",
      error: `Invalid Ghana phone number format: ${phoneNumber}`,
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${MNOTIFY_QUICK_SMS_URL}?key=${encodeURIComponent(apiKey)}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        recipient: [normalizedPhone],
        sender: SENDER_NAME,
        message: buildPastorCodeMessage(pastorName, code),
        is_schedule: false,
        schedule_date: "",
      }),
      signal: controller.signal,
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      return {
        success: false,
        reason: "request_failed",
        normalizedPhone,
        error: payload?.message || `mNotify request failed with status ${response.status}`,
      };
    }

    if (payload?.status !== "success") {
      return {
        success: false,
        reason: "request_failed",
        normalizedPhone,
        error: payload?.message || "mNotify returned an unsuccessful response.",
      };
    }

    return {
      success: true,
      normalizedPhone,
      campaignId: payload?.summary?._id,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to send SMS.";

    return {
      success: false,
      reason: "request_failed",
      normalizedPhone,
      error: message,
    };
  } finally {
    clearTimeout(timeout);
  }
}

export function buildPastorDisplayName(firstName?: string, middleName?: string, lastName?: string): string {
  return [firstName, middleName, lastName].filter(Boolean).join(" ").trim() || "Pastor";
}
