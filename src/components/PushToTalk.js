"use client";

export default function PushToTalk({ isRecording, onStart, onStop, disabled }) {
  return (
    <div className="flex flex-col items-center gap-4">
      <button
        type="button"
        onMouseDown={onStart}
        onMouseUp={onStop}
        onMouseLeave={onStop}
        onTouchStart={(e) => { e.preventDefault(); onStart(); }}
        onTouchEnd={(e) => { e.preventDefault(); onStop(); }}
        disabled={disabled}
        className={`relative h-24 w-24 rounded-full border-4 border-calm-400 shadow-lg transition-all focus:outline-none focus:ring-4 focus:ring-calm-300 disabled:opacity-50 disabled:cursor-not-allowed ${
          isRecording ? "recording-pulse bg-calm-500 text-white" : "bg-white text-calm-600 hover:bg-calm-50"
        }`}
        aria-label={isRecording ? "Release to send" : "Hold to talk"}
      >
        <span className="sr-only">{isRecording ? "Release to send" : "Hold to talk"}</span>
        {isRecording ? (
          <span className="absolute inset-0 flex items-center justify-center text-2xl">●</span>
        ) : (
          <svg className="mx-auto h-10 w-10" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.36-.98.85C16.52 14.2 14.47 16 12 16s-4.52-1.8-4.93-4.15c-.08-.49-.49-.85-.98-.85-.61 0-1.09.54-1 1.14.49 3 2.89 5.35 5.91 5.78V20c0 .55.45 1 1 1s1-.45 1-1v-2.08c3.02-.43 5.42-2.78 5.91-5.78.1-.6-.39-1.14-1-1.14z" />
          </svg>
        )}
      </button>
      <p className="text-sm text-gray-600">
        {isRecording ? "Release to send" : "Hold to talk"}
      </p>
    </div>
  );
}
