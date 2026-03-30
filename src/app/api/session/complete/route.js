/**
 * POST /api/session/complete
 * Body: { patientName, patientEmail, mode?, summary?, conversation?[] }
 * Looks up therapist from assignments by patientEmail. Saves session and emails therapist if found.
 * Email: set RESEND_API_KEY (free tier at resend.com) or classic SMTP — see .env.example
 */

import { addSession } from "@/lib/sessionStore";
import { getTherapistForPatient } from "@/lib/assignmentsStore";
import { buildTherapistSessionTxt, sessionAttachmentFilename } from "@/lib/sessionSummaryExport";
import { sendTherapistSessionEmail } from "@/lib/sendSessionEmail";

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      patientName = "",
      patientEmail = "",
      mode = "calm_support",
      summary = "",
      conversation = [],
      therapistName: therapistNameBody = "",
      therapistEmail: therapistEmailBody = "",
    } = body;

    const fromSelection =
      String(therapistNameBody || "").trim() && String(therapistEmailBody || "").trim()
        ? {
            therapistName: String(therapistNameBody).trim(),
            therapistEmail: String(therapistEmailBody).trim(),
          }
        : null;
    const therapist = fromSelection || getTherapistForPatient(patientEmail);
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
    const oneLineSummary = summary || `Session completed with ${exchangeCount} exchanges.`;

    if (record.therapistEmail) {
      const attachName = sessionAttachmentFilename(record.patientName, completedAt);
      try {
        await sendTherapistSessionEmail({
          toEmail: record.therapistEmail,
          therapistName: record.therapistName,
          patientName: record.patientName,
          mode: record.mode,
          completedAt,
          conversation: record.conversation || [],
          oneLineSummary,
          exchangeCount,
          attachFilename: attachName,
          buildTxtBody: () =>
            buildTherapistSessionTxt({
              patientName: record.patientName,
              therapistName: record.therapistName,
              mode: record.mode,
              completedAt,
              conversation: record.conversation || [],
              oneLineSummary,
            }),
        });
      } catch (e) {
        console.error("Therapist email send failed:", e?.message || e);
      }
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
