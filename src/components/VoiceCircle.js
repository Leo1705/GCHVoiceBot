"use client";

/**
 * Calmi.so-style voice circle: breathes when speaking, goes inward when listening.
 */
export default function VoiceCircle({ state, onPressStart, onPressEnd, disabled }) {
  const isListening = state === "listening";
  const isSpeaking = state === "speaking";
  const isThinking = state === "thinking";
  const isIdle = state === "idle";

  const circleClass = isSpeaking
    ? "voice-circle-breathe bg-calm-500/90 shadow-2xl shadow-calm-500/30"
    : isListening
    ? "voice-circle-inward bg-calm-600 shadow-xl"
    : isThinking
    ? "voice-circle-breathe bg-calm-400/80 shadow-xl"
    : "voice-circle-idle bg-white border-2 border-calm-300 shadow-lg";

  return (
    <div className="relative flex flex-col items-center gap-6 min-h-[200px] sm:min-h-[220px] justify-center">
      {/* Outer ripples when listening (inward effect) */}
      {isListening && (
        <div className="absolute pointer-events-none flex items-center justify-center" style={{ width: 280, height: 280 }}>
          <div className="absolute w-44 h-44 rounded-full border-2 border-calm-400/50 voice-ripple-in" style={{ animationDelay: "0s" }} />
          <div className="absolute w-44 h-44 rounded-full border-2 border-calm-400/40 voice-ripple-in" style={{ animationDelay: "0.3s" }} />
          <div className="absolute w-44 h-44 rounded-full border-2 border-calm-400/30 voice-ripple-in" style={{ animationDelay: "0.6s" }} />
        </div>
      )}

      <button
        type="button"
        onMouseDown={onPressStart}
        onMouseUp={onPressEnd}
        onMouseLeave={onPressEnd}
        onTouchStart={(e) => { e.preventDefault(); onPressStart(); }}
        onTouchEnd={(e) => { e.preventDefault(); onPressEnd(); }}
        disabled={disabled}
        className={`relative flex items-center justify-center rounded-full w-40 h-40 sm:w-48 sm:h-48 transition-colors focus:outline-none focus:ring-4 focus:ring-calm-300/50 disabled:opacity-60 disabled:cursor-not-allowed ${circleClass}`}
        aria-label={isListening ? "Your turn — release to send early" : "Hold to talk"}
      >
        {isListening ? (
          <span className="w-4 h-4 rounded-full bg-white/90" aria-hidden />
        ) : (
          <svg className="w-12 h-12 sm:w-14 sm:h-14 text-calm-600" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.36-.98.85C16.52 14.2 14.47 16 12 16s-4.52-1.8-4.93-4.15c-.08-.49-.49-.85-.98-.85-.61 0-1.09.54-1 1.14.49 3 2.89 5.35 5.91 5.78V20c0 .55.45 1 1 1s1-.45 1-1v-2.08c3.02-.43 5.42-2.78 5.91-5.78.1-.6-.39-1.14-1-1.14z" />
          </svg>
        )}
      </button>

      <p className="text-sm font-medium text-gray-600">
        {isListening && "Your turn"}
        {isSpeaking && "Speaking…"}
        {isThinking && "Thinking…"}
        {isIdle && "Hold to talk"}
      </p>
    </div>
  );
}
