/**
 * Builds a .txt attachment for therapists: AI summary (when OpenAI is configured) + full transcript.
 */

function sanitizeFilenamePart(s) {
  return String(s || "patient")
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 40) || "patient";
}

export function formatConversationTranscript(conversation) {
  if (!Array.isArray(conversation) || !conversation.length) {
    return "(No messages recorded.)";
  }
  return conversation
    .map((m) => {
      const role = m.role === "user" ? "Patient" : "Nora (assistant)";
      const text = typeof m.text === "string" ? m.text.trim() : "";
      return `${role}: ${text}`;
    })
    .join("\n\n");
}

/**
 * Short summary via OpenAI when OPENAI_API_KEY is set; otherwise a simple fallback.
 */
export async function buildSessionSummaryParagraph(conversation) {
  const transcript = formatConversationTranscript(conversation);
  const apiKey = typeof process !== "undefined" ? process.env.OPENAI_API_KEY : undefined;
  if (!apiKey?.trim()) {
    const n = Array.isArray(conversation) ? conversation.length : 0;
    return `Session contained ${n} message(s). See full transcript below.`;
  }

  try {
    const OpenAI = (await import("openai")).default;
    const openai = new OpenAI({ apiKey: apiKey.trim() });
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You summarize voice therapy session transcripts for the patient's assigned therapist. Write 2–4 short paragraphs: themes, emotional tone, what the patient shared, any practical next steps discussed, and any safety or follow-up notes if relevant. Use professional, neutral language. Do not use markdown or bullet lists.",
        },
        {
          role: "user",
          content: `Summarize this session for the therapist's records:\n\n${transcript.slice(0, 12000)}`,
        },
      ],
      max_tokens: 500,
      temperature: 0.4,
    });
    const out = completion.choices[0]?.message?.content?.trim();
    if (out) return out;
  } catch (e) {
    console.warn("Session summary LLM failed:", e?.message || e);
  }
  const n = Array.isArray(conversation) ? conversation.length : 0;
  return `Session contained ${n} message(s). See full transcript below.`;
}

/**
 * Full .txt file body for email attachment.
 */
export async function buildTherapistSessionTxt({
  patientName,
  therapistName,
  mode,
  completedAt,
  conversation,
  oneLineSummary,
}) {
  const summaryBlock = await buildSessionSummaryParagraph(conversation);
  const transcript = formatConversationTranscript(conversation);

  const lines = [
    "GREATER CHANGE HEALTH — VOICE THERAPY SESSION EXPORT",
    "=".repeat(50),
    "",
    `Patient name: ${patientName || "(not provided)"}`,
    `Assigned therapist: ${therapistName || "(unknown)"}`,
    `Session mode: ${mode || "calm_support"}`,
    `Completed (UTC): ${completedAt || new Date().toISOString()}`,
    "",
    "SUMMARY",
    "-".repeat(20),
    summaryBlock,
    "",
    "NOTES",
    "-".repeat(20),
    oneLineSummary || "",
    "",
    "FULL TRANSCRIPT",
    "-".repeat(20),
    transcript,
    "",
    "— End of export —",
  ];

  return lines.join("\n");
}

export function sessionAttachmentFilename(patientName, completedAt) {
  const date = completedAt ? new Date(completedAt) : new Date();
  const d = date.toISOString().slice(0, 10);
  return `session-${sanitizeFilenamePart(patientName)}-${d}.txt`;
}
