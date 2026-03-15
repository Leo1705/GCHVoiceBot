"use client";

const states = {
  idle: { label: "Ready", color: "text-gray-500", bg: "bg-gray-100" },
  listening: { label: "Listening…", color: "text-blue-600", bg: "bg-blue-100" },
  thinking: { label: "Thinking…", color: "text-amber-600", bg: "bg-amber-100" },
  speaking: { label: "Speaking…", color: "text-calm-600", bg: "bg-calm-100" },
  error: { label: "Something went wrong", color: "text-red-600", bg: "bg-red-100" },
};

export default function StateIndicator({ state = "idle" }) {
  const s = states[state] || states.idle;
  return (
    <div className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium ${s.bg} ${s.color} state-glow`}>
      <span className="h-2 w-2 rounded-full bg-current opacity-80" />
      {s.label}
    </div>
  );
}
