import { useState } from "react";

export default function SessionCodeDisplay({ code, label = "Session Code" }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  return (
    <div className="bg-gradient-to-br from-brand-500 to-brand-700 rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-soft text-white text-center">
      <p className="text-brand-100 uppercase text-[10px] sm:text-xs font-bold tracking-widest mb-2 sm:mb-3">
        {label}
      </p>
      <div className="font-mono font-extrabold tracking-[0.2em] xs:tracking-[0.3em] sm:tracking-[0.4em] text-center text-3xl xs:text-4xl sm:text-5xl md:text-6xl mb-4 select-all break-all">
        {code}
      </div>
      <button
        onClick={copy}
        className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 transition rounded-xl px-4 py-2 text-sm font-semibold backdrop-blur"
      >
        {copied ? (
          <>
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
            Copied!
          </>
        ) : (
          <>
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            Copy code
          </>
        )}
      </button>
      <p className="text-brand-100 text-sm mt-4">
        Share this code with your students to join.
      </p>
    </div>
  );
}
