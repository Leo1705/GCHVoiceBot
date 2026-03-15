import { MOCK_RESPONSES } from "./constants";

/**
 * Pick a somewhat relevant response based on what the user said (keywords/themes).
 * Uses current mode responses but boosts ones that match the transcript.
 */
export function pickResponseFromTranscript(transcript, mode) {
  const text = (transcript || "").toLowerCase().trim();
  const responses = MOCK_RESPONSES[mode] || MOCK_RESPONSES.calm_support;

  // Keyword themes -> preferred response snippets (partial match)
  const themes = [
    {
      keywords: ["anxious", "anxiety", "panic", "overwhelm", "can't breathe", "heart racing", "nervous"],
      prefer: ["safe right now", "breath", "grounding", "nervous system", "body"],
    },
    {
      keywords: ["partner", "relationship", "boyfriend", "girlfriend", "spouse", "communication", "fight", "argument", "boundary"],
      prefer: ["moment", "frustrating", "boundary", "say that to them", "heard you"],
    },
    {
      keywords: ["work", "job", "stress", "busy", "tired", "overwhelm"],
      prefer: ["small step", "need most", "one thing", "slow down"],
    },
    {
      keywords: ["sad", "depressed", "down", "hopeless", "don't know what to do"],
      prefer: ["hear you", "lot to carry", "take your time", "supportive"],
    },
    {
      keywords: ["today", "morning", "this week", "feeling"],
      prefer: ["1 to 10", "weighing on you", "small win", "tiny step"],
    },
    {
      keywords: ["thank", "helps", "better", "good"],
      prefer: ["glad", "here", "next step", "proud"],
    },
  ];

  for (const theme of themes) {
    const hasKeyword = theme.keywords.some((k) => text.includes(k));
    if (!hasKeyword) continue;
    const matching = responses.filter((r) => theme.prefer.some((p) => r.toLowerCase().includes(p)));
    if (matching.length > 0) {
      return matching[Math.floor(Math.random() * matching.length)];
    }
  }

  // Fallback: random from mode
  return responses[Math.floor(Math.random() * responses.length)];
}
