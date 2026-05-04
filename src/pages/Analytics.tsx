import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, TrendingUp, TrendingDown, Minus, Sparkles, Loader2,
  BookOpen, CheckCircle2, AlertCircle,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  SessionRecord, loadSessions, computeStats, computeReadiness,
  RATING_LABEL, SCENARIO_EMOJI, DimKey, DimensionRating,
} from "@/lib/sessionStore";
import { loadStories } from "@/lib/storyStore";
import { generateProgressReport, ProgressReport } from "@/lib/storyAI";

const DIM_CONFIG: Record<DimKey, { label: string; emoji: string; bar: string; track: string; text: string }> = {
  content:  { label: "Content",   emoji: "💬", bar: "bg-blue-400",   track: "bg-blue-100",   text: "text-blue-600" },
  structure:{ label: "Structure", emoji: "🧱", bar: "bg-amber-400",  track: "bg-amber-100",  text: "text-amber-600" },
  delivery: { label: "Delivery",  emoji: "🎙️", bar: "bg-violet-400", track: "bg-violet-100", text: "text-violet-600" },
};

const RATING_DOT: Record<DimensionRating, string> = {
  strong:       "bg-green-400",
  developing:   "bg-amber-400",
  "needs-work": "bg-rose-400",
};

const READINESS_CONFIG: Record<string, { cls: string; icon: typeof CheckCircle2 }> = {
  "Ready ✓":       { cls: "bg-green-50 border-green-200 text-green-700",  icon: CheckCircle2 },
  "Almost there":  { cls: "bg-amber-50 border-amber-200 text-amber-700",  icon: TrendingUp },
  "Keep practicing":{ cls: "bg-blue-50 border-blue-200 text-blue-700",    icon: AlertCircle },
};

function formatRelative(iso: string) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days}d ago`;
}

function formatDuration(s: number) {
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
}

const Analytics = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [storyCount, setStoryCount] = useState(0);
  const [report, setReport] = useState<ProgressReport | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    if (!user) return;
    setSessions(loadSessions(user.id));
    setStoryCount(loadStories(user.id).length);
  }, [user]);

  const stats = useMemo(() => computeStats(sessions), [sessions]);
  const readiness = useMemo(() => (stats ? computeReadiness(stats) : null), [stats]);
  const displayedSessions = showAll ? sessions : sessions.slice(0, 8);

  const handleGenerateReport = async () => {
    if (!sessions.length || reportLoading) return;
    setReportLoading(true);
    try {
      const r = await generateProgressReport(sessions, storyCount);
      setReport(r);
    } catch (e) {
      console.error(e);
    } finally {
      setReportLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-warm flex flex-col">
      {/* Header */}
      <div className="pt-14 pb-4 px-6">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors mb-6 -ml-1"
        >
          <ArrowLeft className="w-[18px] h-[18px]" />
          <span className="text-[13px] font-medium">Home</span>
        </button>
        <h1 className="text-[1.35rem] font-heading font-bold text-foreground leading-tight">
          Analytics 📊
        </h1>
        <p className="text-[13px] text-muted-foreground mt-0.5">
          Track your progress and plan what's next
        </p>
      </div>

      <div className="px-5 flex-1 flex flex-col gap-4 max-w-md mx-auto w-full pb-10">
        {sessions.length === 0 ? (
          <div className="rounded-2xl bg-card border border-border/50 p-8 text-center">
            <p className="text-[32px] mb-3">📊</p>
            <p className="text-[15px] font-heading font-semibold text-foreground">No sessions yet</p>
            <p className="text-[13px] text-muted-foreground mt-2 leading-snug">
              Complete your first conversation to start tracking your progress.
            </p>
            <button
              onClick={() => navigate("/scenarios")}
              className="mt-4 gradient-primary text-primary-foreground px-6 py-2.5 rounded-full font-semibold shadow-glow-primary text-[13px]"
            >
              Start practicing
            </button>
          </div>
        ) : (
          <>
            {/* ── Summary Stats ── */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: sessions.length, label: "Sessions",       emoji: "🗣️" },
                { value: storyCount,      label: "Stories saved",  emoji: "📖" },
                { value: stats?.streak ?? 0, label: "Day streak",  emoji: "🔥" },
              ].map((s) => (
                <div key={s.label} className="rounded-2xl bg-card border border-border/50 p-3 text-center shadow-soft">
                  <p className="text-lg mb-0.5">{s.emoji}</p>
                  <p className="text-[26px] font-heading font-bold text-primary leading-none">{s.value}</p>
                  <p className="text-[10px] text-muted-foreground mt-1 leading-tight">{s.label}</p>
                </div>
              ))}
            </div>

            {/* ── Skill Breakdown ── */}
            {stats && (
              <div className="rounded-2xl bg-card border border-border/50 p-4 shadow-soft">
                <p className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                  Skill breakdown
                </p>
                <div className="space-y-4">
                  {(["content", "structure", "delivery"] as DimKey[]).map((dim) => {
                    const cfg = DIM_CONFIG[dim];
                    const d = stats.dims[dim];
                    return (
                      <div key={dim}>
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm">{cfg.emoji}</span>
                            <span className="text-[13px] font-semibold text-foreground">{cfg.label}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                              d.rating === "strong"     ? "bg-green-100 text-green-700" :
                              d.rating === "developing" ? "bg-amber-100 text-amber-700" :
                                                          "bg-blue-100 text-blue-700"
                            }`}>
                              {RATING_LABEL[d.rating]}
                            </span>
                            {d.trend === "up"     && <TrendingUp   className="w-3.5 h-3.5 text-green-500" />}
                            {d.trend === "down"   && <TrendingDown className="w-3.5 h-3.5 text-rose-500" />}
                            {d.trend === "stable" && <Minus        className="w-3.5 h-3.5 text-muted-foreground/40" />}
                          </div>
                        </div>
                        <div className={`h-2 rounded-full ${cfg.track}`}>
                          <div className={`h-full rounded-full ${cfg.bar} transition-all`} style={{ width: `${d.barPct}%` }} />
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-1">
                          Based on {sessions.length} session{sessions.length !== 1 ? "s" : ""}
                          {d.trend !== "stable" && sessions.length >= 4
                            ? d.trend === "up" ? " · improving recently 🎉" : " · recent dip — keep at it"
                            : ""}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Focus recommendation */}
                <div className="mt-4 pt-3 border-t border-border/40">
                  <p className="text-[12px] text-muted-foreground">
                    💡 <strong className="text-foreground">Focus area:</strong>{" "}
                    {DIM_CONFIG[stats.weakestDim].label} — this is where targeted practice will have the biggest impact.
                  </p>
                </div>
              </div>
            )}

            {/* ── Scenario Readiness ── */}
            {readiness && (
              <div className="rounded-2xl bg-card border border-border/50 p-4 shadow-soft">
                <p className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Scenario readiness
                </p>
                <div className="space-y-2">
                  {(["social", "interview", "presentation"] as const).map((scenario) => {
                    const aiReadiness = report?.readiness[scenario];
                    const level = aiReadiness ?? readiness[scenario];
                    const cfg = READINESS_CONFIG[level] ?? READINESS_CONFIG["Keep practicing"];
                    const Icon = cfg.icon;
                    return (
                      <div key={scenario} className={`flex items-center gap-3 rounded-xl border px-3.5 py-2.5 ${cfg.cls}`}>
                        <Icon className="w-4 h-4 shrink-0" />
                        <span className="text-[13px] font-semibold capitalize flex-1">{scenario}</span>
                        <span className="text-[12px] font-medium">{level}</span>
                      </div>
                    );
                  })}
                </div>
                {!report && (
                  <p className="text-[11px] text-muted-foreground mt-2.5">
                    Generate an AI report below for personalized readiness scores.
                  </p>
                )}
              </div>
            )}

            {/* ── AI Progress Report ── */}
            <div className="rounded-2xl bg-card border border-border/50 p-4 shadow-soft">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">
                  AI progress report
                </p>
                {!report && (
                  <button
                    onClick={handleGenerateReport}
                    disabled={reportLoading}
                    className="flex items-center gap-1.5 gradient-primary text-primary-foreground text-[11px] font-semibold px-3 py-1.5 rounded-full shadow-glow-primary disabled:opacity-60"
                  >
                    {reportLoading ? (
                      <><Loader2 className="w-3 h-3 animate-spin" /> Generating…</>
                    ) : (
                      <><Sparkles className="w-3 h-3" /> Generate</>
                    )}
                  </button>
                )}
              </div>

              {!report && !reportLoading && (
                <p className="text-[13px] text-muted-foreground leading-snug">
                  Get a personalized summary of your key improvements, focus areas, and scenario readiness — powered by AI.
                </p>
              )}

              {reportLoading && (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="w-6 h-6 text-primary animate-spin" />
                </div>
              )}

              {report && (
                <div className="space-y-4">
                  {/* Headline */}
                  <p className="text-[14px] font-heading font-semibold text-foreground leading-snug">
                    {report.headline}
                  </p>

                  {/* Improvements */}
                  <div>
                    <p className="text-[11px] font-bold text-green-600 uppercase tracking-wider mb-2">
                      ✓ What's working
                    </p>
                    <div className="space-y-1.5">
                      {report.improvements.map((item, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" />
                          <p className="text-[13px] text-foreground leading-snug">{item}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Focus areas */}
                  <div>
                    <p className="text-[11px] font-bold text-primary uppercase tracking-wider mb-2">
                      → Focus areas
                    </p>
                    <div className="space-y-1.5">
                      {report.focusAreas.map((item, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <TrendingUp className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                          <p className="text-[13px] text-foreground leading-snug">{item}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={handleGenerateReport}
                    disabled={reportLoading}
                    className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                  >
                    ↺ Regenerate
                  </button>
                </div>
              )}
            </div>

            {/* ── Session History ── */}
            <div className="rounded-2xl bg-card border border-border/50 p-4 shadow-soft">
              <p className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Session history
              </p>
              <div className="space-y-2.5">
                {displayedSessions.map((s) => (
                  <div key={s.id} className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center shrink-0 text-sm">
                      {SCENARIO_EMOJI[s.scenarioId ?? ""] ?? "💬"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-foreground truncate">{s.scenarioTitle}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {formatRelative(s.date)}
                        {s.duration > 0 && ` · ${formatDuration(s.duration)}`}
                      </p>
                    </div>
                    {/* Dim dots */}
                    <div className="flex gap-1 shrink-0 items-center">
                      {(["content", "structure", "delivery"] as DimKey[]).map((dim) => (
                        <div
                          key={dim}
                          title={`${DIM_CONFIG[dim].label}: ${RATING_LABEL[s.dimensions[dim]]}`}
                          className={`w-2 h-2 rounded-full ${RATING_DOT[s.dimensions[dim]]}`}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              {sessions.length > 8 && (
                <button
                  onClick={() => setShowAll((v) => !v)}
                  className="mt-3 text-[12px] text-primary font-semibold"
                >
                  {showAll ? "Show less" : `Show all ${sessions.length} sessions`}
                </button>
              )}
            </div>

            {/* ── Story Portfolio ── */}
            <div
              className="rounded-2xl bg-primary/5 border border-primary/10 p-4 flex items-center gap-3 cursor-pointer hover:bg-primary/8 transition-colors"
              onClick={() => navigate("/stories")}
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <BookOpen className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-semibold text-foreground">Story Portfolio</p>
                <p className="text-[12px] text-muted-foreground">
                  {storyCount > 0
                    ? `${storyCount} ${storyCount === 1 ? "story" : "stories"} saved — ready to refine`
                    : "Stories are extracted from your conversations automatically"}
                </p>
              </div>
              <span className="text-[12px] text-primary font-semibold shrink-0">View →</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Analytics;
