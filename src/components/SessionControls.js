"use client";

import { useEffect, useState, useRef } from "react";

const BARS = 14;
const MIN_H = 6;
const MAX_H = 28;

/**
 * Session control bar: waveform (mic when listening, animated when speaking, static when idle), speaker/output dropdown, center (transfer), close.
 */
export default function SessionControls({
  state,
  isMuted,
  onMuteToggle,
  isMicMuted = false,
  onMicMuteToggle,
  onClose,
  outputDevices = [],
  selectedOutputDeviceId = "",
  onOutputDeviceSelect,
  className = "",
}) {
  const [heights, setHeights] = useState(() => Array(BARS).fill(MIN_H));
  const [showOutputDropdown, setShowOutputDropdown] = useState(false);
  const rafRef = useRef(null);
  const streamRef = useRef(null);
  const analyserRef = useRef(null);
  const audioContextRef = useRef(null);
  const startRef = useRef(0);

  const isListening = state === "listening";
  const isSpeaking = state === "speaking";
  const isThinking = state === "thinking";

  // When nobody is talking: static bars. When listening: mic level. When speaking: animated.
  useEffect(() => {
    if (isListening) {
      let cancelled = false;
      (async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            },
          });
          if (cancelled) {
            stream.getTracks().forEach((t) => t.stop());
            return;
          }
          streamRef.current = stream;
          const ctx = new (window.AudioContext || window.webkitAudioContext)();
          audioContextRef.current = ctx;
          const src = ctx.createMediaStreamSource(stream);
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 256;
          analyser.smoothingTimeConstant = 0.7;
          src.connect(analyser);
          analyserRef.current = analyser;
          const data = new Uint8Array(analyser.frequencyBinCount);

          const tick = () => {
            if (cancelled || !analyserRef.current) return;
            analyser.getByteFrequencyData(data);
            const slice = Math.floor(data.length / BARS);
            const next = Array.from({ length: BARS }, (_, i) => {
              const start = i * slice;
              let sum = 0;
              for (let j = 0; j < slice; j++) sum += data[start + j] || 0;
              const avg = sum / slice;
              const normalized = Math.min(1, avg / 128);
              return Math.round(MIN_H + (MAX_H - MIN_H) * normalized);
            });
            setHeights(next);
            rafRef.current = requestAnimationFrame(tick);
          };
          rafRef.current = requestAnimationFrame(tick);
        } catch (_) {
          setHeights(Array(BARS).fill(MIN_H));
        }
      })();
      return () => {
        cancelled = true;
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
          streamRef.current = null;
        }
        analyserRef.current = null;
        if (audioContextRef.current) audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      };
    }

    if (isSpeaking) {
      startRef.current = performance.now();
      const tick = () => {
        const t = (performance.now() - startRef.current) / 1000;
        const next = Array.from({ length: BARS }, (_, i) => {
          const wave = Math.sin(t * 3 + i * 0.5) * 0.5 + 0.5;
          const jitter = Math.sin(t * 7 + i * 0.8) * 0.15 + 0.85;
          return Math.round(MIN_H + (MAX_H - MIN_H) * wave * jitter);
        });
        setHeights(next);
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
      return () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
      };
    }

    setHeights(Array(BARS).fill(MIN_H));
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isListening, isSpeaking]);

  return (
    <div className={`flex flex-col items-center gap-4 ${className}`}>
      {/* Waveform: static when idle/thinking, mic level when you talk, animated when she talks */}
      <div className="flex items-center justify-center gap-1 h-8" aria-hidden>
        {heights.map((h, i) => (
          <div
            key={i}
            className="w-1.5 rounded-full bg-calm-400/90 transition-all duration-75 ease-out"
            style={{ height: `${h}px` }}
          />
        ))}
      </div>

      <div className="flex items-center justify-center gap-4">
        {/* Microphone mute: your mic on/off — clear mic icon, muted = mic with slash */}
        <button
          type="button"
          onClick={() => onMicMuteToggle?.()}
          aria-label={isMicMuted ? "Unmute microphone" : "Mute microphone"}
          title={isMicMuted ? "Unmute microphone" : "Mute microphone"}
          className={`session-control-btn rounded-full w-12 h-12 flex items-center justify-center border-2 bg-white focus:outline-none focus:ring-2 focus:ring-calm-400 focus:ring-offset-2 transition-all ${
            isMicMuted
              ? "border-red-200 text-red-400 hover:border-red-300 hover:text-red-500"
              : "border-calm-300 text-calm-600 hover:border-calm-500 hover:text-calm-700"
          }`}
        >
          {isMicMuted ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 016 0v8.25a3 3 0 01-3 3z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 016 0v8.25a3 3 0 01-3 3z" />
            </svg>
          )}
        </button>

        {/* Speaker / output device: toggle mute or open dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              if (outputDevices.length > 1) setShowOutputDropdown((v) => !v);
              else onMuteToggle?.();
            }}
            onBlur={() => setTimeout(() => setShowOutputDropdown(false), 150)}
            aria-label={isMuted ? "Speaker on" : "Speaker off"}
            title={outputDevices.length > 1 ? "Output device" : isMuted ? "Turn speaker on" : "Speaker on"}
            className={`session-control-btn rounded-full w-12 h-12 flex items-center justify-center border-2 bg-white focus:outline-none focus:ring-2 focus:ring-calm-400 focus:ring-offset-2 transition-all ${
              isMuted
                ? "border-gray-200 text-gray-400 hover:border-calm-300 hover:text-calm-500"
                : "border-calm-300 text-calm-600 hover:border-calm-500 hover:text-calm-700"
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
          </button>
          {showOutputDropdown && outputDevices.length > 1 && (
            <>
              <div className="fixed inset-0 z-10" aria-hidden onClick={() => setShowOutputDropdown(false)} />
              <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-20 min-w-[180px] rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                <button
                  type="button"
                  onClick={() => {
                    onMuteToggle?.();
                    setShowOutputDropdown(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 border-b border-gray-100"
                >
                  {isMuted ? "Sound on" : "Sound off"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onOutputDeviceSelect?.("");
                    setShowOutputDropdown(false);
                  }}
                  className={`w-full px-3 py-2 text-left text-sm ${!selectedOutputDeviceId ? "bg-calm-50 text-calm-800 font-medium" : "text-gray-700 hover:bg-gray-50"}`}
                >
                  Default speaker
                </button>
                {outputDevices.map((dev) => (
                  <button
                    key={dev.deviceId}
                    type="button"
                    onClick={() => {
                      onOutputDeviceSelect?.(dev.deviceId);
                      setShowOutputDropdown(false);
                    }}
                    className={`w-full px-3 py-2 text-left text-sm truncate ${selectedOutputDeviceId === dev.deviceId ? "bg-calm-50 text-calm-800 font-medium" : "text-gray-700 hover:bg-gray-50"}`}
                    title={dev.label}
                  >
                    {dev.label || `Device ${dev.deviceId.slice(0, 8)}`}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="End session"
          title="End session"
          className="session-control-btn rounded-full w-12 h-12 flex items-center justify-center border-2 border-gray-200 bg-white text-gray-600 hover:border-calm-300 hover:bg-calm-50 hover:text-calm-700 focus:outline-none focus:ring-2 focus:ring-calm-400 focus:ring-offset-2 transition-all"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
