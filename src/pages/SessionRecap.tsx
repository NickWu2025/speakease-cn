import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Sparkles, MessageSquare, Lightbulb, RotateCcw, Loader2 } from "lucide-react";
import { analyzeSession, RecapAnalysis } from "@/lib/gpt";

const SessionRecap = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as {
    scenario?: string;
    scenarioId?: string;
    mode?: string;
    duration?: number;
    messages?: { role: "user" | "ai"; text: string }[];
  } | null;

  const scenarioTitle = state?.scenario || "Practice Session";
  const duration = state?.duration || 0;
  const messages = state?.messages ?? [];

  const [analysis, setAnalysis] = useState<RecapAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  useEffect(() => {
    if (messages.length < 2) {
      setLoading(false);
      return;
    }
    analyzeSession(messages, scenarioTitle)
      .then((result) => {
        setAnalysis(result);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Recap analysis error:", err);
        setError(true);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen gradient-warm flex flex-col">
      {/* Header */}
      <div className="pt-14 pb-4 px-6">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors mb-6 -ml-1"
        >
          <ArrowLeft className="w-4.5 h-4.5" />
          <span className="text-[13px] font-medium">Home</span>
        </button>

        <div className="stagger-1 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-success/15 flex items-center justify-center shadow-sm">
            <Sparkles className="w-5 h-5 text-success" />
          </div>
          <div>
            <h1 className="text-[1.35rem] font-heading font-bold text-foreground leading-tight">
              Nice work! 🎉
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
            <p className="text-[14px] text-muted-foreground font-medium">Analyzing your conversation…</p>
          </div>
        ) : error ? (
          <div className="rounded-2xl surface-elevated p-6 border border-border/50 text-center">
            <p className="text-[14px] text-muted-foreground">Couldn't load analysis. Check your API key and try again.</p>
          </div>
        ) : (
          <>
            {/* What you practiced */}
            <div className="stagger-2 rounded-2xl surface-elevated p-5 border border-border/50">
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="w-4 h-4 text-primary" />
                <h2 className="text-[13px] font-heading font-bold text-foreground uppercase tracking-wider">What You Practiced</h2>
              </div>
              <ul className="space-y-2">
                {(analysis?.practiced ?? []).map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-[13px] text-muted-foreground">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/60 mt-1.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Coaching Moments */}
            {(analysis?.moments?.length ?? 0) > 0 && (
              <div className="stagger-3 rounded-2xl surface-elevated p-5 border border-border/50">
                <div className="flex items-center gap-2 mb-4">
                  <Lightbulb className="w-4 h-4 text-accent" />
                  <h2 className="text-[13px] font-heading font-bold text-foreground uppercase tracking-wider">AI Coaching Moments</h2>
                </div>
                <div className="space-y-4">
                  {analysis!.moments.map((moment, idx) => (
                    <div key={idx} className="space-y-1.5">
                      <p className="text-[13px] text-muted-foreground/50 line-through decoration-muted-foreground/20">
                        "{moment.original}"
                      </p>
                      <p className="text-[13px] font-medium text-foreground">
                        ✨ "{moment.improved}"
                      </p>
                      <p className="text-[11px] text-coaching font-medium">{moment.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reusable Phrases */}
            {(analysis?.phrases?.length ?? 0) > 0 && (
              <div className="stagger-4 rounded-2xl bg-primary/5 p-5 border border-primary/10">
                <h2 className="text-[13px] font-heading font-bold text-foreground uppercase tracking-wider mb-3">
                  Phrases to Reuse 💬
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

            {/* Encouragement + CTA */}
            <div className="stagger-5 text-center py-8">
              <p className="text-[17px] font-heading font-bold text-foreground mb-1">
                {analysis?.encouragement ?? "You're getting more natural every session"}
              </p>
              <p className="text-[13px] text-muted-foreground">
                Confidence comes with practice 💪
              </p>
              <button
                onClick={() => navigate("/")}
                className="mt-6 gradient-primary text-primary-foreground px-8 py-3.5 rounded-full font-semibold shadow-glow-primary hover:shadow-lg transition-all active:scale-95 inline-flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Practice Again
              </button>
            </div>
          </>
        )}
      </div>

      <div className="h-8" />
    </div>
  );
};

export default SessionRecap;
