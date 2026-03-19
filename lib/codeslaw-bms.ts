const BMS_BASE_URL = process.env.BMS_BASE_URL || "https://bms.codeslaw.dev/api/v1";
const REQUEST_TIMEOUT_MS = 10000;
const DEFAULT_SENDER_ID = process.env.BMS_DEFAULT_SENDER_ID || "FL Admin";

export type SmsFailureReason =
  | "config_missing"
  | "missing_number"
  | "invalid_number"
  | "unauthorized"
  | "forbidden"
  | "insufficient_credits"
  | "rate_limited"
  | "request_failed";

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

interface SendSmsInput {
  recipients: string[];
  message: string;
  senderId?: string;
  campaignName?: string;
  isScheduled?: boolean;
  scheduleDate?: string;
}

export interface SendSmsResult {
  success: boolean;
  messageId?: string;
  recipientsSent?: number;
  invalidRecipients?: string[];
  creditsUsed?: number;
  remainingCredits?: number;
  error?: string;
  reason?: SmsFailureReason;
  statusCode?: number;
}

export interface SmsBalanceResult {
  success: boolean;
  balance?: number;
  currency?: string;
  accountName?: string;
  accountPhone?: string;
  error?: string;
  reason?: SmsFailureReason;
  statusCode?: number;
}

export interface SmsHistoryQuery {
  page?: number;
  limit?: number;
  status?: "PENDING" | "SENT" | "DELIVERED" | "FAILED";
  startDate?: string;
  endDate?: string;
}

export interface SmsHistoryResult {
  success: boolean;
  data?: unknown;
  error?: string;
  reason?: SmsFailureReason;
  statusCode?: number;
}

export interface SmsMessageStatusResult {
  success: boolean;
  data?: unknown;
  error?: string;
  reason?: SmsFailureReason;
  statusCode?: number;
}

function buildPastorCodeMessage(pastorName: string, code: string): string {
  return `Dear ${pastorName}, your pastor code is ${code}. Use it for tithe tracking.`;
}

function getBmsApiKey() {
  return process.env.BMS_API_KEY || process.env.MNOTIFY_API_KEY;
}

function mapStatusToReason(statusCode?: number): SmsFailureReason {
  if (statusCode === 401) {
    return "unauthorized";
  }

  if (statusCode === 403) {
    return "forbidden";
  }

  if (statusCode === 402) {
    return "insufficient_credits";
  }

  if (statusCode === 429) {
    return "rate_limited";
  }

  return "request_failed";
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

async function bmsRequest(path: string, init?: RequestInit) {
  const apiKey = getBmsApiKey();

  if (!apiKey) {
    return {
      ok: false,
      status: 500,
      payload: null,
      error: "BMS_API_KEY is not configured.",
      reason: "config_missing" as SmsFailureReason,
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${BMS_BASE_URL}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        ...(init?.headers || {}),
      },
      signal: controller.signal,
    });

    const payload = await response.json().catch(() => null);

    return {
      ok: response.ok,
      status: response.status,
      payload,
      reason: response.ok ? undefined : mapStatusToReason(response.status),
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to perform SMS request.";

    return {
      ok: false,
      status: 500,
      payload: null,
      error: message,
      reason: "request_failed" as SmsFailureReason,
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function sendSms(input: SendSmsInput): Promise<SendSmsResult> {
  if (!Array.isArray(input.recipients) || input.recipients.length === 0) {
    return {
      success: false,
      error: "At least one recipient is required.",
      reason: "missing_number",
      statusCode: 400,
    };
  }

  const normalizedRecipients = input.recipients
    .map((recipient) => normalizeGhanaPhoneNumber(recipient))
    .filter((recipient): recipient is string => Boolean(recipient));

  if (normalizedRecipients.length === 0) {
    return {
      success: false,
      error: "No valid Ghana phone numbers were provided.",
      reason: "invalid_number",
      statusCode: 400,
    };
  }

  const response = await bmsRequest("/sms/send", {
    method: "POST",
    body: JSON.stringify({
      recipients: normalizedRecipients,
      message: input.message,
      senderId: input.senderId || DEFAULT_SENDER_ID,
      campaignName: input.campaignName,
      isScheduled: input.isScheduled,
      scheduleDate: input.scheduleDate,
    }),
  });

  if (!response.ok) {
    return {
      success: false,
      reason: response.reason,
      statusCode: response.status,
      error: response.error || response.payload?.error || `SMS request failed with status ${response.status}`,
    };
  }

  if (!response.payload?.success) {
    return {
      success: false,
      reason: mapStatusToReason(response.status),
      statusCode: response.status,
      error: response.payload?.error || "SMS provider returned an unsuccessful response.",
    };
  }

  return {
    success: true,
    messageId: response.payload?.data?.messageId,
    recipientsSent: response.payload?.data?.recipientsSent,
    invalidRecipients: response.payload?.data?.invalidRecipients || [],
    creditsUsed: response.payload?.data?.creditsUsed,
    remainingCredits: response.payload?.data?.remainingCredits,
  };
}

export async function getSmsBalance(): Promise<SmsBalanceResult> {
  const response = await bmsRequest("/balance", {
    method: "GET",
  });

  if (!response.ok) {
    return {
      success: false,
      reason: response.reason,
      statusCode: response.status,
      error: response.error || response.payload?.error || `Balance request failed with status ${response.status}`,
    };
  }

  if (!response.payload?.success) {
    return {
      success: false,
      reason: mapStatusToReason(response.status),
      statusCode: response.status,
      error: response.payload?.error || "SMS provider returned an unsuccessful response.",
    };
  }

  return {
    success: true,
    balance: response.payload?.data?.balance,
    currency: response.payload?.data?.currency,
    accountName: response.payload?.data?.accountName,
    accountPhone: response.payload?.data?.accountPhone,
  };
}

export async function getSmsHistory(query: SmsHistoryQuery = {}): Promise<SmsHistoryResult> {
  const searchParams = new URLSearchParams();

  if (query.page !== undefined) {
    searchParams.set("page", String(query.page));
  }

  if (query.limit !== undefined) {
    searchParams.set("limit", String(query.limit));
  }

  if (query.status) {
    searchParams.set("status", query.status);
  }

  if (query.startDate) {
    searchParams.set("startDate", query.startDate);
  }

  if (query.endDate) {
    searchParams.set("endDate", query.endDate);
  }

  const suffix = searchParams.toString();
  const response = await bmsRequest(`/sms${suffix ? `?${suffix}` : ""}`, {
    method: "GET",
  });

  if (!response.ok) {
    return {
      success: false,
      reason: response.reason,
      statusCode: response.status,
      error: response.error || response.payload?.error || `SMS history request failed with status ${response.status}`,
    };
  }

  return {
    success: Boolean(response.payload?.success),
    data: response.payload?.data,
    error: response.payload?.error,
  };
}

export async function getSmsMessageStatus(messageId: string): Promise<SmsMessageStatusResult> {
  const response = await bmsRequest(`/sms/status/${encodeURIComponent(messageId)}`, {
    method: "GET",
  });

  if (!response.ok) {
    return {
      success: false,
      reason: response.reason,
      statusCode: response.status,
      error: response.error || response.payload?.error || `SMS status request failed with status ${response.status}`,
    };
  }

  return {
    success: Boolean(response.payload?.success),
    data: response.payload?.data,
    error: response.payload?.error,
  };
}

export async function sendPastorCodeSms({
  phoneNumber,
  pastorName,
  code,
}: SendPastorCodeSmsInput): Promise<PastorCodeSmsResult> {
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

  const result = await sendSms({
    recipients: [normalizedPhone],
    message: buildPastorCodeMessage(pastorName, code),
    senderId: DEFAULT_SENDER_ID,
    campaignName: "Pastor Code Assignment",
  });

  if (!result.success) {
    return {
      success: false,
      normalizedPhone,
      reason: result.reason,
      error: result.error,
    };
  }

  return {
    success: true,
    normalizedPhone,
    campaignId: result.messageId,
  };
}

export function buildPastorDisplayName(firstName?: string, middleName?: string, lastName?: string): string {
  return [firstName, middleName, lastName].filter(Boolean).join(" ").trim() || "Pastor";
}
