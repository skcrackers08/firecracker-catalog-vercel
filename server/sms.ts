import { storage } from "./storage";

export type SmsResult = { success: boolean; provider: string; error?: string; raw?: any };

async function sendViaStartMessaging(phone: string, otp: string): Promise<SmsResult> {
  const apiKey = await storage.getSetting("startmessaging-api-key");
  if (!apiKey) return { success: false, provider: "startmessaging", error: "API key not configured" };
  const endpoint = (await storage.getSetting("startmessaging-endpoint")) || "https://api.startmessaging.com/otp/send";

  // Normalise phone to E.164 (default India +91 if 10-digit)
  const cleaned = phone.replace(/\D/g, "");
  const phoneNumber = cleaned.length === 10 ? `+91${cleaned}` : cleaned.startsWith("+") ? cleaned : `+${cleaned}`;

  try {
    const body = { phoneNumber, variables: { otp } };
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify(body),
    });
    const text = await res.text();
    let data: any = text;
    try { data = JSON.parse(text); } catch {}
    if (res.ok && data?.success !== false) {
      return { success: true, provider: "startmessaging", raw: data };
    }
    const errMsg = data?.error?.message || data?.message || (Array.isArray(data?.error?.details) ? data.error.details.map((d: any) => d.message).join("; ") : null) || `HTTP ${res.status}`;
    return { success: false, provider: "startmessaging", error: errMsg, raw: data };
  } catch (err: any) {
    return { success: false, provider: "startmessaging", error: err?.message ?? "Request failed" };
  }
}

async function sendViaFast2Sms(phone: string, otp: string): Promise<SmsResult> {
  const apiKey = (await storage.getSetting("fast2sms-api-key")) || process.env.FAST2SMS_API_KEY;
  if (!apiKey) return { success: false, provider: "fast2sms", error: "API key not configured" };
  try {
    const url = new URL("https://www.fast2sms.com/dev/bulkV2");
    url.searchParams.set("authorization", apiKey);
    url.searchParams.set("variables_values", otp);
    url.searchParams.set("route", "otp");
    url.searchParams.set("numbers", phone);
    const res = await fetch(url.toString());
    const data = await res.json() as { return?: boolean; message?: string[] };
    if (data.return === true) return { success: true, provider: "fast2sms", raw: data };
    return { success: false, provider: "fast2sms", error: Array.isArray(data.message) ? data.message.join(", ") : "Failed", raw: data };
  } catch (err: any) {
    return { success: false, provider: "fast2sms", error: err?.message ?? "Request failed" };
  }
}

export async function sendOtpSms(phone: string, otp: string): Promise<SmsResult> {
  const provider = (await storage.getSetting("sms-provider")) || "fast2sms";
  if (provider === "startmessaging") return sendViaStartMessaging(phone, otp);
  return sendViaFast2Sms(phone, otp);
}
