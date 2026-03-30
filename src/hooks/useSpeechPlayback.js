"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { loadVoices, pickVoiceForProfile } from "@/lib/voices";

function normalizeForSpeech(text) {
  return String(text || "")
    .replace(/\u2026/g, ".") // ellipsis
    .replace(/\.{3,}/g, ".")
    .replace(/[—–]/g, ",") // em/en dash -> short pause
    .replace(/\s*\n+\s*/g, " ") // newlines -> spaces
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * TTS: ElevenLabs API when configured (POST /api/tts). When server says configured we never use browser voice.
 */
export function useSpeechPlayback(voiceProfileId = "female", outputDeviceId = "") {
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState(null);
  const [voicesReady, setVoicesReady] = useState(false);
  const [useElevenLabs, setUseElevenLabs] = useState(null); // null = unknown, true/false after first request
  const elevenLabsConfiguredRef = useRef(false);
  const utteranceRef = useRef(null);
  const voiceRef = useRef(null);
  const audioRef = useRef(null);
  const resolveSpeakRef = useRef(null);

  useEffect(() => {
    loadVoices().then((voices) => {
      const picked = pickVoiceForProfile(voiceProfileId, voices);
      voiceRef.current = picked;
      setVoicesReady(true);
    });
  }, [voiceProfileId]);

  useEffect(() => {
    fetch("/api/tts/status")
      .then((r) => r.json())
      .then((data) => { if (data?.configured) elevenLabsConfiguredRef.current = true; })
      .catch(() => {});
  }, []);

  const speakWithWebSpeech = useCallback(
    (text, voiceProfile) => {
      return new Promise((resolve) => {
        if (!text || typeof window === "undefined" || !window.speechSynthesis) {
          resolve();
          return;
        }
        window.speechSynthesis.cancel();
        const rate = Math.min(1.1, Math.max(0.85, (voiceProfile?.speed ?? 1)));
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = rate;
        utterance.pitch = 1;
        if (voiceRef.current) utterance.voice = voiceRef.current;
        utterance.volume = 1;
        utterance.onend = () => {
          setIsPlaying(false);
          resolve();
        };
        utterance.onerror = () => {
          setIsPlaying(false);
          setError("Playback failed");
          resolve();
        };
        utteranceRef.current = utterance;
        setIsPlaying(true);
        setError(null);
        window.speechSynthesis.speak(utterance);
      });
    },
    [voiceProfileId]
  );

  const speak = useCallback(
    async (text, voiceProfile = {}) => {
      if (!text || typeof window === "undefined") return;

      const speakText = normalizeForSpeech(text);
      if (!speakText) return;

      window.speechSynthesis?.cancel();
      if (audioRef.current) {
        try {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        } catch (_) {}
        audioRef.current = null;
      }

      const profileId = (voiceProfile && voiceProfile.id) ? voiceProfile.id : voiceProfileId;

      // Try ElevenLabs first (unless we already know it's disabled)
      if (useElevenLabs !== false) {
        try {
          const res = await fetch("/api/tts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              text: speakText,
              profileId,
              // More expressive voice (still controlled; not cartoonish)
              stability: 0.35,
              similarity_boost: 0.78,
              style: 0.45,
            }),
          });

          const contentType = (res.headers.get("content-type") || "").toLowerCase();
          if (res.ok && (contentType.includes("audio") || contentType.includes("mpeg"))) {
            setUseElevenLabs(true);
            const blob = await res.blob();
            if (blob.size === 0) {
              setError("Empty audio from ElevenLabs");
              if (!elevenLabsConfiguredRef.current) return speakWithWebSpeech(speakText, voiceProfile);
              return;
            }
            const url = URL.createObjectURL(blob);
            const audio = new Audio(url);
            audio.volume = 1;
            if (outputDeviceId && typeof audio.setSinkId === "function") {
              try {
                await audio.setSinkId(outputDeviceId);
              } catch (_) {}
            }
            audioRef.current = audio;
            setIsPlaying(true);
            setError(null);
            await new Promise((resolve, reject) => {
              resolveSpeakRef.current = resolve;
              audio.onended = () => {
                resolveSpeakRef.current = null;
                URL.revokeObjectURL(url);
                audioRef.current = null;
                setIsPlaying(false);
                resolve();
              };
              audio.onerror = () => {
                resolveSpeakRef.current = null;
                URL.revokeObjectURL(url);
                audioRef.current = null;
                setIsPlaying(false);
                setError("Playback failed");
                resolve();
              };
              audio.play().catch(reject);
            });
            return;
          }

          if (res.status === 503 || res.status === 401) {
            setUseElevenLabs(false);
          }
          if (!res.ok) {
            try {
              const text = await res.text();
              const errBody = text ? JSON.parse(text) : {};
              setError(errBody.details || errBody.error || `TTS failed (${res.status})`);
            } catch (_) {
              setError(`TTS failed (${res.status})`);
            }
          } else {
            setError("TTS failed");
          }
          if (!elevenLabsConfiguredRef.current) return speakWithWebSpeech(speakText, voiceProfile);
          return;
        } catch (e) {
          setError(e?.message || "TTS error");
          if (!elevenLabsConfiguredRef.current) return speakWithWebSpeech(speakText, voiceProfile);
          return;
        }
      }

      return speakWithWebSpeech(speakText, voiceProfile);
    },
    [voiceProfileId, useElevenLabs, speakWithWebSpeech, outputDeviceId]
  );

  const stop = useCallback(() => {
    if (typeof window !== "undefined") {
      window.speechSynthesis?.cancel();
      if (audioRef.current) {
        try {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        } catch (_) {}
        audioRef.current = null;
      }
      if (resolveSpeakRef.current) {
        resolveSpeakRef.current();
        resolveSpeakRef.current = null;
      }
      setIsPlaying(false);
    }
  }, []);

  return { speak, stop, isPlaying, error, voicesReady, useElevenLabs };
}
