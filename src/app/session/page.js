"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import LiveCaptions from "@/components/LiveCaptions";
import EmergencyPanel from "@/components/EmergencyPanel";
import BookingModal from "@/components/BookingModal";
import PaywallModal from "@/components/PaywallModal";
import StatusOrb from "@/components/StatusOrb";
import SessionControls from "@/components/SessionControls";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useSpeechPlayback } from "@/hooks/useSpeechPlayback";
import * as mockApi from "@/lib/mockApi";
import { sendChat } from "@/lib/chatApi";
import { getUserMemory, addToUserMemory } from "@/lib/userMemory";
import { VOICE_PROFILES, getNoraSessionOpening } from "@/lib/constants";
import { clearPatientInfo, setPatientInfo } from "@/lib/therapistSession";
import { useAuth } from "@/context/AuthContext";

const STATE_IDLE = "idle";
const STATE_LISTENING = "listening";
const STATE_THINKING = "thinking";
const STATE_SPEAKING = "speaking";
const STATE_ERROR = "error";

const MIN_INTERRUPT_WORDS = 2;
const MIN_INTERRUPT_CHARS = 15;
const INTERRUPT_DEBOUNCE_MS = 700;

function sanitizeUserTranscript(raw) {
  const s = String(raw || "")
    .replace(/\s+/g, " ")
    .trim();
  if (!s) return "";
  return s
    .replace(/\b(um+|uh+|erm+|mm+|hmm+|ah+|eh+)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function formatCountdown(secondsFloat) {
  const sec = Math.max(0, Math.floor(Number(secondsFloat) || 0));
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function LegacySessionContent({ mode, voiceType, recordingEnabled }) {
  const router = useRouter();
  const { user, ready, voiceSecondsUsed, freeVoiceSecondsLimit, refreshUser, logout } = useAuth();
  const [sessionId, setSessionId] = useState(null);
  const [currentMode] = useState(mode);
  const [currentVoice] = useState(voiceType);
  const [state, setState] = useState(STATE_IDLE);
  const [conversation, setConversation] = useState([]);
  const [showEmergency, setShowEmergency] = useState(false);
  const [showBooking, setShowBooking] = useState(false);
  const [escalationLevel, setEscalationLevel] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
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
  /** Smooth countdown: server `used` at time `at`; while session active, subtract wall seconds since `at`. */
  const usageSyncRef = useRef({ used: 0, at: Date.now() });
  const [freeTimeLabel, setFreeTimeLabel] = useState("00:00");
  const lastFreeLabelRef = useRef("");
  const tapStartLockRef = useRef(false);

  const paywallBlocked =
    Boolean(user?.plan === "free" && voiceSecondsUsed >= freeVoiceSecondsLimit);

  useEffect(() => {
    isMicMutedRef.current = isMicMuted;
  }, [isMicMuted]);

  useEffect(() => {
    if (user) {
      setPatientInfo(user.name, user.email);
    }
  }, [user]);

  useEffect(() => {
    if (ready && user?.plan === "free" && voiceSecondsUsed >= freeVoiceSecondsLimit) {
      setShowPaywall(true);
    }
  }, [ready, user, voiceSecondsUsed, freeVoiceSecondsLimit]);

  /** While session is live, re-anchor when server-reported usage changes (tick / refresh). */
  useEffect(() => {
    if (user?.plan !== "free" || !hasStarted) return;
    usageSyncRef.current = { used: voiceSecondsUsed, at: Date.now() };
  }, [user?.plan, hasStarted, voiceSecondsUsed]);

  /** Linear countdown driven by rAF so seconds roll steadily (no 1 Hz stutter). */
  useEffect(() => {
    if (user?.plan !== "free") return undefined;

    if (!hasStarted) {
      const next = formatCountdown(Math.max(0, freeVoiceSecondsLimit - voiceSecondsUsed));
      if (next !== lastFreeLabelRef.current) {
        lastFreeLabelRef.current = next;
        setFreeTimeLabel(next);
      }
      return undefined;
    }

    let rafId = 0;
    const loop = () => {
      const { used, at } = usageSyncRef.current;
      const remSec = Math.max(0, freeVoiceSecondsLimit - used - (Date.now() - at) / 1000);
      const next = formatCountdown(remSec);
      if (next !== lastFreeLabelRef.current) {
        lastFreeLabelRef.current = next;
        setFreeTimeLabel(next);
      }
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [user?.plan, hasStarted, freeVoiceSecondsLimit, voiceSecondsUsed]);

  useEffect(() => {
    if (!hasStarted || typeof navigator === "undefined" || !navigator.mediaDevices?.enumerateDevices) return;
    navigator.mediaDevices.enumerateDevices().then((devices) => {
      const out = devices.filter((d) => d.kind === "audiooutput");
      setOutputDevices(out);
    });
  }, [hasStarted]);

  const processTranscriptRef = useRef(null);
  const { speak, stop, useElevenLabs, error: ttsError } = useSpeechPlayback(currentVoice, selectedOutputDeviceId);
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
    if (paywallBlocked) return;
    if (isMicMutedRef.current) return;
    if (state !== STATE_LISTENING) return;

    repromptTimerRef.current = setTimeout(async () => {
      repromptTimerRef.current = null;
      if (paywallBlocked) return;
      if (isMicMutedRef.current) return;
      if (state !== STATE_LISTENING) return;
      const now = Date.now();
      if (now - lastActivityAtRef.current < 9500) return;
      if (now - lastRepromptAtRef.current < 20000) return;
      lastRepromptAtRef.current = now;

      const name = user?.name?.trim();
      const prompts = [
        name ? `Hey ${name}—I’m still here with you. What feels most present right now?` : "I’m still here with you. What feels most present right now?",
        name ? `No rush, ${name}. What’s been weighing on you most?` : "No rush. What’s been weighing on you most?",
        name ? `Take your time, ${name}. What would you like help with in this moment?` : "Take your time. What would you like help with in this moment?",
      ];
      const msg = prompts[Math.floor(Math.random() * prompts.length)];
      setConversation((c) => [...c, { role: "assistant", text: msg }]);
      setState(STATE_SPEAKING);
      if (!isMuted) await speak(msg, voiceProfile);
      setState(STATE_LISTENING);
      if (!isMicMutedRef.current) startListeningRef.current?.();
      scheduleReprompt();
    }, 10000);
  }, [clearRepromptTimer, hasStarted, isMuted, paywallBlocked, speak, state, voiceProfile, user?.name]);

  const interruptedByUserRef = useRef(false);

  const handleSilence = useCallback(
    async (transcript) => {
      if (isMicMutedRef.current) return;
      if (paywallBlocked) return;
      const cleaned = sanitizeUserTranscript(transcript);
      const canSubmit = state === STATE_LISTENING || interruptedByUserRef.current;
      if (!cleaned || !canSubmit || !processTranscriptRef.current) return;

      interruptedByUserRef.current = false;
      stop();
      interruptedRef.current = true;
      await processTranscriptRef.current(cleaned);
    },
    [stop, state, paywallBlocked]
  );

  const { startListening, stopListening, interimTranscript, isListening, error: recognitionError } = useSpeechRecognition({
    silenceTimeoutMs: 1000,
    onSilence: handleSilence,
  });

  useEffect(() => {
    startListeningRef.current = startListening;
  }, [startListening]);

  useEffect(() => {
    const t = interimTranscript.trim();
    if (t.length > 0) {
      lastActivityAtRef.current = Date.now();
      clearRepromptTimer();
    }
  }, [interimTranscript, clearRepromptTimer]);

  useEffect(() => {
    if (!ready || !user) return;
    let cancelled = false;
    (async () => {
      const res = await mockApi.startSession({
        mode: currentMode,
        voiceType: currentVoice,
        recordingEnabled,
      });
      if (!cancelled && res?.sessionId) {
        setSessionId(res.sessionId);
        const first = String(user.name || "").trim().split(/\s+/)[0];
        const greeting = getNoraSessionOpening(new Date(), first);
        initialGreetingRef.current = greeting;
        setConversation([{ role: "assistant", text: greeting }]);
        setState(STATE_IDLE);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [currentMode, currentVoice, recordingEnabled, user, ready]);

  // Free tier: bill wall-clock time while session is active
  useEffect(() => {
    if (!hasStarted || !user || user.plan !== "free" || paywallBlocked) return;
    const id = setInterval(async () => {
      try {
        const r = await fetch("/api/usage/tick", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ deltaSeconds: 10 }),
        });
        const d = await r.json();
        if (typeof d.voiceSecondsUsed === "number") {
          usageSyncRef.current = { used: d.voiceSecondsUsed, at: Date.now() };
        }
        await refreshUser();
        if (d.blocked) {
          setShowPaywall(true);
          stop();
          try {
            await stopListening();
          } catch (_) {}
          clearRepromptTimer();
        }
      } catch (_) {}
    }, 10000);
    return () => clearInterval(id);
  }, [hasStarted, user, paywallBlocked, refreshUser, stop, stopListening, clearRepromptTimer]);

  const handleTapToStart = useCallback(async () => {
    if (hasStarted || !initialGreetingRef.current || !user) return;
    if (tapStartLockRef.current) return;
    if (paywallBlocked) {
      setShowPaywall(true);
      return;
    }
    tapStartLockRef.current = true;
    const opening = initialGreetingRef.current.trim();
    usageSyncRef.current = { used: voiceSecondsUsed, at: Date.now() };
    setHasStarted(true);
    setConversation([{ role: "assistant", text: opening }]);
    setState(STATE_SPEAKING);
    try {
      if (!isMuted) await speak(opening, voiceProfile);
    } finally {
      tapStartLockRef.current = false;
    }
    setState(STATE_LISTENING);
    if (!isMicMuted) startListening();
    lastActivityAtRef.current = Date.now();
    scheduleReprompt();
  }, [
    hasStarted,
    speak,
    voiceProfile,
    isMuted,
    user,
    paywallBlocked,
    isMicMuted,
    voiceSecondsUsed,
    startListening,
    scheduleReprompt,
  ]);

  const processTranscript = useCallback(
    async (userTranscript) => {
      if (!sessionId) return;
      if (paywallBlocked) {
        setShowPaywall(true);
        setState(STATE_LISTENING);
        if (!isMicMuted) startListening();
        return;
      }
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
          patientName: user?.name || undefined,
        });

        if (res.paywall) {
          setShowPaywall(true);
          await refreshUser();
          setState(STATE_LISTENING);
          if (!isMicMuted) startListening();
          return;
        }

        if (res.factsToRemember?.length) addToUserMemory(res.factsToRemember);

        if (res.transcript) {
          lastActivityAtRef.current = Date.now();
          setConversation((c) => [...c, { role: "user", text: res.transcript }]);
        }

        if (res.responseText) {
          setConversation((c) => [...c, { role: "assistant", text: res.responseText }]);
          setState(STATE_SPEAKING);
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
          clearPatientInfo();
          const summary = `Session completed with ${finalConversation.length} message exchanges.`;
          fetch("/api/session/complete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              patientName: user?.name || "",
              patientEmail: user?.email || "",
              therapistName: "",
              therapistEmail: "",
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
    [
      sessionId,
      currentMode,
      voiceProfile,
      speak,
      router,
      conversation,
      startListening,
      stopListening,
      isMuted,
      isMicMuted,
      clearRepromptTimer,
      scheduleReprompt,
      paywallBlocked,
      user,
      refreshUser,
    ]
  );
  processTranscriptRef.current = processTranscript;

  const handleEndSession = useCallback(async () => {
    stop();
    try {
      await stopListening();
    } catch (_) {}
    if (sessionId) await mockApi.endSession(sessionId);
    clearRepromptTimer();
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
          patientName: user?.name || "",
          patientEmail: user?.email || "",
          therapistName: "",
          therapistEmail: "",
          mode: currentMode,
          summary,
          conversation,
        }),
      });
    } catch {
      /* session save failed silently */
    }
    router.push("/finished");
  }, [stop, stopListening, sessionId, router, currentMode, conversation, clearRepromptTimer, user]);

  useEffect(() => {
    return () => {
      clearRepromptTimer();
      stop();
      try {
        stopListening();
      } catch (_) {}
    };
  }, [clearRepromptTimer, stop, stopListening]);

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
      interruptedByUserRef.current = true;
      setState(STATE_LISTENING);
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

  useEffect(() => {
    const shouldListen = hasStarted && !isMicMuted && state === STATE_LISTENING && !paywallBlocked;
    if (shouldListen && !isListening) {
      try {
        startListeningRef.current?.();
      } catch (_) {}
    }
  }, [hasStarted, isMicMuted, isListening, state, paywallBlocked]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center text-gray-500">
        Loading…
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <p className="text-gray-700">Please sign in to use Nora.</p>
        <Link href="/login?callbackUrl=/session" className="mt-4 inline-block font-semibold text-calm-600 hover:underline">
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-4 py-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0 flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-bold text-calm-800">Conversation With Nora</h1>
          {recordingEnabled && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
              Recording on
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2 sm:shrink-0">
          {user.plan === "free" && (
            <span
              className="rounded-full bg-calm-100 px-3 py-1 text-sm font-semibold tabular-nums text-calm-900"
              title="Free session time remaining"
            >
              {freeTimeLabel}
            </span>
          )}
          <button
            type="button"
            onClick={() => logout().then(() => router.push("/"))}
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100"
          >
            Log out
          </button>
          {hasStarted ? (
            <button
              type="button"
              onClick={handleEndSession}
              className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              End session
            </button>
          ) : null}
        </div>
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
        <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          We couldn’t play that reply through the speaker. You can try again in a moment.
        </div>
      )}

      {!hasStarted ? (
        <div className="mt-10 flex flex-col items-center justify-center py-12">
          <p className="mb-6 max-w-sm text-center leading-relaxed text-gray-600">
            Hi{user.name ? `, ${user.name.split(/\s+/)[0]}` : ""}. Tap below to begin—Nora will say hello, then you can talk freely. She already knows your name from your account.
          </p>
          <button
            type="button"
            onClick={handleTapToStart}
            disabled={paywallBlocked}
            className="rounded-full bg-calm-600 px-12 py-5 text-lg font-semibold text-white shadow-lg transition hover:bg-calm-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {paywallBlocked ? "Free time used — see pricing" : "Begin"}
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

      <div className="mt-6 flex flex-wrap items-center gap-4">
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
          Book support
        </button>
        {showEmergency && (
          <div className="mt-2 w-full">
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

      <PaywallModal open={showPaywall} onClose={() => setShowPaywall(false)} />

      <BookingModal
        open={showBooking}
        onClose={() => setShowBooking(false)}
        onConfirm={() => {
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
