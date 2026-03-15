"use client";

import { useEffect, useRef } from "react";

export default function ConversationThread({ conversation, state, className = "" }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation]);

  const isThinking = state === "thinking";
  const isSpeaking = state === "speaking";

  if (conversation.length === 0 && !isThinking) {
    return (
      <div className={`flex flex-col justify-end rounded-xl border border-gray-200 bg-white/95 p-4 ${className}`}>
        <p className="text-sm text-gray-400">Hold the button and speak. Your conversation will appear here.</p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {conversation.map((msg, i) => (
        <div
          key={i}
          className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
        >
          <div
            className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
              msg.role === "user"
                ? "bg-calm-100 text-calm-900 rounded-br-md"
                : "bg-gray-100 text-gray-800 rounded-bl-md"
            }`}
          >
            {msg.text}
          </div>
        </div>
      ))}
      {isThinking && (
        <div className="flex justify-start">
          <div className="flex items-center gap-2 rounded-2xl rounded-bl-md bg-gray-100 px-4 py-2.5 text-sm text-gray-500">
            <span className="h-2 w-2 animate-pulse rounded-full bg-gray-400" />
            <span className="h-2 w-2 animate-pulse rounded-full bg-gray-400" style={{ animationDelay: "0.2s" }} />
            <span className="h-2 w-2 animate-pulse rounded-full bg-gray-400" style={{ animationDelay: "0.4s" }} />
          </div>
        </div>
      )}
      {isSpeaking && conversation.length > 0 && conversation[conversation.length - 1]?.role === "assistant" && (
        <div className="flex justify-start">
          <span className="text-xs text-calm-600">Speaking…</span>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}
