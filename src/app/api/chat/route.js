/**
 * POST /api/chat
 * Body: { transcript, conversation[], mode, userMemory[], knowledgeContext? }
 * Returns: { responseText, factsToRemember?, safe }
 * Safety: if transcript contains harmful phrases, returns safe: false and fixed safety response (no LLM).
 * If knowledgeContext is omitted, uses ingested knowledge from the knowledge store (RAG).
 */

import { chatWithLLM } from "@/lib/llm";
import { pickResponseFromTranscript } from "@/lib/responseFromTranscript";
import { getKnowledgeContext } from "@/lib/knowledgeStore";
import { SAFETY_RESPONSE, END_SESSION_RESPONSE, UPSELL_OFFER } from "@/lib/constants";

const UNSAFE_PHRASES = [
  "kill myself",
  "end my life",
  "want to die",
  "hurt myself",
  "suicide",
];

function isUnsafe(transcript) {
  const lower = (transcript || "").toLowerCase();
  return UNSAFE_PHRASES.some((p) => lower.includes(p));
}

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      transcript = "",
      conversation = [],
      mode = "calm_support",
      userMemory = [],
      knowledgeContext = "",
      patientName = "",
      triggerSafety,
      triggerUpsell,
      endSession: endSessionRequested,
    } = body;

    if (triggerSafety) {
      return Response.json({
        responseText: SAFETY_RESPONSE,
        factsToRemember: [],
        safe: false,
        offerHuman: true,
        escalationLevel: 3,
      });
    }
    if (endSessionRequested) {
      return Response.json({
        responseText: END_SESSION_RESPONSE,
        factsToRemember: [],
        safe: true,
        offerHuman: true,
        endSession: true,
      });
    }
    if (triggerUpsell) {
      return Response.json({
        responseText: UPSELL_OFFER,
        factsToRemember: [],
        safe: true,
        offerHuman: true,
        escalationLevel: 1,
      });
    }

    const safe = !isUnsafe(transcript);
    if (!safe) {
      return Response.json({
        responseText: SAFETY_RESPONSE,
        factsToRemember: [],
        safe: false,
        offerHuman: true,
        escalationLevel: 3,
      });
    }

    const context = typeof knowledgeContext === "string" && knowledgeContext.trim()
      ? knowledgeContext.trim()
      : getKnowledgeContext();
    const llmResult = await chatWithLLM({
      transcript: transcript.trim(),
      conversation,
      mode,
      userMemory,
      knowledgeContext: context,
      patientName: String(patientName || "").trim(),
    });

    if (llmResult?.responseText) {
      return Response.json({
        responseText: llmResult.responseText,
        factsToRemember: llmResult.factsToRemember || [],
        safe: true,
      });
    }

    // Fallback: existing keyword-based mock
    const responseText = pickResponseFromTranscript(transcript, mode);
    return Response.json({
      responseText,
      factsToRemember: [],
      safe: true,
    });
  } catch (err) {
    console.error("POST /api/chat error:", err);
    return Response.json(
      { error: "Chat failed", responseText: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
