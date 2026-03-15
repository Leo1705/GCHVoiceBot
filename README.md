# Greater Change Therapy — Frontend Prototype

Front-end only prototype for the Greater Change voice wellbeing assistant. No backend; all API calls are mocked. Use this to demo the full flow to the client.

## Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## What’s Included

- **Landing (Start Session)**  
  Mode selection (Calm Support, Anxiety Relief, Relationship Reflection, Daily Check-In, Crisis Mode), voice customization (tone/speed), optional recording consent.

- **Session UI**  
  Push-to-talk recording, Listening / Thinking / Speaking indicators, last “You said” + “Assistant” transcript, End session, Emergency/Exit panel.

- **Emergency panel**  
  Crisis resources (911, 988), “Talk to a human now” → opens booking.

- **Booking modal (upsell)**  
  Simulated booking: choose “Yes, book a session” → pick a time → confirm. Records escalation in mock API.

- **Mid-session controls**  
  Change mode and voice style during the session (mock API: `POST /session/:id/mode`, `POST /session/:id/voice-style`).

- **Prototype demo dropdown**  
  On the session page, “Simulate response” lets you force:
  - **Normal** — random mode-based reply
  - **Safety** — crisis/safety message + offer human
  - **Upsell** — “Book a therapist” offer
  - **End session** — wrap-up message then redirect home

## Flow (Mock)

1. User selects mode, voice, recording consent → **Start session**.
2. Session starts (mock `POST /session/start`).
3. User holds **Push-to-talk** → browser records → on release, mock “upload” runs → **Thinking** → mock returns transcript + response text.
4. **TTS**: browser Web Speech API speaks the response (in production: backend would return audio from Piper/ElevenLabs).
5. Optional: **Emergency** opens the crisis panel; **Talk to a human** opens the booking modal.
6. **End session** calls mock `POST /session/:id/end` and redirects to home.

## Stack

- Next.js 14 (App Router), React 18, Tailwind CSS.
- Web Audio API / MediaRecorder for recording.
- Web Speech API (SpeechSynthesis) for TTS in the prototype.

## Backend (Planned)

REST API: `POST /session/start`, `POST /session/:id/voice`, `POST /session/:id/mode`, `POST /session/:id/voice-style`, `POST /session/:id/recording`, `POST /session/:id/escalate`, `POST /session/:id/end`. See spec for STT (Whisper), safety layer, LLM (Ollama), TTS (Piper/ElevenLabs).
