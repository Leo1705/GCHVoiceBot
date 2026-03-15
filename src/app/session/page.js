"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import StateIndicator from "@/components/StateIndicator";
import LiveCaptions from "@/components/LiveCaptions";
import EmergencyPanel from "@/components/EmergencyPanel";
import BookingModal from "@/components/BookingModal";
import Link from "next/link";
import StatusOrb from "@/components/StatusOrb";
import SessionControls from "@/components/SessionControls";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useSpeechPlayback } from "@/hooks/useSpeechPlayback";
import * as mockApi from "@/lib/mockApi";
import { sendChat } from "@/lib/chatApi";
import { getUserMemory, addToUserMemory } from "@/lib/userMemory";
import { VOICE_PROFILES, SESSION_GREETING } from "@/lib/constants";
import { getPatientInfo, clearPatientInfo, getPatientName } from "@/lib/therapistSession";

const STATE_IDLE = "idle";
const STATE_LISTENING = "listening";
const STATE_THINKING = "thinking";
const STATE_SPEAKING = "speaking";
const STATE_ERROR = "error";

// Only interrupt when user has clearly said at least a couple of words (not noise or a single syllable)
const MIN_INTERRUPT_WORDS = 2;
const MIN_INTERRUPT_CHARS = 15;
const INTERRUPT_DEBOUNCE_MS = 700;

function LegacySessionContent({ mode, voiceType, recordingEnabled }) {
  const router = useRouter();
  const [sessionId, setSessionId] = useState(null);
  const [currentMode, setCurrentMode] = useState(mode);
  const [currentVoice, setCurrentVoice] = useState(voiceType);
  const [state, setState] = useState(STATE_IDLE);
  const [conversation, setConversation] = useState([]);
  const [showEmergency, setShowEmergency] = useState(false);
  const [showBooking, setShowBooking] = useState(false);
  const [escalationLevel, setEscalationLevel] = useState(0);
  const [demoOverride, setDemoOverride] = useState("normal");
  const [hasStarted, setHasStarted] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [outputDevices, setOutputDevices] = useState([]);
  const [selectedOutputDeviceId, setSelectedOutputDeviceId] = useState("");
  const initialGreetingRef = useRef("");
  const startListeningRef = useRef(null);
  const isMicMutedRef = useRef(false);
  const interruptedRef = useRef(false);
  const interruptDebounceRef = useRef(null);

  useEffect(() => {
    isMicMutedRef.current = isMicMuted;
  }, [isMicMuted]);

  useEffect(() => {
    if (!hasStarted || typeof navigator === "undefined" || !navigator.mediaDevices?.enumerateDevices) return;
    navigator.mediaDevices.enumerateDevices().then((devices) => {
      const out = devices.filter((d) => d.kind === "audiooutput");
      setOutputDevices(out);
    });
  }, [hasStarted]);

  const processTranscriptRef = useRef(null);
  const { speak, stop, isPlaying, useElevenLabs, error: ttsError } = useSpeechPlayback(currentVoice, selectedOutputDeviceId);
  const voiceProfile = VOICE_PROFILES.find((p) => p.id === currentVoice) || VOICE_PROFILES[0];
  const showElevenLabsRequired = useElevenLabs === false;

  const handleSilence = useCallback(
    async (transcript) => {
      if (isMicMutedRef.current) return;
      stop();
      if (transcript && processTranscriptRef.current) {
        interruptedRef.current = true;
        await processTranscriptRef.current(transcript);
      } else {
        const msg = "I didn't catch that. Could you try again when you're ready?";
        setConversation((c) => [...c, { role: "assistant", text: msg }]);
        setState(STATE_SPEAKING);
        if (!isMuted) await speak(msg, voiceProfile);
        setState(STATE_LISTENING);
        if (!isMicMutedRef.current) startListeningRef.current?.();
      }
    },
    [speak, voiceProfile, stop, isMuted]
  );

  const { startListening, stopListening, interimTranscript, isListening, error: recognitionError } = useSpeechRecognition({
    silenceTimeoutMs: 1500,
    onSilence: handleSilence,
  });

  useEffect(() => {
    startListeningRef.current = startListening;
  }, [startListening]);

  // Set up session and greeting on mount; wait for user tap to start (required for audio to play)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await mockApi.startSession({
        mode: currentMode,
        voiceType: currentVoice,
        recordingEnabled,
      });
      if (!cancelled && res?.sessionId) {
        setSessionId(res.sessionId);
        const patientName = getPatientName();
        const greeting =
          patientName && patientName.trim()
            ? `Hi ${patientName.trim()}, I'm here when you're ready. Say what's on your mind.`
            : SESSION_GREETING;
        initialGreetingRef.current = greeting;
        setConversation((c) => [...c, { role: "assistant", text: greeting }]);
        setState(STATE_IDLE);
      }
    })();
    return () => { cancelled = true; };
  }, [currentMode, currentVoice, recordingEnabled]);

  const handleTapToStart = useCallback(async () => {
    if (hasStarted || !initialGreetingRef.current) return;
    setHasStarted(true);
    setState(STATE_SPEAKING);
    if (!isMuted) await speak(initialGreetingRef.current, voiceProfile);
    setState(STATE_LISTENING);
    if (!isMicMuted) startListening();
  }, [hasStarted, speak, voiceProfile, startListening, isMuted, isMicMuted]);

  const processTranscript = useCallback(
    async (userTranscript) => {
      if (!sessionId) return;
      interruptedRef.current = false;
      await stopListening();
      setState(STATE_THINKING);

      try {
        const res = await sendChat({
          transcript: userTranscript,
          conversation,
          mode: currentMode,
          userMemory: getUserMemory(),
          patientName: getPatientInfo().patientName || undefined,
          triggerSafety: demoOverride === "safety",
          triggerUpsell: demoOverride === "upsell",
          endSession: demoOverride === "end",
        });

        if (res.factsToRemember?.length) addToUserMemory(res.factsToRemember);

        if (res.transcript) {
          setConversation((c) => [...c, { role: "user", text: res.transcript }]);
        }

        if (res.responseText) {
          setConversation((c) => [...c, { role: "assistant", text: res.responseText }]);
          setState(STATE_SPEAKING);
          if (!isMicMuted) startListening();
          if (!isMuted) await speak(res.responseText, voiceProfile);
          if (!interruptedRef.current) {
            setState(STATE_LISTENING);
            if (!isMicMuted) startListening();
          }
        }

        if (res.offerHuman !== undefined && res.offerHuman) {
          setEscalationLevel(res.escalationLevel ?? 1);
          setShowBooking(true);
        }

        if (res.endSession) {
          const endText = res.responseText || "Session ended. Take care.";
          const finalConversation = [
            ...conversation,
            ...(res.transcript ? [{ role: "user", text: res.transcript }] : []),
            { role: "assistant", text: endText },
          ];
          setConversation(finalConversation);
          if (!isMuted) await speak(endText, voiceProfile);
          const patient = getPatientInfo();
          clearPatientInfo();
          const summary = `Session completed with ${finalConversation.length} message exchanges.`;
          fetch("/api/session/complete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              patientName: patient.patientName,
              patientEmail: patient.patientEmail,
              mode: currentMode,
              summary,
              conversation: finalConversation,
            }),
          }).catch((e) => console.warn("Failed to save session", e));
          setTimeout(() => router.push("/"), 2000);
          return;
        }

        setState(STATE_LISTENING);
        if (!isMicMuted) startListening();
      } catch (err) {
        setState(STATE_ERROR);
        setConversation((c) => [...c, { role: "assistant", text: "Something went wrong. Please try again." }]);
        setState(STATE_LISTENING);
        if (!isMicMuted) startListening();
      }
    },
    [sessionId, currentMode, demoOverride, voiceProfile, speak, router, conversation.length, startListening, stopListening, isMuted, isMicMuted]
  );
  processTranscriptRef.current = processTranscript;

  useEffect(() => {
    if (isPlaying) setState(STATE_SPEAKING);
  }, [isPlaying]);

  const handleEndSession = useCallback(async () => {
    if (sessionId) await mockApi.endSession(sessionId);
    const patient = getPatientInfo();
    clearPatientInfo();
    const summary =
      conversation.length > 0
        ? `Session completed with ${conversation.length} message exchanges.`
        : "Session ended with no conversation.";
    try {
      await fetch("/api/session/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientName: patient.patientName,
          patientEmail: patient.patientEmail,
          mode: currentMode,
          summary,
          conversation,
        }),
      });
    } catch (e) {
      console.warn("Failed to save session", e);
    }
    router.push("/");
  }, [sessionId, router, currentMode, conversation]);

  // Only interrupt when she clearly hears you say words (not noise/syllables) — otherwise she keeps talking
  useEffect(() => {
    const trimmed = interimTranscript.trim();
    const words = trimmed.split(/\s+/).filter((w) => w.length > 0);
    const hasEnoughWords = words.length >= MIN_INTERRUPT_WORDS;
    const hasEnoughLength = trimmed.length >= MIN_INTERRUPT_CHARS;
    const heardRealSpeech = hasEnoughWords && hasEnoughLength;
    const shouldConsiderInterrupt = (state === STATE_SPEAKING || state === STATE_THINKING) && heardRealSpeech;

    if (!shouldConsiderInterrupt) {
      if (interruptDebounceRef.current) {
        clearTimeout(interruptDebounceRef.current);
        interruptDebounceRef.current = null;
      }
      return;
    }

    if (interruptDebounceRef.current) return;

    interruptDebounceRef.current = setTimeout(() => {
      interruptDebounceRef.current = null;
      stop();
      setState(STATE_LISTENING);
    }, INTERRUPT_DEBOUNCE_MS);

    return () => {
      if (interruptDebounceRef.current) {
        clearTimeout(interruptDebounceRef.current);
        interruptDebounceRef.current = null;
      }
    };
  }, [state, interimTranscript, stop]);

  const handleMicMuteToggle = useCallback(() => {
    setIsMicMuted((prev) => {
      const next = !prev;
      if (next) {
        stopListening();
      } else if (state === STATE_LISTENING) {
        startListening();
      }
      return next;
    });
  }, [state, stopListening, startListening]);

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-4 py-6">
      <header className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Link href="/" className="text-sm text-calm-600 hover:underline">← Home</Link>
          <h1 className="text-xl font-bold text-calm-800">Session</h1>
          {recordingEnabled && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
              Recording on
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <StateIndicator state={state} />
          <button
            type="button"
            onClick={handleEndSession}
            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            End session
          </button>
        </div>
      </header>

      {recognitionError && (
        <div className="mt-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">{recognitionError}</div>
      )}

      {showElevenLabsRequired && (
        <div className="mt-4 rounded-xl border-2 border-amber-400 bg-amber-50 p-4">
          <p className="font-semibold text-amber-900">No ElevenLabs voice — using browser voice</p>
          <p className="mt-1 text-sm text-amber-800">
            Add <code className="rounded bg-amber-100 px-1 py-0.5 font-mono text-xs">ELEVENLABS_API_KEY</code> to <code className="rounded bg-amber-100 px-1 py-0.5 font-mono text-xs">.env.local</code>, then <strong>restart the dev server</strong> (npm run dev). Get a key at elevenlabs.io.
          </p>
        </div>
      )}
      {ttsError && !showElevenLabsRequired && (
        <div className="mt-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-sm text-amber-800">
          Voice error: {ttsError}
        </div>
      )}

      {!hasStarted ? (
        <div className="mt-10 flex flex-col items-center justify-center py-12">
          <p className="text-gray-600 text-center mb-6">Your therapist will say hello first. When you&apos;re ready, share what&apos;s on your mind — take your time, and she&apos;ll respond when you pause.</p>
          <button
            type="button"
            onClick={handleTapToStart}
            className="rounded-full bg-calm-600 px-12 py-5 text-lg font-semibold text-white shadow-lg hover:bg-calm-700 transition"
          >
            Start conversation
          </button>
        </div>
      ) : (
        <div className="mt-6 flex flex-col items-center gap-6">
          <StatusOrb state={state === STATE_ERROR ? STATE_IDLE : state} />
          <SessionControls
            state={state}
            isMuted={isMuted}
            onMuteToggle={() => setIsMuted((m) => !m)}
            isMicMuted={isMicMuted}
            onMicMuteToggle={handleMicMuteToggle}
            onClose={handleEndSession}
            outputDevices={outputDevices}
            selectedOutputDeviceId={selectedOutputDeviceId}
            onOutputDeviceSelect={setSelectedOutputDeviceId}
          />
        </div>
      )}

      {hasStarted && (
        <div className="mt-6">
          <LiveCaptions conversation={conversation} state={state} interimTranscript={interimTranscript} />
        </div>
      )}

      <div className="mt-6">
        <button
          type="button"
          onClick={() => setShowEmergency(!showEmergency)}
          className="text-sm font-medium text-amber-700 hover:underline"
        >
          {showEmergency ? "Hide" : "Emergency / Exit"}
        </button>
        {showEmergency && (
          <div className="mt-2">
            <EmergencyPanel
              onTalkToHuman={() => {
                setShowEmergency(false);
                setShowBooking(true);
                setEscalationLevel(3);
              }}
              onDismiss={() => setShowEmergency(false)}
            />
          </div>
        )}
      </div>

      <BookingModal
        open={showBooking}
        onClose={() => setShowBooking(false)}
        onConfirm={(data) => {
          if (sessionId) mockApi.escalate(sessionId, { level: escalationLevel, reason: "booking", userAction: "accepted" });
        }}
        escalationLevel={escalationLevel}
      />
    </main>
  );
}

function SessionContent() {
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode") || "calm_support";
  const voiceType = searchParams.get("voice") || "female";
  const recordingEnabled = searchParams.get("recording") === "1";

  return <LegacySessionContent mode={mode} voiceType={voiceType} recordingEnabled={recordingEnabled} />;
}

export default function SessionPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-gray-500">Loading session…</div>}>
      <SessionContent />
    </Suspense>
  );
}
