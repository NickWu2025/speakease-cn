import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Play, Pause, RotateCcw } from "lucide-react";

const TONGUE_TWISTERS = [
  { id: 1, difficulty: "easy",   text: "四是四，十是十，十四是十四，四十是四十。",                              times: 3 },
  { id: 2, difficulty: "easy",   text: "吃葡萄不吐葡萄皮，不吃葡萄倒吐葡萄皮。",                                times: 3 },
  { id: 3, difficulty: "medium", text: "黑化肥发灰会挥发，灰化肥挥发会发黑。",                                   times: 2 },
  { id: 4, difficulty: "medium", text: "牛郎恋刘娘，刘娘念牛郎，牛郎牛年恋刘娘。",                                times: 5 },
  { id: 5, difficulty: "hard",   text: "红鲤鱼与绿鲤鱼与驴。",                                                  times: 2 },
  { id: 6, difficulty: "hard",   text: "八百标兵奔北坡，炮兵并排北边跑。",                                      times: 3 },
] as const;

const DIFFICULTY_CLS = {
  easy:   "bg-green-100 text-green-700 border-green-200",
  medium: "bg-amber-100 text-amber-700 border-amber-200",
  hard:   "bg-rose-100 text-rose-700 border-rose-200",
};

const DIFFICULTY_LABEL = {
  easy: "简单",
  medium: "中等",
  hard: "困难",
};

const VOCAL_WARMUPS = [
  { emoji: "🎵", title: "唇颤音",      desc: "放松嘴唇，像摩托车一样发出嗡嗡声，在高低调之间滑动。",      duration: "20 秒" },
  { emoji: "🎶", title: "哼鸣练习",    desc: '发"嗯"音，从低到高滑动。感受嘴唇和鼻子的震动。',                 duration: "20 秒" },
  { emoji: "🔤", title: "元音滑动",   desc: '慢慢说"啊—呃—衣—哦—乌"，夸张每个嘴型。重复 5 次。',                    duration: "30 秒" },
  { emoji: "😶", title: "放松下巴",   desc: "像嚼大块口香糖一样活动下巴。夸张动作 15 秒。",                   duration: "15 秒" },
  { emoji: "🌬️", title: "气息支撑",   desc: '吸气 4 拍，然后在一口控制好的气息上尽可能长地发出"哈——"。',       duration: "30 秒" },
];

type BreathPhase = { label: string; count: number; color: string; scale: number };
const BREATH_PHASES: BreathPhase[] = [
  { label: "吸气",  count: 4, color: "text-blue-500",   scale: 1.18 },
  { label: "屏气",  count: 4, color: "text-violet-500", scale: 1.18 },
  { label: "呼气",  count: 4, color: "text-indigo-500", scale: 0.82 },
  { label: "屏气",  count: 4, color: "text-slate-500",  scale: 0.82 },
];

type Tab = "twisters" | "breathing" | "vocal";

const WarmupExercises = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("twisters");
  const [done, setDone] = useState<Set<number>>(new Set());

  // ── Breathing ────────────────────────────────────────────────────────
  const [breathRunning, setBreathRunning] = useState(false);
  const [breathState, setBreathState] = useState({ phaseIdx: 0, count: 4, cycles: 0 });
  const breathRef = useRef(breathState);
  breathRef.current = breathState;

  useEffect(() => {
    if (!breathRunning) return;
    const id = setInterval(() => {
      const { phaseIdx, count, cycles } = breathRef.current;
      if (count <= 1) {
        const nextIdx = (phaseIdx + 1) % BREATH_PHASES.length;
        const newCycles = nextIdx === 0 ? cycles + 1 : cycles;
        setBreathState({ phaseIdx: nextIdx, count: BREATH_PHASES[nextIdx].count, cycles: newCycles });
      } else {
        setBreathState(prev => ({ ...prev, count: prev.count - 1 }));
      }
    }, 1000);
    return () => clearInterval(id);
  }, [breathRunning]);

  const resetBreath = () => {
    setBreathRunning(false);
    setBreathState({ phaseIdx: 0, count: 4, cycles: 0 });
  };

  const currentPhase = BREATH_PHASES[breathState.phaseIdx];
  const circleScale = breathRunning ? currentPhase.scale : 1.0;

  return (
    <div className="min-h-screen gradient-warm flex flex-col">
      <div className="pt-14 pb-4 px-6">
        <button
          onClick={() => navigate("/warmup")}
          className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors mb-6 -ml-1"
        >
          <ArrowLeft className="w-[18px] h-[18px]" />
          <span className="text-[13px] font-medium">热身练习</span>
        </button>
        <h1 className="text-[1.35rem] font-heading font-bold text-foreground">
          热身练习 🎯
        </h1>
        <p className="text-[13px] text-muted-foreground mt-0.5">对话前的热身放松</p>
      </div>

      {/* Tab bar */}
      <div className="px-5 mb-3">
        <div className="flex gap-1.5 bg-muted/40 p-1 rounded-xl border border-border/40">
          {(["twisters", "breathing", "vocal"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-1.5 rounded-lg text-[12px] font-semibold transition-all ${
                tab === t ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t === "twisters" ? "绕口令" : t === "breathing" ? "呼吸" : "发声"}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 flex-1 flex flex-col gap-3 max-w-md mx-auto w-full pb-10">
        {/* ── Tongue Twisters ── */}
        {tab === "twisters" && (
          <>
            <p className="text-[12px] text-muted-foreground">
              完成后点击 ✓。尽量快速说完且不卡壳！
            </p>
            {TONGUE_TWISTERS.map((tt) => (
              <div
                key={tt.id}
                className={`rounded-2xl border p-4 shadow-soft transition-all ${
                  done.has(tt.id) ? "bg-green-50 border-green-100" : "bg-card border-border/50"
                }`}
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={() =>
                      setDone((prev) => {
                        const next = new Set(prev);
                        next.has(tt.id) ? next.delete(tt.id) : next.add(tt.id);
                        return next;
                      })
                    }
                    className="mt-0.5 shrink-0"
                  >
                    <CheckCircle2
                      className={`w-5 h-5 transition-colors ${
                        done.has(tt.id) ? "text-green-500" : "text-muted-foreground/30"
                      }`}
                    />
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`text-[14px] font-medium leading-snug ${
                      done.has(tt.id) ? "text-muted-foreground line-through decoration-muted-foreground/30" : "text-foreground"
                    }`}>
                      "{tt.text}"
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wide ${DIFFICULTY_CLS[tt.difficulty]}`}>
                        {DIFFICULTY_LABEL[tt.difficulty]}
                      </span>
                      <span className="text-[11px] text-muted-foreground">× {tt.times}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {done.size === TONGUE_TWISTERS.length && (
              <div className="rounded-2xl bg-green-50 border border-green-100 p-4 text-center">
                <p className="text-[15px] font-heading font-bold text-green-700">全部完成！🎉</p>
                <p className="text-[12px] text-green-600 mt-1">你的嘴巴已经热好，可以开始练习了。</p>
              </div>
            )}
          </>
        )}

        {/* ── Breathing ── */}
        {tab === "breathing" && (
          <div className="flex flex-col items-center gap-5 pt-2">
            <p className="text-[13px] text-muted-foreground text-center">
              方框呼吸法有助于平复紧张、稳定声音。<br />
              跟着圆圈的节奏 — 目标完成 4 个循环。
            </p>

            {/* Animated circle */}
            <div className="relative flex items-center justify-center h-56 w-56">
              {/* Outer pulse ring */}
              <div
                className="absolute rounded-full bg-primary/8 transition-all duration-[4000ms] ease-in-out"
                style={{ width: `${circleScale * 224}px`, height: `${circleScale * 224}px` }}
              />
              {/* Inner circle */}
              <div
                className={`absolute rounded-full border-2 flex flex-col items-center justify-center transition-all duration-[4000ms] ease-in-out
                  ${breathRunning
                    ? breathState.phaseIdx === 0 ? "bg-blue-50 border-blue-300"
                      : breathState.phaseIdx === 1 ? "bg-violet-50 border-violet-300"
                      : breathState.phaseIdx === 2 ? "bg-indigo-50 border-indigo-300"
                      : "bg-slate-50 border-slate-300"
                    : "bg-muted/20 border-border"
                  }`}
                style={{ width: `${circleScale * 160}px`, height: `${circleScale * 160}px` }}
              >
                {breathRunning ? (
                  <>
                    <p className={`text-[11px] font-semibold uppercase tracking-widest ${currentPhase.color}`}>
                      {currentPhase.label}
                    </p>
                    <p className={`text-[44px] font-heading font-bold leading-none ${currentPhase.color}`}>
                      {breathState.count}
                    </p>
                  </>
                ) : (
                  <p className="text-[14px] font-medium text-muted-foreground">
                    {breathState.cycles > 0 ? `${breathState.cycles} 个循环` : "准备开始"}
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setBreathRunning(r => !r)}
                className="flex items-center gap-2 gradient-primary text-primary-foreground px-6 py-2.5 rounded-full font-semibold shadow-glow-primary hover:shadow-lg transition-all active:scale-95"
              >
                {breathRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                {breathRunning ? "暂停" : breathState.cycles > 0 ? "继续" : "开始"}
              </button>
              {(breathState.cycles > 0 || breathRunning) && (
                <button
                  onClick={resetBreath}
                  className="p-2.5 rounded-full bg-muted hover:bg-muted/80 transition-colors"
                >
                  <RotateCcw className="w-4 h-4 text-muted-foreground" />
                </button>
              )}
            </div>

            {/* Phase guide */}
            <div className="w-full rounded-2xl bg-card border border-border/50 p-4">
              <p className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">
                方框呼吸法（4-4-4-4）
              </p>
              <div className="flex justify-between">
                {BREATH_PHASES.map((p, i) => (
                  <div
                    key={i}
                    className={`flex flex-col items-center gap-1 px-2 py-2 rounded-xl transition-all ${
                      breathRunning && breathState.phaseIdx === i ? "bg-primary/10 ring-1 ring-primary/20" : ""
                    }`}
                  >
                    <span className={`text-[10px] font-semibold uppercase tracking-wide ${
                      breathRunning && breathState.phaseIdx === i ? "text-primary" : "text-muted-foreground"
                    }`}>
                      {p.label}
                    </span>
                    <span className={`text-[24px] font-heading font-bold leading-none ${
                      breathRunning && breathState.phaseIdx === i ? "text-primary" : "text-muted-foreground/30"
                    }`}>
                      {p.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {breathState.cycles >= 4 && (
              <div className="w-full rounded-2xl bg-green-50 border border-green-100 p-4 text-center">
                <p className="text-[15px] font-heading font-bold text-green-700">做得好！🧘</p>
                <p className="text-[12px] text-green-600 mt-1">
                  {breathState.cycles} 个循环完成 — 你的声音已经稳定，准备开始。
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── Vocal ── */}
        {tab === "vocal" && (
          <>
            <p className="text-[12px] text-muted-foreground">
              这些练习可以热身你的声带，在说话前改善音质。
            </p>
            {VOCAL_WARMUPS.map((v, i) => (
              <div key={i} className="rounded-2xl bg-card border border-border/50 p-4 shadow-soft">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xl">{v.emoji}</span>
                  <h3 className="text-[15px] font-heading font-semibold text-foreground">{v.title}</h3>
                  <span className="ml-auto text-[11px] text-muted-foreground bg-muted rounded-full px-2.5 py-0.5">
                    {v.duration}
                  </span>
                </div>
                <p className="text-[13px] text-muted-foreground leading-snug pl-8">{v.desc}</p>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
};
export default WarmupExercises;