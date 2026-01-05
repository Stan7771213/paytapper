// lib/email.ts

import { Resend } from "resend";
import type { Client } from "@/lib/types";

type EmailSendResult =
  | { success: true; mode: "resend"; message: string; data: unknown }
  | { success: false; mode: "disabled"; message: string }
  | { success: false; mode: "resend-error"; message: string; error: unknown };

function getBaseUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_BASE_URL;
  if (explicit && explicit.trim()) return explicit.trim().replace(/\/+$/, "");

  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl && vercelUrl.trim()) {
    const v = vercelUrl.trim().replace(/\/+$/, "");
    return v.startsWith("http") ? v : `https://${v}`;
  }

  return "http://localhost:3000";
}

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key || !key.trim()) return null;
  return new Resend(key.trim());
}

function isNonEmptyString(x: unknown): x is string {
  return typeof x === "string" && x.trim().length > 0;
}

/**
 * sendClientWelcomeEmail
 *
 * Rules (architecture-first):
 * - No placeholder "success": if RESEND_API_KEY is missing, we return success:false (mode: "disabled")
 * - Caller may decide whether email is required or optional per environment
 * - No silent fallbacks
 */
export async function sendClientWelcomeEmail(params: {
  email: string;
  clientId: string;
  tipUrl: string;
  payoutMode: Client["payoutMode"];
}): Promise<EmailSendResult> {
  const { email, clientId, tipUrl, payoutMode } = params;

  const resend = getResend();
  if (!resend) {
    return {
      success: false,
      mode: "disabled",
      message: "Email sending is disabled: RESEND_API_KEY is not set.",
    };
  }

  const baseUrl = getBaseUrl();
  const dashboardUrl = `${baseUrl}/client/${encodeURIComponent(
    clientId
  )}/dashboard`;

  const subject = "Welcome to Paytapper";
  const connectLine =
    payoutMode === "direct"
      ? `<p style="margin-top: 16px;"><strong>Next step:</strong> open your dashboard and connect Stripe to start accepting payments.</p>`
      : `<p style="margin-top: 16px;">You can start sharing your tip link anytime.</p>`;

  const html = `
    <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #0f172a;">
      <h1 style="font-size: 24px; margin-bottom: 16px;">Welcome to Paytapper 👋</h1>

      <p>Your account is created.</p>

      ${connectLine}

      <p style="margin-top: 18px; margin-bottom: 6px;">Your tip link:</p>
      <p style="margin-top: 0;">
        <a href="${tipUrl}" style="color: #2563eb; text-decoration: none;">${tipUrl}</a>
      </p>

      <p style="margin-top: 14px; margin-bottom: 6px;">Your dashboard:</p>
      <p style="margin-top: 0;">
        <a href="${dashboardUrl}" style="color: #2563eb; text-decoration: none;">${dashboardUrl}</a>
      </p>

      <p style="margin-top: 20px; font-size: 12px; color: #64748b;">
        If you didn’t request this email, you can safely ignore it.
      </p>
      <p style="margin-top: 6px; font-size: 12px; color: #94a3b8;">
        — Paytapper
      </p>
    </div>
  `;

  try {
    const from = "Paytapper <no-reply@paytapper.net>";
    if (!isNonEmptyString(from)) {
      return {
        success: false,
        mode: "resend-error",
        message: "Invalid 'from' address for email.",
        error: null,
      };
    }

    const { data, error } = await resend.emails.send({
      from,
      to: email,
      subject,
      html,
    });

    if (error) {
      return {
        success: false,
        mode: "resend-error",
        message: "Failed to send email via Resend.",
        error,
      };
    }

    return {
      success: true,
      mode: "resend",
      message: "Welcome email sent via Resend.",
      data,
    };
  } catch (err: unknown) {
    return {
      success: false,
      mode: "resend-error",
      message: "Exception while sending email via Resend.",
      error: err,
    };
  }
}

/**
 * sendStripeConnectedEmail
 *
 * Triggered when derived Stripe Connect state transitions to "active".
 *
 * Rules:
 * - Idempotency is handled by caller via client.emailEvents.stripeConnectedSentAt
 * - QR is not stored; it is generated on demand via /api/qr?value=...
 * - If RESEND_API_KEY is missing: return {success:false, mode:"disabled"} (no placeholders)
 */
export async function sendStripeConnectedEmail(params: {
  email: string;
  clientId: string;
  tipUrl: string; // absolute URL
}): Promise<EmailSendResult> {
  const { email, clientId, tipUrl } = params;

  const resend = getResend();
  if (!resend) {
    return {
      success: false,
      mode: "disabled",
      message: "Email sending is disabled: RESEND_API_KEY is not set.",
    };
  }

  const baseUrl = getBaseUrl();
  const dashboardUrl = `${baseUrl}/client/${encodeURIComponent(
    clientId
  )}/dashboard`;

  const qrUrl = `${baseUrl}/api/qr?value=${encodeURIComponent(tipUrl)}`;

  const subject = "Stripe connected — your Paytapper QR is ready";
  const html = `
    <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #0f172a;">
      <h1 style="font-size: 24px; margin-bottom: 16px;">Stripe connected ✅</h1>

      <p>You can now accept payments via your Paytapper link and QR code.</p>

      <div style="margin-top: 16px; margin-bottom: 16px; padding: 16px; border: 1px solid #e2e8f0; border-radius: 12px; display: inline-block;">
        <img src="${qrUrl}" alt="Paytapper QR code" width="240" height="240" style="display:block;" />
      </div>

      <p style="margin-top: 14px; margin-bottom: 6px;">Your tip link:</p>
      <p style="margin-top: 0;">
        <a href="${tipUrl}" style="color: #2563eb; text-decoration: none;">${tipUrl}</a>
      </p>

      <p style="margin-top: 14px; margin-bottom: 6px;">Your dashboard:</p>
      <p style="margin-top: 0;">
        <a href="${dashboardUrl}" style="color: #2563eb; text-decoration: none;">${dashboardUrl}</a>
      </p>

      <p style="margin-top: 20px; font-size: 12px; color: #64748b;">
        If you didn’t request this email, you can safely ignore it.
      </p>
      <p style="margin-top: 6px; font-size: 12px; color: #94a3b8;">
        — Paytapper
      </p>
    </div>
  `;

  try {
    const from = "Paytapper <no-reply@paytapper.net>";
    if (!isNonEmptyString(from)) {
      return {
        success: false,
        mode: "resend-error",
        message: "Invalid 'from' address for email.",
        error: null,
      };
    }

    const { data, error } = await resend.emails.send({
      from,
      to: email,
      subject,
      html,
    });

    if (error) {
      return {
        success: false,
        mode: "resend-error",
        message: "Failed to send email via Resend.",
        error,
      };
    }

    return {
      success: true,
      mode: "resend",
      message: "Stripe connected email sent via Resend.",
      data,
    };
  } catch (err: unknown) {
    return {
      success: false,
      mode: "resend-error",
      message: "Exception while sending email via Resend.",
      error: err,
    };
  }
}

export async function sendPasswordResetEmail(
  email: string,
  resetUrl: string
): Promise<void> {
  console.log("[email stub] password reset", { email, resetUrl });
}

export async function sendWelcomeEmail(input: {
  email: string;
  clientId: string;
  tipUrl: string;
  dashboardUrl: string;
}): Promise<void> {
  console.log("[email stub] welcome", input);
}
