/**
 * ElevenLabs TTS integration using the official @elevenlabs/elevenlabs-js SDK.
 * Used by /api/tts to generate speech from text.
 */

import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

const DEFAULT_MODEL = "eleven_multilingual_v2";
const MODELS_TO_TRY = ["eleven_multilingual_v2", "eleven_flash_v2_5", "eleven_turbo_v2_5"];

/**
 * Generate speech audio from text using ElevenLabs.
 * @param {string} apiKey - ElevenLabs API key (from ELEVENLABS_API_KEY).
 * @param {object} options
 * @param {string} options.text - Text to speak.
 * @param {string} options.voiceId - ElevenLabs voice ID.
 * @param {string} [options.modelId] - Model ID (default: eleven_multilingual_v2).
 * @param {number} [options.stability] - 0–1 (default 0.5).
 * @param {number} [options.similarity_boost] - 0–1 (default 0.75).
 * @returns {Promise<{ body: ReadableStream<Uint8Array>, contentType: string }>} Audio stream and content type.
 * @throws {Error} When API key is missing or ElevenLabs API returns an error.
 */
export async function textToSpeech(apiKey, options = {}) {
  const { text, voiceId, modelId, stability = 0.5, similarity_boost = 0.75 } = options;
  if (!apiKey || !String(apiKey).trim()) {
    throw new Error("ELEVENLABS_API_KEY is required");
  }
  if (!text || !String(text).trim()) {
    throw new Error("text is required");
  }
  if (!voiceId || !String(voiceId).trim()) {
    throw new Error("voiceId is required");
  }

  const client = new ElevenLabsClient({ apiKey: apiKey.trim() });
  const models = modelId ? [modelId] : MODELS_TO_TRY;
  let lastError;

  for (const model of models) {
    try {
      const stream = await client.textToSpeech.convert(voiceId, {
        text: String(text).trim(),
        modelId: model,
        outputFormat: "mp3_44100_128",
        optimizeStreamingLatency: 2,
        voiceSettings: {
          stability: Number(stability) || 0.5,
          similarityBoost: Number(similarity_boost) || 0.75,
        },
      });
      return {
        body: stream,
        contentType: "audio/mpeg",
      };
    } catch (err) {
      lastError = err;
      continue;
    }
  }

  if (lastError) {
    const status = lastError?.statusCode ?? lastError?.body?.detail ?? lastError?.message;
    const err = new Error(lastError?.message || "ElevenLabs TTS failed");
    err.statusCode = lastError?.statusCode;
    err.details = lastError?.body;
    throw err;
  }

  throw new Error("ElevenLabs TTS failed");
}
