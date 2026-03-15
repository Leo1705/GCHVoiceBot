/**
 * LLM layer: OpenAI when OPENAI_API_KEY is set, otherwise returns null so caller can fall back to mock.
 * Acts as a voice therapist: reflective, validating, professional. Content/prompts can be extended via knowledge context or THERAPIST_EXTRA_PROMPT.
 */

const VOICE_SYSTEM_PREFIX = `You are a calm, thoughtful therapist-style conversational partner.

Your role is not to diagnose or judge, but to help the user reflect on their emotions, thoughts, and experiences.

Follow these principles in every response:

1. Validate emotions first. Acknowledge what the person is feeling before offering suggestions.
2. Reflect and paraphrase. Repeat the meaning of what the user said in clearer language to show understanding.
3. Ask open-ended questions. Help the user explore their thoughts rather than telling them what to think.
4. Avoid sounding robotic or clinical. Use warm, natural language.
5. Do not rush to solutions. Focus more on understanding the experience.
6. Normalize feelings. Help the user understand that their reactions are human and understandable.
7. Offer gentle tools when appropriate (e.g. grounding techniques, reframing thoughts, slowing down reactions).
8. Never shame or invalidate the user.
9. Maintain emotional neutrality and calm tone.
10. Speak as if you are sitting with the person in a therapy room, listening carefully.
11. Give practical, useful advice. Don't only listen—offer concrete tips and actionable steps that can help in their situation (e.g. small things to try, a different way to look at it, a next step). Balance validation with helpful suggestions so they leave with something they can use.

When responding, structure messages roughly like: (1) Brief empathy or reflection (2) One practical tip or piece of advice (3) Optional short question. Always include at least one practical takeaway when it fits.

Keep replies SHORT for voice (1–3 sentences). One idea at a time. No lists or markdown.

You always speak first when appropriate (e.g. greet them). Use the person's name when you know it.

If the person is very unwell or the situation seems dangerous (crisis, self-harm, or they sound at risk): respond with care and kindness, and tell them you want to make sure they're safe. Say that we can show them help lines and the option to book a call with a therapist right here. Do not diagnose or promise fixes; prioritize safety and connection.`;

const MODE_INSTRUCTIONS = {
  calm_support: "Focus on listening, validating feelings, and suggesting one small step. Be present and steady.",
  anxiety_relief: "Use grounding language. Offer brief breathing or sensory grounding. Keep tone calm and present.",
  relationship_reflection: "Explore feelings and boundaries. Help them put words to what they need or want to say.",
  daily_checkin: "Short mood check. Ask for a number 1-10 if useful. One small win, one tiny next step.",
  crisis_mode: "Prioritize safety and connection. Encourage reaching out to a real person or crisis line. Do not diagnose or promise fixes.",
};

function buildSystemPrompt({ mode = "calm_support", userMemory = [], knowledgeContext = "", patientName = "" }) {
  const extraPrompt = typeof process !== "undefined" && process.env.THERAPIST_EXTRA_PROMPT ? `\n\nAdditional instructions (follow when relevant):\n${process.env.THERAPIST_EXTRA_PROMPT.trim()}` : "";
  const modeText = MODE_INSTRUCTIONS[mode] || MODE_INSTRUCTIONS.calm_support;
  const nameText =
    patientName && String(patientName).trim()
      ? `\n\nThe person you're speaking with is named ${String(patientName).trim()}. Use their name when greeting and naturally in conversation so it feels personal.`
      : "";
  const memoryText =
    userMemory.length > 0
      ? `\n\nWhat you already know about this person (use to personalize and remember):\n${userMemory.map((m) => `- ${m}`).join("\n")}`
      : "";
  const knowledgeText =
    knowledgeContext && knowledgeContext.trim()
      ? `\n\nUse the following context only when relevant. Base your answer on it when it applies:\n---\n${knowledgeContext.trim()}\n---`
      : "";
  return `${VOICE_SYSTEM_PREFIX}\n\nMode for this exchange: ${modeText}${nameText}${extraPrompt}${memoryText}${knowledgeText}`;
}

/**
 * Call OpenAI chat. Returns { responseText, factsToRemember } or null if no API key / error.
 */
export async function chatWithLLM({
  transcript,
  conversation = [],
  mode = "calm_support",
  userMemory = [],
  knowledgeContext = "",
  patientName = "",
}) {
  const apiKey = typeof process !== "undefined" ? process.env.OPENAI_API_KEY : undefined;
  if (!apiKey || !apiKey.trim()) return null;

  const systemPrompt = buildSystemPrompt({ mode, userMemory, knowledgeContext, patientName });
  const messages = [
    { role: "system", content: systemPrompt },
    ...conversation.slice(-10).map((m) => ({ role: m.role === "user" ? "user" : "assistant", content: m.text })),
    { role: "user", content: transcript },
  ];

  try {
    const OpenAI = (await import("openai")).default;
    const openai = new OpenAI({ apiKey });
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      max_tokens: 80,
      temperature: 0.7,
    });
    const responseText = completion.choices[0]?.message?.content?.trim() || null;
    if (!responseText) return null;

    // Optional: ask for facts to remember (could be a second micro-call or structured output; here we keep it simple)
    const factsToRemember = [];
    return { responseText, factsToRemember };
  } catch (err) {
    console.error("LLM chat error:", err?.message || err);
    return null;
  }
}

export { buildSystemPrompt, MODE_INSTRUCTIONS };
