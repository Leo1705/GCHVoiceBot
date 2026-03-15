/**
 * POST /api/session/complete
 * Body: { patientName, patientEmail, mode?, summary?, conversation?[] }
 * Looks up therapist from assignments by patientEmail. Saves session and emails therapist if found.
 */

import { addSession } from "@/lib/sessionStore";
import { getTherapistForPatient } from "@/lib/assignmentsStore";
import nodemailer from "nodemailer";

function getTransporter() {
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

async function sendTherapistEmail(toEmail, therapistName, summary, exchangeCount) {
  const transporter = getTransporter();
  if (!transporter) {
    console.warn("SMTP not configured (SMTP_HOST, SMTP_USER, SMTP_PASS). Session saved but no email sent.");
    return;
  }
  const from = process.env.MAIL_FROM || process.env.SMTP_USER || "voice-therapy@greaterchangehealth.com";
  const subject = "Voice therapy session completed – you were listed as responsible therapist";
  const text = [
    `Hi ${therapistName || "there"},`,
    "",
    "A voice therapy session was just completed and you were listed as the responsible therapist for this patient.",
    "",
    summary ? `Summary: ${summary}` : `The session had ${exchangeCount} message exchanges.`,
    "",
    "— Greater Change Therapy (voice assistant)",
  ].join("\n");

  try {
    await transporter.sendMail({
      from,
      to: toEmail,
      subject,
      text,
    });
  } catch (err) {
    console.error("Failed to send therapist email:", err?.message || err);
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      patientName = "",
      patientEmail = "",
      mode = "calm_support",
      summary = "",
      conversation = [],
    } = body;

    const therapist = getTherapistForPatient(patientEmail);
    const therapistName = therapist?.therapistName ?? "";
    const therapistEmail = therapist?.therapistEmail ?? "";

    const completedAt = new Date().toISOString();
    const record = addSession({
      patientName: String(patientName).trim(),
      patientEmail: String(patientEmail).trim(),
      therapistName,
      therapistEmail,
      mode,
      summary: String(summary).trim(),
      conversation: Array.isArray(conversation) ? conversation : [],
      completedAt,
    });

    const exchangeCount = (record.conversation || []).length;
    const summaryForEmail = summary || `Session completed with ${exchangeCount} exchanges.`;

    if (record.therapistEmail) {
      await sendTherapistEmail(
        record.therapistEmail,
        record.therapistName,
        summaryForEmail,
        exchangeCount
      );
    }

    return Response.json({ ok: true, id: record.id });
  } catch (err) {
    console.error("POST /api/session/complete error:", err);
    return Response.json(
      { error: "Failed to save session or send email" },
      { status: 500 }
    );
  }
}
