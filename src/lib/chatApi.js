/**
 * Client-side API for /api/chat.
 * Sends transcript, conversation, mode, user memory; returns same shape as mock sendVoice for drop-in use.
 */

export async function sendChat({
  transcript,
  conversation = [],
  mode = "calm_support",
  userMemory = [],
  knowledgeContext,
  patientName,
  triggerSafety,
  triggerUpsell,
  endSession,
}) {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      transcript,
      conversation,
      mode,
      userMemory,
      knowledgeContext: knowledgeContext || undefined,
      patientName: patientName || undefined,
      triggerSafety: !!triggerSafety,
      triggerUpsell: !!triggerUpsell,
      endSession: !!endSession,
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    return {
      ok: false,
      transcript,
      responseText: data.responseText || "Something went wrong. Please try again.",
      safe: true,
      factsToRemember: [],
    };
  }
  return {
    ok: true,
    transcript,
    responseText: data.responseText,
    safe: data.safe !== false,
    factsToRemember: Array.isArray(data.factsToRemember) ? data.factsToRemember : [],
    offerHuman: data.offerHuman,
    escalationLevel: data.escalationLevel,
    endSession: data.endSession,
  };
}
