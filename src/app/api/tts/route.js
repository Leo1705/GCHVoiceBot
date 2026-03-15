/**
 * POST /api/tts — ElevenLabs Text-to-Speech.
 * Body: { text: string, voiceId?: string, profileId?: string, stability?, similarity_boost? }
 * Returns: audio/mpeg bytes. If ELEVENLABS_API_KEY is missing, returns 503.
 * Uses direct fetch + arrayBuffer so the browser always gets playable audio.
 */

import { VOICE_PROFILES } from "@/lib/constants";

const ELEVENLABS_BASE = "https://api.elevenlabs.io/v1";

// Free-tier only: premade voices from VOICE_PROFILES (no env override — library voices need paid plan).
const DEFAULT_VOICE_ID = "EXAVITQu4vr4xnSDxMaL"; // Bella (premade)
function getVoiceId(profileId) {
  const profile = VOICE_PROFILES.find((p) => p.id === profileId);
  const id = profile?.elevenlabsVoiceId || DEFAULT_VOICE_ID;
  return String(id).trim();
}

export async function POST(request) {
  const apiKey = typeof process !== "undefined" ? process.env.ELEVENLABS_API_KEY : undefined;
  const hasKey = !!(apiKey && typeof apiKey === "string" && apiKey.trim());
  if (!hasKey) {
    return Response.json(
      {
        error: "ElevenLabs not configured",
        details: "Set ELEVENLABS_API_KEY in .env.local and restart the dev server.",
      },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const text = typeof body.text === "string" ? body.text.trim() : "";
    if (!text) {
      return Response.json({ error: "Missing text" }, { status: 400 });
    }

    const voiceId = getVoiceId(body.profileId || "female");
    const modelsToTry = ["eleven_multilingual_v2", "eleven_flash_v2_5", "eleven_turbo_v2_5"];
    const stability = body.stability ?? 0.5;
    const similarity_boost = body.similarity_boost ?? 0.75;

    let lastErr;
    let res;

    for (const modelId of modelsToTry) {
      const url = `${ELEVENLABS_BASE}/text-to-speech/${encodeURIComponent(voiceId)}?optimize_streaming_latency=2`;
      res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": apiKey.trim(),
          Accept: "audio/mpeg",
        },
        body: JSON.stringify({
          text,
          model_id: modelId,
          voice_settings: { stability, similarity_boost },
        }),
      });
      if (res.ok) break;
      lastErr = await res.text();
    }

    if (!res?.ok) {
      let detail = lastErr || "";
      try {
        const parsed = JSON.parse(lastErr);
        detail = parsed.detail?.message || parsed.message || parsed.detail || detail;
      } catch (_) {}
      if (typeof detail !== "string") detail = JSON.stringify(detail);
      detail = detail.slice(0, 300);
      console.error("ElevenLabs TTS error:", res?.status, detail);
      return Response.json(
        { error: "TTS failed", details: detail },
        { status: res?.status === 401 ? 401 : res?.status === 503 ? 503 : res?.status === 402 ? 402 : 502 }
      );
    }

    const audioBuffer = await res.arrayBuffer();
    return new Response(audioBuffer, {
      status: 200,
      headers: {
        "Content-Type": res.headers.get("content-type") || "audio/mpeg",
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("POST /api/tts error:", err);
    return Response.json({ error: "TTS failed" }, { status: 500 });
  }
}
