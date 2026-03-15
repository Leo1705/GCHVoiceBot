"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useConversation } from "@elevenlabs/react";
import VoiceCircle from "@/components/VoiceCircle";
import StateIndicator from "@/components/StateIndicator";
import LiveCaptions from "@/components/LiveCaptions";
import EmergencyPanel from "@/components/EmergencyPanel";
import BookingModal from "@/components/BookingModal";
import Link from "next/link";
import { VOICE_PROFILES } from "@/lib/constants";
import { setVoicePreference } from "@/lib/settings";
import { getPatientInfo, clearPatientInfo } from "@/lib/therapistSession";

/**
 * Session UI when using full ElevenLabs Conversational AI agent.
 * Passes TTS voice override so the agent speaks with the selected ElevenLabs voice.
 */
export default function AgentSession({ signedUrl, mode: initialMode, voiceType: initialVoiceType }) {
  const router = useRouter();
  const [conversation, setConversation] = useState([]);
  const [showEmergency, setShowEmergency] = useState(false);
  const [showBooking, setShowBooking] = useState(false);
  const [escalationLevel, setEscalationLevel] = useState(0);
  const [selectedVoiceType, setSelectedVoiceType] = useState(initialVoiceType || "female");
  const conversationIdRef = useRef(null);

  const voiceProfile = VOICE_PROFILES.find((p) => p.id === selectedVoiceType) || VOICE_PROFILES[0];
  const elevenlabsVoiceId = voiceProfile?.elevenlabsVoiceId || "21m00Tcm4TlvDq8ikWAM";

  const handleMessage = useCallback((event) => {
    if (!event) return;
    const userText = event.user_transcription_event?.user_transcript ?? event.transcript;
    if (event.type === "user_transcript" && userText) {
      setConversation((c) => [...c, { role: "user", text: userText }]);
    }
    const agentText = event.agent_response_event?.agent_response ?? event.agent_response ?? event.text;
    if (event.type === "agent_response" && agentText) {
      setConversation((c) => [...c, { role: "assistant", text: agentText }]);
    }
    const correctionText = event.agent_response_correction_event?.agent_response ?? event.correction?.text;
    if (event.type === "agent_response_correction" && correctionText) {
      setConversation((c) => {
        const next = [...c];
        const last = next.length - 1;
        if (last >= 0 && next[last].role === "assistant") next[last] = { ...next[last], text: correctionText };
        return next;
      });
    }
  }, []);

  const { startSession, endSession, status, isSpeaking } = useConversation({
    onMessage: handleMessage,
    onError: (err) => console.error("Agent error:", err),
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const id = await startSession({
          signedUrl,
          connectionType: "websocket",
          overrides: {
            tts: {
              voiceId: elevenlabsVoiceId,
              stability: 0.5,
              similarityBoost: 0.75,
            },
          },
        });
        if (!cancelled) conversationIdRef.current = id;
      } catch (e) {
        if (!cancelled) console.error("Failed to start agent session", e);
      }
    })();
    return () => {
      cancelled = true;
      endSession().catch(() => {});
    };
  }, [signedUrl, elevenlabsVoiceId, startSession, endSession]);

  const state = status === "connected" ? (isSpeaking ? "speaking" : "listening") : status === "connecting" ? "thinking" : "idle";

  const handleEndSession = useCallback(async () => {
    await endSession();
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
          mode: initialMode,
          summary,
          conversation,
        }),
      });
    } catch (e) {
      console.warn("Failed to save session", e);
    }
    router.push("/");
  }, [endSession, router, initialMode, conversation]);

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-4 py-6">
      <header className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Link href="/" className="text-sm text-calm-600 hover:underline">← Home</Link>
          <h1 className="text-xl font-bold text-calm-800">Session (ElevenLabs)</h1>
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

      <div className="mt-4 rounded-xl border border-gray-200 bg-white p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Agent voice</label>
        <select
          value={selectedVoiceType}
          onChange={(e) => {
            const next = e.target.value;
            setSelectedVoiceType(next);
            setVoicePreference(next);
          }}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-calm-500 focus:ring-1 focus:ring-calm-500"
        >
          {VOICE_PROFILES.map((p) => (
            <option key={p.id} value={p.id}>{p.label}</option>
          ))}
        </select>
        <p className="mt-1.5 text-xs text-gray-500">ElevenLabs voice. Change and reconnect to use a different voice.</p>
      </div>

      <div className="mt-6 flex flex-col items-center">
        <VoiceCircle
          state={state}
          onPressStart={() => {}}
          onPressEnd={() => {}}
          disabled={false}
        />
        <p className="mt-2 text-xs text-gray-500">Talk anytime — agent is listening.</p>
      </div>

      <div className="mt-6">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Live captions</h3>
        <LiveCaptions conversation={conversation} state={state} interimTranscript="" />
      </div>

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
        onConfirm={() => {}}
        escalationLevel={escalationLevel}
      />
    </main>
  );
}
