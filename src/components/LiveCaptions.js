"use client";

import { useEffect, useState, useRef } from "react";

const TYPING_MS_PER_WORD = 60;
const CURSOR_BLINK_MS = 530;

/**
 * Live captions: as you speak, all your words stay and build (I → I am → I'm doing great).
 * As she speaks, all her words stay and build (Great Leo → Great Leo, what's → ...). Nothing goes missing.
 */
export default function LiveCaptions({ conversation, state, interimTranscript = "", className = "" }) {
  const [displayedWordCount, setDisplayedWordCount] = useState(0);
  const [cursorVisible, setCursorVisible] = useState(true);
  const lastMessageIdRef = useRef(null);
  const intervalRef = useRef(null);
  const userTranscriptMaxRef = useRef("");

  const lastMessage = conversation.length > 0 ? conversation[conversation.length - 1] : null;
  const isUserSpeaking = typeof interimTranscript === "string" && interimTranscript.trim().length > 0;
  const isThinking = state === "thinking";

  useEffect(() => {
    if (!isUserSpeaking) userTranscriptMaxRef.current = "";
  }, [isUserSpeaking]);

  const target = lastMessage?.text ?? "";
  const targetWords = target ? target.trim().split(/\s+/).filter(Boolean) : [];
  const messageId = lastMessage ? `${conversation.length}-${lastMessage.role}` : null;

  useEffect(() => {
    if (messageId !== lastMessageIdRef.current) {
      lastMessageIdRef.current = messageId;
      setDisplayedWordCount(1);
    }
  }, [messageId]);

  // Word-by-word reveal for her message — start at 1 so first word shows immediately (no empty flash)
  useEffect(() => {
    const isHerTurn = lastMessage?.role === "assistant";
    const isSpeakingNow = state === "speaking";

    if (!targetWords.length) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
      return;
    }
    // Only animate while Nora is actively speaking; if user interrupts (state changes),
    // freeze the caption where it is.
    if (!isHerTurn || !isSpeakingNow) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
      return;
    }
    if (displayedWordCount >= targetWords.length) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
      return;
    }
    if (intervalRef.current) clearInterval(intervalRef.current);
    const id = setInterval(() => {
      setDisplayedWordCount((prev) => Math.min(prev + 1, targetWords.length));
    }, TYPING_MS_PER_WORD);
    intervalRef.current = id;
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
    };
  }, [lastMessage?.role, state, target, displayedWordCount, targetWords.length]);

  useEffect(() => {
    const id = setInterval(() => setCursorVisible((v) => !v), CURSOR_BLINK_MS);
    return () => clearInterval(id);
  }, []);

  const herTextToShow = targetWords.slice(0, displayedWordCount).join(" ");
  const showCursor = displayedWordCount < targetWords.length;

  // You: show all words as they build — keep longest so we never show only last 2 words
  if (isUserSpeaking) {
    const raw = (typeof interimTranscript === "string" ? interimTranscript : "").trim();
    if (raw.length >= userTranscriptMaxRef.current.length) userTranscriptMaxRef.current = raw;
    const yourText = userTranscriptMaxRef.current;
    return (
      <div className={`rounded-2xl border border-gray-200/80 bg-black/5 px-5 py-4 ${className}`}>
        <p className="text-lg sm:text-xl text-gray-900 leading-snug min-h-[2rem]">
          {yourText}
          {yourText && (
            <span className={cursorVisible ? "opacity-100" : "opacity-0"} aria-hidden>|</span>
          )}
        </p>
      </div>
    );
  }

  if (isThinking) {
    return (
      <div className={`rounded-2xl border border-gray-200/80 bg-black/5 px-5 py-4 ${className}`}>
        <p className="text-lg sm:text-xl text-gray-700 leading-snug min-h-[2rem]">
          Thinking...
          <span className={cursorVisible ? "opacity-100" : "opacity-0"} aria-hidden>|</span>
        </p>
      </div>
    );
  }

  if (!target) {
    return (
      <div className={`rounded-2xl border border-gray-200/80 bg-black/5 px-5 py-4 ${className}`}>
        <p className="text-sm text-gray-400">Say something — she&apos;s always listening.</p>
      </div>
    );
  }

  // Her: word-by-word so the sentence builds with full words only
  return (
    <div className={`rounded-2xl border border-gray-200/80 bg-black/5 px-5 py-4 ${className}`}>
      <p className="text-lg sm:text-xl text-gray-900 leading-snug min-h-[2rem]">
        {herTextToShow}
        {showCursor && (
          <span className={cursorVisible ? "opacity-100" : "opacity-0"} aria-hidden>|</span>
        )}
      </p>
    </div>
  );
}
