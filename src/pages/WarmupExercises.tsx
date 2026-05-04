import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Play, Pause, RotateCcw } from "lucide-react";

const TONGUE_TWISTERS = [
  { id: 1, difficulty: "easy",   text: "She sells seashells by the seashore.",                              times: 3 },
  { id: 2, difficulty: "easy",   text: "Peter Piper picked a peck of pickled peppers.",                     times: 3 },
  { id: 3, difficulty: "medium", text: "How much wood would a woodchuck chuck if a woodchuck could chuck wood?", times: 2 },
  { id: 4, difficulty: "medium", text: "Red lorry, yellow lorry. Red lorry, yellow lorry.",                 times: 5 },
  { id: 5, difficulty: "hard",   text: "The sixth sick sheikh's sixth sheep's sick.",                       times: 2 },
  { id: 6, difficulty: "hard",   text: "Unique New York, unique New York, you know you need unique New York.", times: 3 },
] as const;

const DIFFICULTY_CLS = {
  easy:   "bg-green-100 text-green-700 border-green-200",
  medium: "bg-amber-100 text-amber-700 border-amber-200",
  hard:   "bg-rose-100 text-rose-700 border-rose-200",
};

const VOCAL_WARMUPS = [
  { emoji: "🎵", title: "Lip Trill",      desc: "Blow air through relaxed lips making a motorboat sound. Glide up and down your pitch range.",      duration: "20 sec" },
  { emoji: "🎶", title: "Humming",        desc: "Hum 'mmm' starting low and sliding to high. Feel the buzz in your lips and nose.",                 duration: "20 sec" },
  { emoji: "🔤", title: "Vowel Slides",   desc: "Say A – E – I – O – U slowly, exaggerating each mouth shape. Repeat 5 times.",                    duration: "30 sec" },
  { emoji: "😶", title: "Jaw Loosener",   desc: "Chew like you have a big piece of gum. Exaggerate the movement for 15 seconds.",                   duration: "15 sec" },
  { emoji: "🌬️", title: "Breath Support", desc: "Breathe in for 4 counts, then sustain 'haaah' as long as possible on one controlled breath.",       duration: "30 sec" },
];

type BreathPhase = { label: string; count: number; color: string; scale: number };
const BREATH_PHASES: BreathPhase[] = [
  { label: "Inhale",  count: 4, color: "text-blue-500",   scale: 1.18 },
  { label: "Hold",    count: 4, color: "text-violet-500", scale: 1.18 },
  { label: "Exhale",  count: 4, color: "text-indigo-500", scale: 0.82 },
  { label: "Hold",    count: 4, color: "text-slate-500",  scale: 0.82 },
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
          <span className="text-[13px] font-medium">Warm-up Game</span>
        </button>
        <h1 className="text-[1.35rem] font-heading font-bold text-foreground">
          Warm-up Exercises 🎯
        </h1>
        <p className="text-[13px] text-muted-foreground mt-0.5">Loosen up before your conversation</p>
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
              {t === "twisters" ? "Twisters" : t === "breathing" ? "Breathing" : "Vocal"}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 flex-1 flex flex-col gap-3 max-w-md mx-auto w-full pb-10">
        {/* ── Tongue Twisters ── */}
        {tab === "twisters" && (
          <>
            <p className="text-[12px] text-muted-foreground">
              Tap ✓ when done. Try to say each one quickly without stumbling!
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
                        {tt.difficulty}
                      </span>
                      <span className="text-[11px] text-muted-foreground">× {tt.times}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {done.size === TONGUE_TWISTERS.length && (
              <div className="rounded-2xl bg-green-50 border border-green-100 p-4 text-center">
                <p className="text-[15px] font-heading font-bold text-green-700">All done! 🎉</p>
                <p className="text-[12px] text-green-600 mt-1">Your mouth is warmed up and ready to go.</p>
              </div>
            )}
          </>
        )}

        {/* ── Breathing ── */}
        {tab === "breathing" && (
          <div className="flex flex-col items-center gap-5 pt-2">
            <p className="text-[13px] text-muted-foreground text-center">
              Box breathing calms nerves and steadies your voice.<br />
              Follow the circle — aim for 4 cycles.
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
                    {breathState.cycles > 0 ? `${breathState.cycles} cycle${breathState.cycles > 1 ? "s" : ""}` : "Ready"}
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
                {breathRunning ? "Pause" : breathState.cycles > 0 ? "Resume" : "Start"}
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
                Box Breathing (4-4-4-4)
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
                <p className="text-[15px] font-heading font-bold text-green-700">Well done! 🧘</p>
                <p className="text-[12px] text-green-600 mt-1">
                  {breathState.cycles} cycles complete — your voice is steady and ready.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── Vocal ── */}
        {tab === "vocal" && (
          <>
            <p className="text-[12px] text-muted-foreground">
              These exercises warm up your vocal cords and improve tone before speaking.
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
