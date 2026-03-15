"use client";

import { useState } from "react";

export default function CollapsibleSection({ title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-gray-200 last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between py-4 text-left font-semibold text-gray-900 hover:text-calm-700 transition"
      >
        {title}
        <span className={`text-calm-600 transition-transform ${open ? "rotate-180" : ""}`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
        </span>
      </button>
      {open && <div className="pb-4 text-gray-600 text-sm leading-relaxed">{children}</div>}
    </div>
  );
}
