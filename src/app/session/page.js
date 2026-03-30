"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import LiveCaptions from "@/components/LiveCaptions";
import EmergencyPanel from "@/components/EmergencyPanel";
import BookingModal from "@/components/BookingModal";
import StatusOrb from "@/components/StatusOrb";
import NoraIntroModal from "@/components/NoraIntroModal";
import SessionControls from "@/components/SessionControls";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useSpeechPlayback } from "@/hooks/useSpeechPlayback";
import * as mockApi from "@/lib/mockApi";
import { sendChat } from "@/lib/chatApi";
import { getUserMemory, addToUserMemory } from "@/lib/userMemory";
import { VOICE_PROFILES, getNoraIntroGreeting, THERAPIST_SELECT_OPTIONS, getNoraPostOnboardingLine } from "@/lib/constants";
import {
  getPatientInfo,
  clearPatientInfo,
  setPatientInfo,
  setTherapistForSession,
  getTherapistFromSession,
  clearTherapistFromSession,
} from "@/lib/therapistSession";

const STATE_IDLE = "idle";
const STATE_LISTENING = "listening";
const STATE_THINKING = "thinking";
const STATE_SPEAKING = "speaking";
const STATE_ERROR = "error";

// Only interrupt when user has clearly said at least a couple of words (not noise or a single syllable)
const MIN_INTERRUPT_WORDS = 2;
const MIN_INTERRUPT_CHARS = 15;
const INTERRUPT_DEBOUNCE_MS = 700;

function sanitizeUserTranscript(raw) {
  const s = String(raw || "")
    .replace(/\s+/g, " ")
    .trim();
  if (!s) return "";
  // Strip common non-content filler (don’t be aggressive; keep real words).
  return s
    .replace(/\b(um+|uh+|erm+|mm+|hmm+|ah+|eh+)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

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
  const [hasStarted, setHasStarted] = useState(false);
  const [showIntroModal, setShowIntroModal] = useState(false);
  const introModalOpenRef = useRef(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [outputDevices, setOutputDevices] = useState([]);
  const [selectedOutputDeviceId, setSelectedOutputDeviceId] = useState("");
  const initialGreetingRef = useRef("");
  const startListeningRef = useRef(null);
  const isMicMutedRef = useRef(false);
  const interruptedRef = useRef(false);
  const interruptDebounceRef = useRef(null);
  const repromptTimerRef = useRef(null);
  const lastActivityAtRef = useRef(Date.now());
  const lastRepromptAtRef = useRef(0);

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

  const clearRepromptTimer = useCallback(() => {
    if (repromptTimerRef.current) {
      clearTimeout(repromptTimerRef.current);
      repromptTimerRef.current = null;
    }
  }, []);

  const scheduleReprompt = useCallback(() => {
    clearRepromptTimer();
    if (!hasStarted) return;
    if (introModalOpenRef.current) return;
    if (isMicMutedRef.current) return;
    // Only when we are in listening mode (waiting on them)
    if (state !== STATE_LISTENING) return;

    repromptTimerRef.current = setTimeout(async () => {
      repromptTimerRef.current = null;
      if (introModalOpenRef.current) return;
      if (isMicMutedRef.current) return;
      if (state !== STATE_LISTENING) return;
      const now = Date.now();
      // Avoid stacking reprompts
      if (now - lastActivityAtRef.current < 9500) return;
      if (now - lastRepromptAtRef.current < 20000) return;
      lastRepromptAtRef.current = now;

      const name = getPatientInfo().patientName?.trim();
      const prompts = [
        name ? `Hey ${name}—I’m still here with you. What feels most present right now?` : "I’m still here with you. What feels most present right now?",
        name ? `No rush, ${name}. When you’re ready, what’s been weighing on you most?` : "No rush. When you’re ready, what’s been weighing on you most?",
        name ? `Take your time, ${name}. What would you like help with in this moment?` : "Take your time. What would you like help with in this moment?",
      ];
      const msg = prompts[Math.floor(Math.random() * prompts.length)];
      setConversation((c) => [...c, { role: "assistant", text: msg }]);
      setState(STATE_SPEAKING);
      if (!isMuted) {
        // Speak immediately; we only resume listening after playback.
        await speak(msg, voiceProfile);
      }
      setState(STATE_LISTENING);
      if (!isMicMutedRef.current) startListeningRef.current?.();
      scheduleReprompt();
    }, 10000);
  }, [clearRepromptTimer, hasStarted, isMuted, speak, state, voiceProfile]);

  const interruptedByUserRef = useRef(false);

  const handleSilence = useCallback(
    async (transcript) => {
      if (isMicMutedRef.current) return;
      if (introModalOpenRef.current) return;
      const cleaned = sanitizeUserTranscript(transcript);
      // Only submit if:
      // - we are waiting for the user (normal turn), OR
      // - we actually interrupted Nora (user spoke over her).
      const canSubmit = state === STATE_LISTENING || interruptedByUserRef.current;
      if (!cleaned || !canSubmit || !processTranscriptRef.current) return;

      interruptedByUserRef.current = false;
      stop();
      interruptedRef.current = true;
      await processTranscriptRef.current(cleaned);
    },
    [stop, state]
  );

  const { startListening, stopListening, interimTranscript, isListening, error: recognitionError } = useSpeechRecognition({
    // Submit a turn shortly after they stop speaking (natural handoff)
    silenceTimeoutMs: 1000,
    onSilence: handleSilence,
  });

  useEffect(() => {
    startListeningRef.current = startListening;
  }, [startListening]);

  // Any speech activity should cancel/extend the 10s "no speech" reprompt.
  useEffect(() => {
    const t = interimTranscript.trim();
    if (t.length > 0) {
      lastActivityAtRef.current = Date.now();
      clearRepromptTimer();
    }
  }, [interimTranscript, clearRepromptTimer]);

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
        const greeting = getNoraIntroGreeting(new Date());
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
    introModalOpenRef.current = true;
    setShowIntroModal(true);
  }, [hasStarted, speak, voiceProfile, isMuted]);

  const handleIntroContinue = useCallback(
    async ({ patientName, therapistName, therapistEmail }) => {
      setPatientInfo(patientName, "");
      setTherapistForSession(therapistName, therapistEmail);
      introModalOpenRef.current = false;
      setShowIntroModal(false);

      const followUp = getNoraPostOnboardingLine(patientName);
      setConversation((c) => [...c, { role: "assistant", text: followUp }]);
      setState(STATE_SPEAKING);
      if (!isMuted) await speak(followUp, voiceProfile);
      setState(STATE_LISTENING);
      if (!isMicMuted) startListening();
      lastActivityAtRef.current = Date.now();
      scheduleReprompt();
    },
    [speak, voiceProfile, startListening, isMicMuted, isMuted, scheduleReprompt]
  );

  const processTranscript = useCallback(
    async (userTranscript) => {
      if (!sessionId) return;
      interruptedRef.current = false;
      interruptedByUserRef.current = false;
      await stopListening();
      clearRepromptTimer();
      setState(STATE_THINKING);

      try {
        const cleanedTurn = sanitizeUserTranscript(userTranscript);
        if (!cleanedTurn) {
          setState(STATE_LISTENING);
          if (!isMicMuted) startListening();
          scheduleReprompt();
          return;
        }

        const res = await sendChat({
          transcript: cleanedTurn,
          conversation,
          mode: currentMode,
          userMemory: getUserMemory(),
          patientName: getPatientInfo().patientName || undefined,
        });

        if (res.factsToRemember?.length) addToUserMemory(res.factsToRemember);

        if (res.transcript) {
          lastActivityAtRef.current = Date.now();
          setConversation((c) => [...c, { role: "user", text: res.transcript }]);
        }

        if (res.responseText) {
          setConversation((c) => [...c, { role: "assistant", text: res.responseText }]);
          setState(STATE_SPEAKING);
          // Allow user to interrupt while Nora is speaking.
          if (!isMicMutedRef.current) startListeningRef.current?.();
          if (!isMuted) await speak(res.responseText, voiceProfile);
          if (!interruptedRef.current) {
            setState(STATE_LISTENING);
            if (!isMicMuted) startListening();
            scheduleReprompt();
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
          const therapist = getTherapistFromSession();
          clearPatientInfo();
          clearTherapistFromSession();
          const summary = `Session completed with ${finalConversation.length} message exchanges.`;
          fetch("/api/session/complete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              patientName: patient.patientName,
              patientEmail: patient.patientEmail,
              therapistName: therapist?.therapistName || "",
              therapistEmail: therapist?.therapistEmail || "",
              mode: currentMode,
              summary,
              conversation: finalConversation,
            }),
          }).catch(() => {});
          setTimeout(() => router.push("/finished"), 2000);
          return;
        }

        setState(STATE_LISTENING);
        if (!isMicMuted) startListening();
        scheduleReprompt();
      } catch (err) {
        setState(STATE_ERROR);
        setConversation((c) => [...c, { role: "assistant", text: "Something went wrong. Please try again." }]);
        setState(STATE_LISTENING);
        if (!isMicMuted) startListening();
        scheduleReprompt();
      }
    },
    [sessionId, currentMode, voiceProfile, speak, router, conversation, startListening, stopListening, isMuted, isMicMuted, clearRepromptTimer, scheduleReprompt]
  );
  processTranscriptRef.current = processTranscript;

  useEffect(() => {
    if (isPlaying) setState(STATE_SPEAKING);
  }, [isPlaying]);

  const handleEndSession = useCallback(async () => {
    // Hard stop any ongoing audio immediately.
    stop();
    try {
      await stopListening();
    } catch (_) {}
    if (sessionId) await mockApi.endSession(sessionId);
    clearRepromptTimer();
    const patient = getPatientInfo();
    const therapist = getTherapistFromSession();
    clearPatientInfo();
    clearTherapistFromSession();
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
          therapistName: therapist?.therapistName || "",
          therapistEmail: therapist?.therapistEmail || "",
          mode: currentMode,
          summary,
          conversation,
        }),
      });
    } catch {
      /* session save failed silently */
    }
    router.push("/finished");
  }, [stop, stopListening, sessionId, router, currentMode, conversation, clearRepromptTimer]);

  // On unmount/navigation, stop any speech immediately.
  useEffect(() => {
    return () => {
      clearRepromptTimer();
      stop();
      try {
        stopListening();
      } catch (_) {}
    };
  }, [clearRepromptTimer, stop, stopListening]);

  // Only interrupt when she clearly hears you say words (not noise/syllables) — otherwise she keeps talking
  useEffect(() => {
    if (introModalOpenRef.current) return;
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
      interruptedByUserRef.current = true;
      setState(STATE_LISTENING);
      // Ensure we're actually listening after an interrupt.
      if (!isMicMutedRef.current) startListeningRef.current?.();
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
        clearRepromptTimer();
        stopListening();
      } else if (state === STATE_LISTENING) {
        startListening();
        scheduleReprompt();
      }
      return next;
    });
  }, [state, stopListening, startListening, clearRepromptTimer, scheduleReprompt]);

  // Keep recognition alive: if we expect to be listening but recognition stopped, restart it.
  useEffect(() => {
    const shouldListen =
      hasStarted &&
      !introModalOpenRef.current &&
      !isMicMuted &&
      state === STATE_LISTENING;
    if (shouldListen && !isListening) {
      try {
        startListeningRef.current?.();
      } catch (_) {}
    }
  }, [hasStarted, isMicMuted, isListening, state]);

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-4 py-6">
      <header className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-calm-800">Conversation With Nora</h1>
          {recordingEnabled && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
              Recording on
            </span>
          )}
        </div>
        {hasStarted ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleEndSession}
              className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              End session
            </button>
          </div>
        ) : null}
      </header>

      {recognitionError && (
        <div className="mt-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">{recognitionError}</div>
      )}

      {showElevenLabsRequired && (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="font-medium text-amber-900">Using your browser’s voice for now</p>
          <p className="mt-1 text-sm text-amber-800">
            The full Nora voice will be available once this site’s audio service is configured.
          </p>
        </div>
      )}
      {ttsError && !showElevenLabsRequired && (
        <div className="mt-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-sm text-amber-800">
          We couldn’t play that reply through the speaker. You can try again in a moment.
        </div>
      )}

      <NoraIntroModal
        open={showIntroModal}
        defaultName={getPatientInfo().patientName}
        defaultTherapistId={
          (() => {
            const th = getTherapistFromSession();
            const m = THERAPIST_SELECT_OPTIONS.find(
              (t) => t.email.toLowerCase() === (th?.therapistEmail || "").toLowerCase()
            );
            return m?.id || "";
          })()
        }
        onContinue={handleIntroContinue}
      />

      {!hasStarted ? (
        <div className="mt-10 flex flex-col items-center justify-center py-12">
          <p className="text-gray-600 text-center mb-6 max-w-sm leading-relaxed">
            Tap below when you’re ready. Nora will say hello first, then you’ll see two gentle prompts so she knows your name and who you’re working with.
          </p>
          <button
            type="button"
            onClick={handleTapToStart}
            className="rounded-full bg-calm-600 px-12 py-5 text-lg font-semibold text-white shadow-lg hover:bg-calm-700 transition"
          >
            I’m ready
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

      <div className="mt-6 flex items-center gap-4">
        <button
          type="button"
          onClick={() => setShowEmergency(!showEmergency)}
          className="text-sm font-medium text-amber-700 hover:underline"
        >
          {showEmergency ? "Hide" : "Emergency / Exit"}
        </button>
        <button
          type="button"
          onClick={() => {
            setShowEmergency(false);
            setEscalationLevel(3);
            setShowBooking(true);
          }}
          className="text-sm font-medium text-calm-700 hover:underline"
        >
          Book a call with your therapist
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
