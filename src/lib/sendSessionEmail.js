/**
 * Send therapist notification email: prefers Resend (free tier API) if RESEND_API_KEY is set,
 * otherwise nodemailer SMTP.
 */

import nodemailer from "nodemailer";

const RESEND_API = "https://api.resend.com/emails";

function getSmtpTransporter() {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;
  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

/**
 * Resend free tier: https://resend.com — create API key, add & verify your domain for production sends.
 */
export async function sendTherapistSessionEmail({
  toEmail,
  therapistName,
  patientName,
  mode,
  completedAt,
  conversation,
  oneLineSummary,
  exchangeCount,
  buildTxtBody,
  attachFilename,
}) {
  const patientLabel = String(patientName || "Patient").trim() || "Patient";
  const subject = `Voice therapy session completed — ${patientLabel}`;

  const text = [
    `Hi ${therapistName || "there"},`,
    "",
    `Your patient ${patientLabel} just finished a voice session with Nora (AI assistant).`,
    "",
    oneLineSummary ? `Quick note: ${oneLineSummary}` : `The session had ${exchangeCount} message exchanges.`,
    "",
    "A detailed summary and full transcript are attached as a .txt file.",
    "",
    "— Greater Change Health (voice assistant)",
  ].join("\n");

  const txtBody = await buildTxtBody();
  const resendKey = process.env.RESEND_API_KEY?.trim();

  if (resendKey) {
    const from =
      process.env.MAIL_FROM?.trim() ||
      process.env.RESEND_FROM?.trim() ||
      "onboarding@resend.dev";

    const attachmentB64 = Buffer.from(txtBody, "utf8").toString("base64");

    const res = await fetch(RESEND_API, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [toEmail],
        subject,
        text,
        attachments: [
          {
            filename: attachFilename,
            content: attachmentB64,
          },
        ],
      }),
    });

    const errText = await res.text();
    if (!res.ok) {
      console.error("Resend API error:", res.status, errText);
      throw new Error(`Resend failed: ${res.status}`);
    }
    return;
  }

  const transporter = getSmtpTransporter();
  if (!transporter) {
    console.warn(
      "No email configured: set RESEND_API_KEY (see .env.example) or SMTP_HOST, SMTP_USER, SMTP_PASS."
    );
    return;
  }

  const from = process.env.MAIL_FROM || process.env.SMTP_USER || "voice-therapy@greaterchangehealth.com";

  await transporter.sendMail({
    from,
    to: toEmail,
    subject,
    text,
    attachments: [
      {
        filename: attachFilename,
        content: txtBody,
        contentType: "text/plain; charset=utf-8",
      },
    ],
  });
}
