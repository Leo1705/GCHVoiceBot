# Technical Overview — AiVoiceBot GCH

This document describes the full tech stack: what we use for speech, language, knowledge, and voice output.

---

## Two modes: ElevenLabs agent vs legacy

| Mode | When | What runs |
|------|------|-----------|
| **ElevenLabs agent** | `ELEVENLABS_API_KEY` and `ELEVENLABS_AGENT_ID` are set | Full Conversational AI: their STT, LLM, TTS, turn-taking. Session uses WebSocket to their agent. |
| **Legacy** | Agent not configured | Our stack: Web Speech STT → `/api/chat` (OpenAI or mock) → ElevenLabs TTS or Web Speech. |

On session load the app calls `GET /api/elevenlabs/signed-url`. If it returns a signed URL, the session uses the **ElevenLabs agent**. Otherwise it uses the **legacy** flow.

---

## 1. Full ElevenLabs agent mode

| What | Details |
|------|--------|
| **SDK** | `@elevenlabs/react` — `useConversation` hook. |
| **Flow** | Client gets a signed WebSocket URL from `GET /api/elevenlabs/signed-url` (backend uses `ELEVENLABS_AGENT_ID` + `ELEVENLABS_API_KEY`). Then `startSession({ signedUrl, connectionType: 'websocket' })`. Mic and agent voice are handled by ElevenLabs; we show state and captions from `onMessage`. |
| **Location** | `src/components/AgentSession.js`, `src/app/api/elevenlabs/signed-url/route.js`. |
| **Agent config** | Create and configure the agent in the [ElevenLabs Conversational AI](https://elevenlabs.io/app/conversational-ai) dashboard (prompt, voice, knowledge base, LLM, etc.). The app passes a **TTS override** (`overrides.tts.voiceId`) so the agent uses the selected ElevenLabs voice (from Start page or the in-session voice dropdown). Ensure the agent has **Text-to-Speech enabled** and a default voice in the dashboard if you don’t hear audio. |

---

## 2. Legacy mode — Speech-to-Text (STT)

| What | Details |
|------|--------|
| **Technology** | **Web Speech API** (`SpeechRecognition` / `webkitSpeechRecognition`) |
| **Where** | Browser only (client-side). |
| **Location** | `src/hooks/useSpeechRecognition.js` |
| **Behavior** | User holds the button → mic → browser STT → transcript. Continuous, interim results, `en-US`. |

---

## 3. Legacy mode — LLM

| What | Details |
|------|--------|
| **Primary** | **OpenAI** — model **`gpt-4o-mini`** when `OPENAI_API_KEY` is set. |
| **Location** | `src/lib/llm.js`, `src/app/api/chat/route.js` |
| **Fallback** | Keyword-based mock in `src/lib/responseFromTranscript.js` and `src/lib/constants.js` (MOCK_RESPONSES). |

---

## 4. Legacy mode — TTS

| What | Details |
|------|--------|
| **Primary** | **ElevenLabs API** via `POST /api/tts` when `ELEVENLABS_API_KEY` is set (no agent ID). |
| **Fallback** | None. If the key is missing or TTS fails, no audio is played and the UI shows a setup message. The app does **not** use the browser’s “Google translate–style” voice. |

---

## 5. Knowledge base (admin only)

| What | Details |
|------|--------|
| **Storage** | File-based: `data/knowledge.json` (chunks). |
| **Ingest** | **Admin only.** `POST /api/ingest` requires header **`X-Admin-Secret`** equal to `ADMIN_SECRET`. Accepts JSON `{ text }` or multipart file (PDF / .txt). Not visible to end users. |
| **Admin UI** | **`/admin/knowledge`** — paste text or upload PDF/.txt; enter admin secret. Not linked in the main app. Use this (or send files to your developer) to teach the assistant. |
| **Usage (legacy)** | `getKnowledgeContext()` is passed into the LLM in `/api/chat`. For the **ElevenLabs agent**, configure knowledge in the agent in the ElevenLabs dashboard. |

---

## 6. User memory (legacy)

| What | Details |
|------|--------|
| **Storage** | **localStorage** key `gch_user_memory`. |
| **Flow** | Sent with each `/api/chat` request; LLM system prompt includes “What you already know about this person”. |

---

## 7. Environment variables

| Variable | Purpose |
|----------|--------|
| **ELEVENLABS_API_KEY** | Required for agent mode; used for TTS in legacy. |
| **ELEVENLABS_AGENT_ID** | When set with API key, session uses full ElevenLabs agent. |
| **OPENAI_API_KEY** | Legacy mode: real LLM. Omit = mock. |
| **ADMIN_SECRET** | Secret for `/api/ingest` and `/admin/knowledge`. Not exposed to users. |

---

## 8. Summary

| Layer | ElevenLabs agent mode | Legacy mode |
|-------|------------------------|-------------|
| **STT** | ElevenLabs agent | Web Speech API |
| **LLM** | ElevenLabs agent | OpenAI or mock |
| **TTS** | ElevenLabs agent | ElevenLabs API or Web Speech |
| **Knowledge** | Configure in ElevenLabs dashboard | Ingest via `/admin/knowledge` + `ADMIN_SECRET` |

These are the technical details you should know for this project.
