import { Resend } from "resend";
import type { TourBooking } from "@/lib/types";

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

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || !value.trim()) {
    throw new Error("Missing required environment variable: " + name);
  }
  return value.trim();
}

function isNonEmptyString(x: unknown): x is string {
  return typeof x === "string" && x.trim().length > 0;
}

function formatPrice(amountCents: number): string {
  return `€${(amountCents / 100).toFixed(2)}`;
}

function buildBookingHtml(booking: TourBooking): string {
  const baseUrl = getBaseUrl();
  const successUrl = `${baseUrl}/tours/success`;

  return `
    <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #0f172a;">
      <h1 style="font-size: 24px; margin-bottom: 16px;">Tour booking confirmation</h1>

      <p>Your booking has been confirmed and payment has been received.</p>

      <div style="margin-top: 16px; padding: 16px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <p style="margin: 0 0 8px;"><strong>Tour:</strong> ${booking.productTitle}</p>
        <p style="margin: 0 0 8px;"><strong>Date:</strong> ${booking.date}</p>
        <p style="margin: 0 0 8px;"><strong>Time:</strong> ${booking.time}</p>
        <p style="margin: 0 0 8px;"><strong>Adults:</strong> ${booking.adults}</p>
        <p style="margin: 0 0 8px;"><strong>Children under 12:</strong> ${booking.children}</p>
        <p style="margin: 0 0 8px;"><strong>Free children covered by adults:</strong> ${booking.freeChildren}</p>
        <p style="margin: 0 0 8px;"><strong>Extra paid children:</strong> ${booking.extraPaidChildren}</p>
        <p style="margin: 0 0 8px;"><strong>Total participants:</strong> ${booking.totalGuests}</p>
        <p style="margin: 0 0 8px;"><strong>Payable guests:</strong> ${booking.payableGuests}</p>
        <p style="margin: 0;"><strong>Total paid:</strong> ${formatPrice(booking.amountCents)}</p>
      </div>

      <div style="margin-top: 16px; padding: 16px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <p style="margin: 0 0 8px;"><strong>Customer name:</strong> ${booking.customer.name}</p>
        <p style="margin: 0 0 8px;"><strong>Email:</strong> ${booking.customer.email}</p>
        <p style="margin: 0;"><strong>Phone / WhatsApp:</strong> ${booking.customer.phone}</p>
      </div>

      <div style="margin-top: 16px; padding: 16px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <p style="margin: 0 0 8px;"><strong>Meeting point:</strong></p>
        <p style="margin: 0;">
          At 10 am, 1 pm and 3:30 pm the tour starts from the Town Hall building.
          The guide will be waiting for you under the clock with a bright sign with the 120 degrees logo
          in the Town Hall arcade on Town Hall Square.
        </p>
      </div>

      <p style="margin-top: 18px;">
        Confirmation page:
        <a href="${successUrl}" style="color: #2563eb; text-decoration: none;">${successUrl}</a>
      </p>

      <p style="margin-top: 18px; color: #991b1b;">
        Tickets are non-refundable and non-exchangeable after purchase.
      </p>

      <p style="margin-top: 20px; font-size: 12px; color: #64748b;">
        Stripe payment intent: ${booking.stripe.paymentIntentId}
      </p>
    </div>
  `;
}

export async function sendTourBookingEmails(
  booking: TourBooking
): Promise<EmailSendResult> {
  const resend = getResend();
  if (!resend) {
    return {
      success: false,
      mode: "disabled",
      message: "Email sending is disabled: RESEND_API_KEY is not set.",
    };
  }

  const internalEmail = requireEnv("TOURS_INTERNAL_NOTIFICATION_EMAIL");
  const operatorEmail = requireEnv("TOURS_OPERATOR_NOTIFICATION_EMAIL");

  const recipients = [booking.customer.email, internalEmail, operatorEmail];
  const subject = `Tour booking confirmed — ${booking.productTitle} — ${booking.date} ${booking.time}`;
  const html = buildBookingHtml(booking);

  try {
    const from = "Paytapper Tours <no-reply@paytapper.net>";
    if (!isNonEmptyString(from)) {
      return {
        success: false,
        mode: "resend-error",
        message: "Invalid 'from' address for tours email.",
        error: null,
      };
    }

    const { data, error } = await resend.emails.send({
      from,
      to: recipients,
      subject,
      html,
    });

    if (error) {
      return {
        success: false,
        mode: "resend-error",
        message: "Failed to send tour booking emails via Resend.",
        error,
      };
    }

    return {
      success: true,
      mode: "resend",
      message: "Tour booking emails sent via Resend.",
      data,
    };
  } catch (err: unknown) {
    return {
      success: false,
      mode: "resend-error",
      message: "Exception while sending tour booking emails via Resend.",
      error: err,
    };
  }
}
