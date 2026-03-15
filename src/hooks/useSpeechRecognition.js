"use client";

import { useState, useCallback, useRef } from "react";

const DEFAULT_SILENCE_MS = 2000;

/**
 * Uses Web Speech API SpeechRecognition. Start when user holds button, stop when release
 * or after silenceTimeoutMs of no speech (auto-submit). stopListening() resolves with the final transcript.
 */
export function useSpeechRecognition(options = {}) {
  const silenceTimeoutMs = options.silenceTimeoutMs ?? DEFAULT_SILENCE_MS;
  const onSilenceRef = useRef(options.onSilence);
  onSilenceRef.current = options.onSilence;
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState(null);
  const [interimTranscript, setInterimTranscript] = useState("");
  const recognitionRef = useRef(null);
  const resolveRef = useRef(null);
  const finalRef = useRef("");
  const interimAccumRef = useRef("");
  const silenceTimerRef = useRef(null);

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  const startListening = useCallback(() => {
    setError(null);
    setInterimTranscript("");
    finalRef.current = "";
    interimAccumRef.current = "";
    clearSilenceTimer();

    const SpeechRecognition = typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);
    if (!SpeechRecognition) {
      setError("Speech recognition is not supported. Try Chrome or Edge.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      const results = event.results;
      let fullFinal = "";
      let currentInterim = "";
      for (let i = 0; i < results.length; i++) {
        const transcript = results[i][0].transcript;
        if (results[i].isFinal) {
          fullFinal += transcript;
          currentInterim = "";
        } else {
          currentInterim = transcript;
        }
      }
      if (fullFinal.length > 0) finalRef.current = fullFinal;
      interimAccumRef.current = currentInterim;
      setInterimTranscript((finalRef.current + interimAccumRef.current).trim());

      // Auto-stop after silence: reset timer on each result; when it fires, notify and stop
      clearSilenceTimer();
      silenceTimerRef.current = setTimeout(() => {
        silenceTimerRef.current = null;
        const result = (finalRef.current + interimAccumRef.current).trim();
        if (result && onSilenceRef.current) onSilenceRef.current(result);
        try {
          if (recognitionRef.current) recognitionRef.current.stop();
        } catch (_) {}
      }, silenceTimeoutMs);
    };

    recognition.onend = () => {
      clearSilenceTimer();
      setIsListening(false);
      const result = (finalRef.current + interimAccumRef.current).trim();
      if (resolveRef.current) {
        resolveRef.current(result);
        resolveRef.current = null;
      }
    };

    recognition.onerror = (event) => {
      clearSilenceTimer();
      if (event.error === "no-speech") return;
      // "aborted" is expected when we intentionally stop (mute, process turn) — don't show as error so turn-taking continues
      if (event.error === "aborted") {
        setIsListening(false);
        if (resolveRef.current) {
          resolveRef.current((finalRef.current + interimAccumRef.current).trim());
          resolveRef.current = null;
        }
        return;
      }
      setError(event.error === "not-allowed" ? "Microphone access was denied." : `Error: ${event.error}`);
      setIsListening(false);
      if (resolveRef.current) {
        resolveRef.current("");
        resolveRef.current = null;
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, []);

  const stopListening = useCallback(() => {
    clearSilenceTimer();
    return new Promise((resolve) => {
      const rec = recognitionRef.current;
      if (!rec) {
        resolve("");
        return;
      }
      resolveRef.current = resolve;
      try {
        rec.stop();
      } catch {
        const result = (finalRef.current + interimAccumRef.current).trim();
        resolve(result);
        resolveRef.current = null;
      }
    });
  }, [clearSilenceTimer]);

  return { startListening, stopListening, interimTranscript, isListening, error };
}
