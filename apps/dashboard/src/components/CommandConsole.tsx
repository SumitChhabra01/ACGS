"use client";

import { useRef, useState } from "react";
import { Mic, MicOff, SendHorizonal, TerminalSquare } from "lucide-react";
import { isPublicDemo } from "@/lib/site";
import { cn } from "@/lib/utils";

type LogEntry = { id: string; source: "text" | "voice"; text: string; reply: string };

const SUGGESTIONS = [
  "Generate 5 Instagram captions on AI agents",
  "Analyze latest YouTube trends",
  "Show analytics dashboard",
  "Pause publishing",
];

export function CommandConsole() {
  const [value, setValue] = useState("");
  const [log, setLog] = useState<LogEntry[]>([]);
  const [listening, setListening] = useState(false);
  const [busy, setBusy] = useState(false);
  const recogRef = useRef<unknown>(null);

  async function submit(text: string, source: "text" | "voice") {
    const cmd = text.trim();
    if (!cmd || busy) return;
    setBusy(true);
    setValue("");
    if (isPublicDemo) {
      setLog((l) => [
        {
          id: crypto.randomUUID(),
          source,
          text: cmd,
          reply:
            "Public demo only — commands run in the full app (local or Vercel). Clone the repo to try agents.",
        },
        ...l,
      ]);
      setBusy(false);
      return;
    }
    try {
      const res = await fetch("/api/commands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ raw: cmd, source }),
      });
      const data = (await res.json()) as { reply?: string };
      setLog((l) => [
        { id: crypto.randomUUID(), source, text: cmd, reply: data.reply ?? "Queued." },
        ...l,
      ]);
    } catch {
      setLog((l) => [
        { id: crypto.randomUUID(), source, text: cmd, reply: "Failed to reach command API." },
        ...l,
      ]);
    } finally {
      setBusy(false);
    }
  }

  function toggleVoice() {
    const w = window as unknown as {
      webkitSpeechRecognition?: new () => SpeechRecognitionLike;
      SpeechRecognition?: new () => SpeechRecognitionLike;
    };
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) {
      setLog((l) => [
        { id: crypto.randomUUID(), source: "voice", text: "(voice)", reply: "Speech recognition not supported in this browser." },
        ...l,
      ]);
      return;
    }
    if (listening) {
      (recogRef.current as SpeechRecognitionLike | null)?.stop();
      setListening(false);
      return;
    }
    const recog = new Ctor();
    recog.lang = "en-US";
    recog.interimResults = false;
    recog.onresult = (e: SpeechResultLike) => {
      const transcript = e.results[0]?.[0]?.transcript ?? "";
      if (transcript) void submit(transcript, "voice");
    };
    recog.onend = () => setListening(false);
    recog.start();
    recogRef.current = recog;
    setListening(true);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <TerminalSquare className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neon-cyan" />
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit(value, "text")}
            placeholder="Type a command, e.g. 'Generate 5 LinkedIn posts on AI agents'"
            className="w-full rounded-xl border border-white/10 bg-bg-soft/70 py-3 pl-10 pr-3 font-mono text-sm text-ink outline-none transition-colors placeholder:text-ink-faint focus:border-neon-cyan/60"
          />
        </div>
        <button
          onClick={toggleVoice}
          aria-label="Toggle voice command"
          className={cn(
            "grid h-12 w-12 place-items-center rounded-xl border transition-all",
            listening
              ? "animate-pulseGlow border-neon-pink/60 bg-neon-pink/10 text-neon-pink shadow-glow shadow-neon-pink"
              : "border-white/10 bg-white/5 text-ink-dim hover:text-ink",
          )}
        >
          {listening ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
        </button>
        <button
          onClick={() => submit(value, "text")}
          disabled={busy}
          aria-label="Send command"
          className="grid h-12 w-12 place-items-center rounded-xl border border-neon-cyan/40 bg-neon-cyan/10 text-neon-cyan transition-all hover:bg-neon-cyan/20 disabled:opacity-40"
        >
          <SendHorizonal className="h-5 w-5" />
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => submit(s, "text")}
            className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-ink-dim transition-colors hover:border-neon-cyan/40 hover:text-ink"
          >
            {s}
          </button>
        ))}
      </div>

      {log.length > 0 && (
        <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
          {log.map((e) => (
            <div key={e.id} className="rounded-xl border border-white/5 bg-bg-soft/50 p-3">
              <div className="flex items-center gap-2 font-mono text-xs text-neon-cyan">
                <span className="text-ink-faint">[{e.source}]</span>
                {e.text}
              </div>
              <div className="mt-1 text-xs text-ink-dim">{e.reply}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface SpeechResultLike {
  results: { [index: number]: { [index: number]: { transcript: string } } };
}
interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  onresult: (e: SpeechResultLike) => void;
  onend: () => void;
  start: () => void;
  stop: () => void;
}
