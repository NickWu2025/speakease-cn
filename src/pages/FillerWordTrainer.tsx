import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Mic, RotateCcw, Keyboard } from "lucide-react";

// ── Filler word lists ─────────────────────────────────────────────────
const MULTI_FILLERS = ["you know", "kind of", "sort of", "i mean"];
const SINGLE_FILLERS = ["um", "uh", "like", "basically", "literally", "actually", "right", "so", "well"];
const ALL_FILLERS = [...MULTI_FILLERS, ...SINGLE_FILLERS];

function countFillers(text: string): Record<string, number> {
  const lower = text.toLowerCase();
  const counts: Record<string, number> = {};
  for (const filler of ALL_FILLERS) {
    const escaped = filler.replace(/ /g, "\\s+");
    const matches = lower.match(new RegExp(`\\b${escaped}\\b`, "g"));
    if (matches?.length) counts[filler] = (counts[filler] ?? 0) + matches.length;
  }
  return counts;
}

function totalCount(counts: Record<string, number>) {
  return Object.values(counts).reduce((s, v) => s + v, 0);
}

function HighlightedText({ text }: { text: string }) {
  const sorted = [...ALL_FILLERS].sort((a, b) => b.length - a.length);
  const pattern = sorted.map((f) => f.replace(/ /g, "\\s+")).join("|");
  const re = new RegExp(`\\b(${pattern})\\b`, "gi");
  const parts: { text: string; filler: boolean }[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push({ text: text.slice(last, m.index), filler: false });
    parts.push({ text: m[0], filler: true });
    last = re.lastIndex;
  }
  if (last < text.length) parts.push({ text: text.slice(last), filler: false });
  return (
    <span>
      {parts.map((p, i) =>
        p.filler ? (
          <mark key={i} className="bg-rose-100 text-rose-700 rounded px-0.5 font-semibold not-italic">
            {p.text}
          </mark>
        ) : (
          <span key={i}>{p.text}</span>
        )
      )}
    </span>
  );
}

function getScore(total: number) {
  if (total === 0)  return { label: "Perfect!",       emoji: "🏆", desc: "Zero fillers — exceptional clarity.",                     cls: "bg-green-50 border-green-200 text-green-800" };
  if (total <= 3)   return { label: "Excellent!",     emoji: "🌟", desc: "Very low filler usage. Well controlled.",                  cls: "bg-green-50 border-green-200 text-green-800" };
  if (total <= 8)   return { label: "Good progress",  emoji: "👍", desc: "Noticed some fillers — keep practising mindfully.",        cls: "bg-amber-50 border-amber-200 text-amber-800" };
  return              { label: "Keep at it!",       emoji: "💪", desc: "Lots of fillers caught — awareness is the first step!",   cls: "bg-rose-50 border-rose-200 text-rose-800" };
}

const SESSION_DURATION = 60;
type Phase = "idle" | "running" | "done";

const FillerWordTrainer = () => {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>("idle");
  const [timeLeft, setTimeLeft] = useState(SESSION_DURATION);
  const [finalTranscript, setFinalTranscript] = useState("");
  const [interimText, setInterimText] = useState("");
  const [fillerCounts, setFillerCounts] = useState<Record<string, number>>({});
  const [mode, setMode] = useState<"voice" | "text">(
    () => (typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)) ? "voice" : "text"
  );
  const [typedText, setTypedText] = useState("");
  const recognitionRef = useRef<any>(null);
  const phaseRef = useRef<Phase>("idle");
  phaseRef.current = phase;

  // Countdown timer
  useEffect(() => {
    if (phase !== "running") return;
    const id = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) { setPhase("done"); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [phase]);

  // Stop recognition when session ends
  useEffect(() => {
    if (phase === "done" && recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
  }, [phase]);

  const startRecognition = () => {
    const Rec: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!Rec) return;

    const recognition = new Rec();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: any) => {
      let newFinal = "";
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) newFinal += t + " ";
        else interim += t;
      }
      if (newFinal) {
        setFinalTranscript((prev) => prev + newFinal);
        const newCounts = countFillers(newFinal);
        setFillerCounts((prev) => {
          const merged = { ...prev };
          for (const [k, v] of Object.entries(newCounts)) merged[k] = (merged[k] ?? 0) + v;
          return merged;
        });
      }
      setInterimText(interim);
    };

    recognition.onend = () => {
      if (phaseRef.current === "running") {
        try { recognition.start(); } catch {}
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error !== "no-speech" && event.error !== "aborted") {
        console.warn("Speech recognition error:", event.error);
      }
    };

    recognition.start();
    recognitionRef.current = recognition;
  };

  const startSession = () => {
    setPhase("running");
    setTimeLeft(SESSION_DURATION);
    setFinalTranscript("");
    setInterimText("");
    setFillerCounts({});
    startRecognition();
  };

  const resetSession = () => {
    if (recognitionRef.current) { recognitionRef.current.stop(); recognitionRef.current = null; }
    setPhase("idle");
    setTimeLeft(SESSION_DURATION);
    setFinalTranscript("");
    setInterimText("");
    setFillerCounts({});
    setTypedText("");
  };

  const analyzeTypedText = () => {
    const text = typedText.trim();
    if (!text) return;
    setFinalTranscript(text);
    setFillerCounts(countFillers(text));
    setPhase("done");
  };

  const total = totalCount(fillerCounts);
  const score = getScore(total);
  const timerPct = ((SESSION_DURATION - timeLeft) / SESSION_DURATION) * 100;

  return (
    <div className="min-h-screen gradient-warm flex flex-col">
      <div className="pt-14 pb-4 px-6">
        <button
          onClick={() => { resetSession(); navigate("/warmup"); }}
          className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors mb-6 -ml-1"
        >
          <ArrowLeft className="w-[18px] h-[18px]" />
          <span className="text-[13px] font-medium">Warm-up Game</span>
        </button>
        <div className="flex items-center gap-3">
          <h1 className="text-[1.35rem] font-heading font-bold text-foreground">
            Filler Word Trainer 🚫
          </h1>
          {phase === "running" && (
            <span className="relative flex h-2 w-2 ml-0.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
            </span>
          )}
        </div>
        <p className="text-[13px] text-muted-foreground mt-0.5">
          {phase === "idle"    ? "Catch your 'um', 'like' & 'you know' in real time" :
           phase === "running" ? "Speak naturally — your fillers are being counted" :
           "Here's how you did"}
        </p>
      </div>

      <div className="px-5 flex-1 flex flex-col gap-4 max-w-md mx-auto w-full pb-10">
        {/* ── Idle ── */}
        {phase === "idle" && (
          <>
            <div className="rounded-2xl bg-rose-50 border border-rose-100 p-5">
              <h2 className="text-[14px] font-heading font-bold text-rose-800 mb-3">How it works</h2>
              <div className="space-y-2.5">
                {[
                  { emoji: "🎤", text: "Tap Start and speak for 60 seconds about any topic" },
                  { emoji: "🔍", text: "We detect fillers like 'um', 'uh', 'like', 'you know'" },
                  { emoji: "📊", text: "See a live count and highlighted transcript as you speak" },
                  { emoji: "🏆", text: "Goal: fewer than 4 fillers per minute" },
                ].map((s, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <span className="text-base">{s.emoji}</span>
                    <p className="text-[13px] text-rose-700 leading-snug">{s.text}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl bg-card border border-border/50 p-4">
              <p className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">
                Fillers we catch
              </p>
              <div className="flex flex-wrap gap-1.5">
                {ALL_FILLERS.map((w) => (
                  <span key={w} className="text-[11px] bg-rose-50 text-rose-600 border border-rose-100 rounded-full px-2.5 py-1 font-medium">
                    {w}
                  </span>
                ))}
              </div>
            </div>

            {mode === "voice" ? (
              <button
                onClick={startSession}
                className="gradient-primary text-primary-foreground px-8 py-3.5 rounded-full font-semibold shadow-glow-primary hover:shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <Mic className="w-4 h-4" />
                Start 60-Second Challenge
              </button>
            ) : (
              <div className="flex flex-col gap-3">
                <textarea
                  value={typedText}
                  onChange={(e) => setTypedText(e.target.value)}
                  placeholder="Type or paste what you'd say out loud…"
                  rows={5}
                  className="w-full rounded-2xl border-2 border-border/50 bg-card px-4 py-3 text-[14px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/60 resize-none"
                />
                <button
                  onClick={analyzeTypedText}
                  disabled={!typedText.trim()}
                  className="gradient-primary text-primary-foreground px-8 py-3.5 rounded-full font-semibold shadow-glow-primary hover:shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Analyze My Text
                </button>
              </div>
            )}

            <button
              onClick={() => setMode((m) => (m === "voice" ? "text" : "voice"))}
              className="flex items-center justify-center gap-1.5 text-[12px] font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              {mode === "voice" ? (
                <>
                  <Keyboard className="w-3.5 h-3.5" /> Type instead
                </>
              ) : (
                <>
                  <Mic className="w-3.5 h-3.5" /> Speak instead
                </>
              )}
            </button>
          </>
        )}

        {/* ── Running ── */}
        {phase === "running" && (
          <>
            {/* Stats row */}
            <div className="flex gap-3">
              <div className="flex-1 rounded-2xl bg-card border border-border/50 p-4 flex flex-col items-center">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Time Left</p>
                <p className="text-[38px] font-heading font-bold text-foreground leading-none mt-1">
                  {timeLeft}<span className="text-[14px] text-muted-foreground font-normal ml-0.5">s</span>
                </p>
                <div className="w-full mt-2 bg-muted/50 rounded-full h-1">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-1000"
                    style={{ width: `${timerPct}%` }}
                  />
                </div>
              </div>
              <div className={`flex-1 rounded-2xl border p-4 flex flex-col items-center transition-colors ${
                total === 0 ? "bg-green-50 border-green-200" :
                total <= 3  ? "bg-amber-50 border-amber-200" :
                              "bg-rose-50 border-rose-200"
              }`}>
                <p className={`text-[10px] font-semibold uppercase tracking-wider ${
                  total === 0 ? "text-green-600" : total <= 3 ? "text-amber-600" : "text-rose-600"
                }`}>Fillers Caught</p>
                <p className={`text-[38px] font-heading font-bold leading-none mt-1 ${
                  total === 0 ? "text-green-700" : total <= 3 ? "text-amber-700" : "text-rose-700"
                }`}>{total}</p>
                <p className={`text-[11px] mt-1 font-medium ${
                  total === 0 ? "text-green-500" : total <= 3 ? "text-amber-500" : "text-rose-500"
                }`}>
                  {total === 0 ? "Clean so far!" : total <= 3 ? "Nice control" : "Stay aware!"}
                </p>
              </div>
            </div>

            {/* Live transcript */}
            <div className="rounded-2xl bg-card border border-border/50 p-4 min-h-[120px]">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Live Transcript
              </p>
              <div className="text-[14px] leading-relaxed">
                {finalTranscript || interimText ? (
                  <>
                    <HighlightedText text={finalTranscript} />
                    <span className="text-muted-foreground/40 italic">{interimText}</span>
                  </>
                ) : (
                  <p className="text-muted-foreground/40 italic text-[13px]">Start speaking…</p>
                )}
              </div>
            </div>

            {/* Topic suggestion */}
            <div className="rounded-2xl bg-primary/5 border border-primary/10 p-3 flex items-center gap-2.5">
              <span className="text-lg">💬</span>
              <p className="text-[12px] text-foreground/70">
                <strong className="text-foreground">Try talking about:</strong> your daily routine, a recent trip, or your favourite show.
              </p>
            </div>
          </>
        )}

        {/* ── Done ── */}
        {phase === "done" && (
          <>
            {/* Score card */}
            <div className={`rounded-2xl border p-5 text-center ${score.cls}`}>
              <p className="text-[40px] mb-1">{score.emoji}</p>
              <p className="text-[20px] font-heading font-bold">{score.label}</p>
              <p className="text-[13px] mt-1 opacity-80">{score.desc}</p>
              <p className="mt-3 text-[30px] font-heading font-bold">
                {total}
                <span className="text-[14px] font-normal opacity-70"> filler{total !== 1 ? "s" : ""}{mode === "voice" ? " in 60s" : " found"}</span>
              </p>
            </div>

            {/* Per-word breakdown */}
            {total > 0 && (
              <div className="rounded-2xl bg-card border border-border/50 p-4">
                <p className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Breakdown
                </p>
                <div className="space-y-2.5">
                  {Object.entries(fillerCounts)
                    .sort(([, a], [, b]) => b - a)
                    .map(([word, count]) => (
                      <div key={word} className="flex items-center gap-3">
                        <span className="text-[13px] font-medium text-foreground w-24 shrink-0">"{word}"</span>
                        <div className="flex-1 bg-muted/40 rounded-full h-2">
                          <div
                            className="h-full rounded-full bg-rose-400"
                            style={{ width: `${Math.min(100, (count / total) * 100)}%` }}
                          />
                        </div>
                        <span className="text-[13px] font-bold text-rose-600 w-6 text-right shrink-0">{count}×</span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Full transcript */}
            {finalTranscript.trim() && (
              <div className="rounded-2xl bg-card border border-border/50 p-4">
                <p className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Full Transcript
                </p>
                <p className="text-[13px] leading-relaxed text-foreground">
                  <HighlightedText text={finalTranscript} />
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={resetSession}
                className="flex-1 py-3 rounded-full border border-border text-[14px] font-semibold text-foreground hover:bg-muted/50 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Try Again
              </button>
              <button
                onClick={() => navigate("/warmup")}
                className="flex-1 gradient-primary text-primary-foreground py-3 rounded-full text-[14px] font-semibold shadow-glow-primary hover:shadow-lg transition-all active:scale-95"
              >
                Done
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default FillerWordTrainer;
