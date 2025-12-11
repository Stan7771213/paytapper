// lib/email.ts

import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY || "";
const baseUrl =
  process.env.NEXT_PUBLIC_BASE_URL || "https://www.paytapper.net";

let resend: Resend | null = null;

if (resendApiKey) {
  resend = new Resend(resendApiKey);
  console.log("🟩 Resend initialized: RESEND_API_KEY is set.");
} else {
  console.log(
    "🟨 Resend NOT initialized: RESEND_API_KEY is missing. Email sending will work in placeholder mode."
  );
}

/**
 * sendClientWelcomeEmail
 *
 * Dual-mode behavior:
 * 1) If RESEND_API_KEY is NOT set:
 *    - works as a safe placeholder
 *    - logs all parameters
 *    - returns success: true (so that caller knows it executed)
 *
 * 2) If RESEND_API_KEY IS set:
 *    - uses Resend to send a real onboarding email
 *    - still logs the basic info
 */

export async function sendClientWelcomeEmail(params: {
  email: string;
  tipUrl: string;
  clientId: string;
}) {
  const { email, tipUrl, clientId } = params;

  // Always log what we are trying to send
  console.log("🟦 sendClientWelcomeEmail called with:");
  console.log("Email:", email);
  console.log("Tip URL:", tipUrl);
  console.log("Client ID:", clientId);

  // If Resend is not configured, work in placeholder mode
  if (!resend) {
    console.log(
      "🟨 sendClientWelcomeEmail: RESEND_API_KEY is not set. Placeholder mode only, no email was sent."
    );

    return {
      success: true,
      mode: "placeholder",
      message:
        "Resend API key is not configured. Email was NOT sent, placeholder executed.",
    };
  }

  // When RESEND_API_KEY is present, try to send a real email via Resend
  try {
    const dashboardUrl = `${baseUrl}/dashboard?clientId=${encodeURIComponent(
      clientId
    )}`;

    const subject = "Your Paytapper tip link is ready";
    const html = `
      <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #0f172a;">
        <h1 style="font-size: 24px; margin-bottom: 16px;">Welcome to Paytapper 👋</h1>
        <p>Thanks for setting up your Paytapper link.</p>
        <p>Your personal tip page is here:</p>
        <p>
          <a href="${tipUrl}" style="color: #2563eb; text-decoration: none;">
            ${tipUrl}
          </a>
        </p>
        <p>You can also open your dashboard here:</p>
        <p>
          <a href="${dashboardUrl}" style="color: #2563eb; text-decoration: none;">
            ${dashboardUrl}
          </a>
        </p>
        <p style="margin-top: 16px; font-size: 14px; color: #6b7280;">
          Tip: if this email landed in your spam or promotions folder, please mark it as “Not spam”.
          This helps future Paytapper emails arrive in your main inbox.
        </p>
        <p style="margin-top: 24px; font-size: 14px; color: #6b7280;">
          If you didn’t request this email, you can safely ignore it.
        </p>
        <p style="margin-top: 8px; font-size: 12px; color: #9ca3af;">
          — Paytapper
        </p>
      </div>
    `;

    // Now we send from your verified domain
    const { data, error } = await resend.emails.send({
      from: "Paytapper <no-reply@paytapper.net>",
      to: email,
      subject,
      html,
    });

    if (error) {
      console.error("🔴 Resend email sending error:", error);
      return {
        success: false,
        mode: "resend",
        message: "Failed to send email via Resend.",
        error,
      };
    }

    console.log("🟩 Resend email sent successfully:", data);

    return {
      success: true,
      mode: "resend",
      message: "Welcome email sent via Resend.",
      data,
    };
  } catch (err) {
    console.error("🔴 Exception while sending email via Resend:", err);
    return {
      success: false,
      mode: "resend-exception",
      message: "Exception while sending email via Resend.",
      error: err,
    };
  }
}

