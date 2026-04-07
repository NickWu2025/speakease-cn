import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Sparkles, MessageSquare, Lightbulb, RotateCcw } from "lucide-react";

const SessionRecap = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { scenario?: string; mode?: string; duration?: number } | null;

  const scenarioTitle = state?.scenario || "Practice Session";
  const duration = state?.duration || 0;
  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  const coachingMoments = [
    {
      original: "I actually came with a friend",
      improved: "I actually tagged along with a friend of mine",
      reason: "More natural and conversational",
    },
    {
      original: "That's a really good point",
      improved: "That's such a great point — I hadn't considered that!",
      reason: "Shows more engagement and enthusiasm",
    },
    {
      original: "I think Tokyo would be amazing",
      improved: "Honestly, I'd pick Tokyo in a heartbeat",
      reason: "More expressive and confident phrasing",
    },
  ];

  const reusablePhrases = [
    "That sounds interesting — how did you get into that?",
    "No way — that's exactly what I was thinking!",
    "I've been really into that lately too.",
  ];

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

        {/* Success hero */}
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
        {/* What you practiced */}
        <div className="stagger-2 rounded-2xl surface-elevated p-5 border border-border/50">
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare className="w-4 h-4 text-primary" />
            <h2 className="text-[13px] font-heading font-bold text-foreground uppercase tracking-wider">What You Practiced</h2>
          </div>
          <ul className="space-y-2">
            {[
              "Starting and maintaining a natural conversation",
              "Asking engaging follow-up questions",
              "Using expressive and confident phrasing",
            ].map((item, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-[13px] text-muted-foreground">
                <span className="w-1.5 h-1.5 rounded-full bg-primary/60 mt-1.5 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Coaching Moments */}
        <div className="stagger-3 rounded-2xl surface-elevated p-5 border border-border/50">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="w-4 h-4 text-accent" />
            <h2 className="text-[13px] font-heading font-bold text-foreground uppercase tracking-wider">AI Coaching Moments</h2>
          </div>
          <div className="space-y-4">
            {coachingMoments.map((moment, idx) => (
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

        {/* Reusable Phrases */}
        <div className="stagger-4 rounded-2xl bg-primary/5 p-5 border border-primary/10">
          <h2 className="text-[13px] font-heading font-bold text-foreground uppercase tracking-wider mb-3">
            Phrases to Reuse 💬
          </h2>
          <div className="space-y-2">
            {reusablePhrases.map((phrase, idx) => (
              <div key={idx} className="bg-background/80 rounded-xl px-4 py-3 text-[13px] text-foreground border border-border/40 shadow-sm">
                "{phrase}"
              </div>
            ))}
          </div>
        </div>

        {/* Encouragement + CTA */}
        <div className="stagger-5 text-center py-8">
          <p className="text-[17px] font-heading font-bold text-foreground mb-1">
            You're getting more natural every session
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
      </div>

      <div className="h-8" />
    </div>
  );
};

export default SessionRecap;
