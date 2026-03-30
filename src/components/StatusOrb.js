"use client";

/**
 * Pumping status orb: outline, shadow, smooth pulse. Shows listening / thinking / speaking.
 */
export default function StatusOrb({ state }) {
  const isListening = state === "listening";
  const isSpeaking = state === "speaking";
  const isThinking = state === "thinking";
  const isIdle = state === "idle";

  const stateLabel =
    isListening ? "Listening…" :
    isSpeaking ? "Speaking…" :
    isThinking ? "Thinking…" :
    "Nora";

  const orbVariant = isSpeaking
    ? "status-orb-speak"
    : isThinking
    ? "status-orb-think"
    : isListening
    ? "status-orb-listen"
    : "status-orb-idle";

  return (
    <div className="relative flex flex-col items-center justify-center gap-6 min-h-[200px] sm:min-h-[220px]">
      <div className="relative flex items-center justify-center">
        {/* Outer glow */}
        <div
          className={`absolute rounded-full status-orb-glow ${orbVariant}`}
          style={{ width: 200, height: 200 }}
          aria-hidden
        />
        {/* Outline ring */}
        <div
          className={`absolute rounded-full border-2 status-orb-ring ${orbVariant}`}
          style={{ width: 160, height: 160 }}
          aria-hidden
        />
        {/* Main orb: pumping circle with shadow */}
        <div
          className={`relative rounded-full status-orb-core ${orbVariant}`}
          style={{ width: 120, height: 120 }}
          aria-hidden
        />
      </div>
      <p className="text-sm font-medium text-gray-600 tabular-nums">
        {stateLabel}
      </p>
    </div>
  );
}
