import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Mic, RotateCcw, Keyboard } from "lucide-react";

// ── Filler word lists (Chinese) ──────────────────────────────────────
const MULTI_FILLERS = ["就是说", "然后呢", "那个什么", "怎么说呢"];
const SINGLE_FILLERS = ["嗯", "啊", "那个", "就是", "其实", "对吧", "所以", "然后", "呃"];
const ALL_FILLERS = [...MULTI_FILLERS, ...SINGLE_FILLERS];

function countFillers(text: string): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const filler of ALL_FILLERS) {
    let idx = 0;
    let c = 0;
    while (true) {
      const found = text.indexOf(filler, idx);
      if (found === -1) break;
      c++;
      idx = found + filler.length;
    }
    if (c > 0) counts[filler] = (counts[filler] ?? 0) + c;
  }
  return counts;
}

function totalCount(counts: Record<string, number>) {
  return Object.values(counts).reduce((s, v) => s + v, 0);
}

function HighlightedText({ text }: { text: string }) {
  const sorted = [...ALL_FILLERS].sort((a, b) => b.length - a.length);
  const parts: { text: string; filler: boolean }[] = [];
  let remaining = text;
  while (remaining.length > 0) {
    let earliestIdx = remaining.length;
    let earliestFiller = "";
    for (const filler of sorted) {
      const idx = remaining.indexOf(filler);
      if (idx !== -1 && idx < earliestIdx) {
        earliestIdx = idx;
        earliestFiller = filler;
      }
    }
    if (earliestFiller) {
      if (earliestIdx > 0) parts.push({ text: remaining.slice(0, earliestIdx), filler: false });
      parts.push({ text: remaining.slice(earliestIdx, earliestIdx + earliestFiller.length), filler: true });
      remaining = remaining.slice(earliestIdx + earliestFiller.length);
    } else {
      parts.push({ text: remaining, filler: false });
      break;
    }
  }
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
  if (total === 0)  return { label: "完美！",       emoji: "🏆", desc: "零口头禅 — 表达极其清晰。",                     cls: "bg-green-50 border-green-200 text-green-800" };
  if (total <= 3)   return { label: "优秀！",     emoji: "🌟", desc: "口头禅非常少，控制得很好。",                  cls: "bg-green-50 border-green-200 text-green-800" };
  if (total <= 8)   return { label: "不错",  emoji: "👍", desc: "发现了一些口头禅 — 继续有意识地练习。",        cls: "bg-amber-50 border-amber-200 text-amber-800" };
  return              { label: "继续加油！",       emoji: "💪", desc: "检测到不少口头禅 — 意识到问题就是进步的第一步！",   cls: "bg-rose-50 border-rose-200 text-rose-800" };
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
    recognition.lang = "zh-CN";

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
          <span className="text-[13px] font-medium">热身练习</span>
        </button>
        <div className="flex items-center gap-3">
          <h1 className="text-[1.35rem] font-heading font-bold text-foreground">
            口头禅检测 🚫
          </h1>
          {phase === "running" && (
            <span className="relative flex h-2 w-2 ml-0.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
            </span>
          )}
        </div>
        <p className="text-[13px] text-muted-foreground mt-0.5">
          {phase === "idle"    ? '实时检测"嗯"、"那个"、"就是说"等口头禅' :
           phase === "running" ? "自然地说 — 你的口头禅正在被统计" :
           "这是你的结果"}
        </p>
      </div>

      <div className="px-5 flex-1 flex flex-col gap-4 max-w-md mx-auto w-full pb-10">
        {/* ── Idle ── */}
        {phase === "idle" && (
          <>
            <div className="rounded-2xl bg-rose-50 border border-rose-100 p-5">
              <h2 className="text-[14px] font-heading font-bold text-rose-800 mb-3">练习方式</h2>
              <div className="space-y-2.5">
                {[
                  { emoji: "🎤", text: "点击开始，就任意话题说 60 秒" },
                  { emoji: "🔍", text: '我们会检测"嗯"、"啊"、"那个"、"就是说"等口头禅' },
                  { emoji: "📊", text: "说话时实时统计数量并高亮显示" },
                  { emoji: "🏆", text: "目标：每分钟少于 4 个口头禅" },
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
                检测的口头禅
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
                开始 60 秒挑战
              </button>
            ) : (
              <div className="flex flex-col gap-3">
                <textarea
                  value={typedText}
                  onChange={(e) => setTypedText(e.target.value)}
                  placeholder="输入或粘贴你想说的话…"
                  rows={5}
                  className="w-full rounded-2xl border-2 border-border/50 bg-card px-4 py-3 text-[14px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/60 resize-none"
                />
                <button
                  onClick={analyzeTypedText}
                  disabled={!typedText.trim()}
                  className="gradient-primary text-primary-foreground px-8 py-3.5 rounded-full font-semibold shadow-glow-primary hover:shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  分析我的文字
                </button>
              </div>
            )}

            <button
              onClick={() => setMode((m) => (m === "voice" ? "text" : "voice"))}
              className="flex items-center justify-center gap-1.5 text-[12px] font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              {mode === "voice" ? (
                <>
                  <Keyboard className="w-3.5 h-3.5" /> 改用文字输入
                </>
              ) : (
                <>
                  <Mic className="w-3.5 h-3.5" /> 改用语音输入
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
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">剩余时间</p>
                <p className="text-[38px] font-heading font-bold text-foreground leading-none mt-1">
                  {timeLeft}<span className="text-[14px] text-muted-foreground font-normal ml-0.5">秒</span>
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
                }`}>检测到的口头禅</p>
                <p className={`text-[38px] font-heading font-bold leading-none mt-1 ${
                  total === 0 ? "text-green-700" : total <= 3 ? "text-amber-700" : "text-rose-700"
                }`}>{total}</p>
                <p className={`text-[11px] mt-1 font-medium ${
                  total === 0 ? "text-green-500" : total <= 3 ? "text-amber-500" : "text-rose-500"
                }`}>
                  {total === 0 ? "目前很干净！" : total <= 3 ? "控制得不错" : "保持意识！"}
                </p>
              </div>
            </div>

            {/* Live transcript */}
            <div className="rounded-2xl bg-card border border-border/50 p-4 min-h-[120px]">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                实时转写
              </p>
              <div className="text-[14px] leading-relaxed">
                {finalTranscript || interimText ? (
                  <>
                    <HighlightedText text={finalTranscript} />
                    <span className="text-muted-foreground/40 italic">{interimText}</span>
                  </>
                ) : (
                  <p className="text-muted-foreground/40 italic text-[13px]">开始说话…</p>
                )}
              </div>
            </div>

            {/* Topic suggestion */}
            <div className="rounded-2xl bg-primary/5 border border-primary/10 p-3 flex items-center gap-2.5">
              <span className="text-lg">💬</span>
              <p className="text-[12px] text-foreground/70">
                <strong className="text-foreground">试试聊：</strong>你的日常工作、最近的一次旅行、或者你喜欢的节目。
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
                <span className="text-[14px] font-normal opacity-70"> 个口头禅{mode === "voice" ? "（60 秒内）" : ""}</span>
              </p>
            </div>

            {/* Per-word breakdown */}
            {total > 0 && (
              <div className="rounded-2xl bg-card border border-border/50 p-4">
                <p className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  详细统计
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
                        <span className="text-[13px] font-bold text-rose-600 w-6 text-right shrink-0">{count}次</span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Full transcript */}
            {finalTranscript.trim() && (
              <div className="rounded-2xl bg-card border border-border/50 p-4">
                <p className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  完整转写
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
                再来一次
              </button>
              <button
                onClick={() => navigate("/warmup")}
                className="flex-1 gradient-primary text-primary-foreground py-3 rounded-full text-[14px] font-semibold shadow-glow-primary hover:shadow-lg transition-all active:scale-95"
              >
                完成
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default FillerWordTrainer;