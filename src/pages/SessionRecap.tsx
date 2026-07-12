import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Sparkles, Lightbulb, RotateCcw, Loader2, TrendingUp, CheckCircle2, BookOpen } from "lucide-react";
import { analyzeSession, RecapAnalysis, CoachingDimension, DimensionFeedback } from "@/lib/gpt";
import { extractStories } from "@/lib/storyAI";
import { saveStory } from "@/lib/storyStore";
import { saveSessionRecord } from "@/lib/sessionStore";
import { useAuth } from "@/contexts/AuthContext";

// ── Dimension config ──────────────────────────────────────────────────
const DIMENSION_CONFIG: Record<
  CoachingDimension,
  { label: string; emoji: string; desc: string; accentCls: string; bgCls: string; borderCls: string }
> = {
  content: {
    label: "内容",
    emoji: "💬",
    desc: "表达清晰度和自然程度",
    accentCls: "text-blue-600",
    bgCls: "bg-blue-50",
    borderCls: "border-blue-100",
  },
  structure: {
    label: "结构",
    emoji: "🧱",
    desc: "逻辑流畅性和完整性",
    accentCls: "text-amber-600",
    bgCls: "bg-amber-50",
    borderCls: "border-amber-100",
  },
  delivery: {
    label: "表达",
    emoji: "🎙️",
    desc: "语气、自信度和互动感",
    accentCls: "text-violet-600",
    bgCls: "bg-violet-50",
    borderCls: "border-violet-100",
  },
};

const RATING_CONFIG: Record<
  DimensionFeedback["rating"],
  { label: string; cls: string }
> = {
  strong:       { label: "优秀",     cls: "bg-green-100 text-green-700 border-green-200" },
  developing:   { label: "成长中",   cls: "bg-amber-100 text-amber-700 border-amber-200" },
  "needs-work": { label: "重点关注", cls: "bg-blue-100 text-blue-700 border-blue-200" },
};

function DimensionCard({
  dim,
  feedback,
}: {
  dim: CoachingDimension;
  feedback: DimensionFeedback;
}) {
  const cfg = DIMENSION_CONFIG[dim];
  const rating = RATING_CONFIG[feedback.rating];
  return (
    <div className={`rounded-2xl border ${cfg.borderCls} ${cfg.bgCls} p-4 shadow-soft`}>
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-3">
        <span className="text-xl">{cfg.emoji}</span>
        <div className="flex-1 min-w-0">
          <p className={`text-[14px] font-heading font-bold ${cfg.accentCls}`}>{cfg.label}</p>
          <p className="text-[11px] text-muted-foreground">{cfg.desc}</p>
        </div>
        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border uppercase tracking-wide ${rating.cls}`}>
          {rating.label}
        </span>
      </div>

      {/* Observations */}
      <div className="space-y-1.5 mb-3">
        {feedback.observations.map((obs, i) => (
          <div key={i} className="flex items-start gap-2">
            <CheckCircle2 className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${cfg.accentCls} opacity-70`} />
            <p className="text-[13px] text-foreground leading-snug">{obs}</p>
          </div>
        ))}
      </div>

      {/* Tip */}
      <div className={`flex items-start gap-2 pt-3 border-t ${cfg.borderCls}`}>
        <TrendingUp className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${cfg.accentCls}`} />
        <p className={`text-[12px] font-medium ${cfg.accentCls} leading-snug`}>{feedback.tip}</p>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────
const SessionRecap = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const state = location.state as {
    scenario?: string;
    scenarioId?: string;
    mode?: string;
    duration?: number;
    messages?: { role: "user" | "ai"; text: string }[];
  } | null;

  const scenarioTitle = state?.scenario || "练习记录";
  const duration = state?.duration || 0;
  const messages = state?.messages ?? [];

  const [analysis, setAnalysis] = useState<RecapAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [savedStoryCount, setSavedStoryCount] = useState(0);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  useEffect(() => {
    if (messages.length < 2) {
      setLoading(false);
      return;
    }
    // Run analysis and story extraction in parallel
    analyzeSession(messages, scenarioTitle)
      .then((result) => {
        setAnalysis(result);
        if (user) {
          saveSessionRecord(user.id, {
            id: `session_${Date.now()}`,
            scenarioTitle,
            scenarioId: state?.scenarioId,
            date: new Date().toISOString(),
            duration,
            dimensions: {
              content:  result.dimensions.content.rating,
              structure: result.dimensions.structure.rating,
              delivery: result.dimensions.delivery.rating,
            },
          });
        }
      })
      .catch((err) => { console.error("Recap error:", err); setError(true); })
      .finally(() => setLoading(false));

    if (user) {
      extractStories(messages, scenarioTitle, state?.scenarioId)
        .then((stories) => {
          stories.forEach((s) => saveStory(user.id, s));
          if (stories.length > 0) setSavedStoryCount(stories.length);
        })
        .catch((err) => console.error("Story extraction:", err));
    }
  }, []);

  return (
    <div className="min-h-screen gradient-warm flex flex-col">
      {/* Header */}
      <div className="pt-14 pb-4 px-6">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors mb-6 -ml-1"
        >
          <ArrowLeft className="w-[18px] h-[18px]" />
          <span className="text-[13px] font-medium">首页</span>
        </button>

        <div className="stagger-1 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-success/15 flex items-center justify-center shadow-sm">
            <Sparkles className="w-5 h-5 text-success" />
          </div>
          <div>
            <h1 className="text-[1.35rem] font-heading font-bold text-foreground leading-tight">
              会话复盘 🎉
            </h1>
            <p className="text-[13px] text-muted-foreground mt-0.5">
              {scenarioTitle} · {formatTime(duration)}
            </p>
          </div>
        </div>
      </div>

      <div className="px-5 flex-1 flex flex-col gap-4 max-w-md mx-auto w-full">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-[14px] text-muted-foreground font-medium">正在分析你的对话…</p>
          </div>
        ) : error ? (
          <div className="rounded-2xl surface-elevated p-6 border border-border/50 text-center">
            <p className="text-[14px] text-muted-foreground">无法加载分析，请检查 API 密钥后重试。</p>
          </div>
        ) : (
          <>
            {/* ── 3 Dimension cards ── */}
            {analysis?.dimensions && (
              <div className="stagger-2 space-y-3">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  教练分析
                </p>
                {(["content", "structure", "delivery"] as CoachingDimension[]).map((dim) => (
                  <DimensionCard key={dim} dim={dim} feedback={analysis.dimensions[dim]} />
                ))}
              </div>
            )}

            {/* ── Coaching moments ── */}
            {(analysis?.moments?.length ?? 0) > 0 && (
              <div className="stagger-3 rounded-2xl surface-elevated p-5 border border-border/50">
                <div className="flex items-center gap-2 mb-4">
                  <Lightbulb className="w-4 h-4 text-accent" />
                  <h2 className="text-[13px] font-heading font-bold text-foreground uppercase tracking-wider">
                    可优化的时刻
                  </h2>
                </div>
                <div className="space-y-4">
                  {analysis!.moments.map((moment, idx) => {
                    const dimCfg = moment.dimension ? DIMENSION_CONFIG[moment.dimension] : null;
                    return (
                      <div key={idx} className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          {dimCfg && (
                            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${dimCfg.bgCls} ${dimCfg.accentCls} ${dimCfg.borderCls}`}>
                              {dimCfg.emoji} {dimCfg.label}
                            </span>
                          )}
                        </div>
                        <p className="text-[13px] text-muted-foreground/50 line-through decoration-muted-foreground/20">
                          "{moment.original}"
                        </p>
                        <p className="text-[13px] font-medium text-foreground">✨ "{moment.improved}"</p>
                        <p className="text-[11px] text-coaching font-medium">{moment.reason}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Phrases to reuse ── */}
            {(analysis?.phrases?.length ?? 0) > 0 && (
              <div className="stagger-4 rounded-2xl bg-primary/5 p-5 border border-primary/10">
                <h2 className="text-[13px] font-heading font-bold text-foreground uppercase tracking-wider mb-3">
                  可复用表达 💬
                </h2>
                <div className="space-y-2">
                  {analysis!.phrases.map((phrase, idx) => (
                    <div key={idx} className="bg-background/80 rounded-xl px-4 py-3 text-[13px] text-foreground border border-border/40 shadow-sm">
                      "{phrase}"
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Encouragement + CTA ── */}
            <div className="stagger-5 text-center py-8">
              <p className="text-[17px] font-heading font-bold text-foreground mb-1">
                {analysis?.encouragement ?? "你每次练习都在变得更自然"}
              </p>
              <p className="text-[13px] text-muted-foreground">信心来自练习 💪</p>
              <button
                onClick={() => navigate("/")}
                className="mt-6 gradient-primary text-primary-foreground px-8 py-3.5 rounded-full font-semibold shadow-glow-primary hover:shadow-lg transition-all active:scale-95 inline-flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                再次练习
              </button>
            </div>

            {/* ── Story Library banner ── */}
            {savedStoryCount > 0 && (
              <div className="stagger-6 rounded-2xl bg-primary/5 border border-primary/10 p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <BookOpen className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold text-foreground">
                    {savedStoryCount} 个故事已保存 📖
                  </p>
                  <p className="text-[12px] text-muted-foreground">已添加到你的故事工坊</p>
                </div>
                <button
                  onClick={() => navigate("/stories")}
                  className="text-[12px] font-semibold text-primary shrink-0 hover:underline"
                >
                  查看 →
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <div className="h-8" />
    </div>
  );
};

export default SessionRecap;