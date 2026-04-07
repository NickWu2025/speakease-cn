import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Sparkles, MessageSquare, Lightbulb } from "lucide-react";

const SessionRecap = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { scenario?: string; mode?: string } | null;

  const scenarioTitle = state?.scenario || "Practice Session";

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
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="pt-14 pb-6 px-6">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm">Home</span>
        </button>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-success/20 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-success" />
          </div>
          <div>
            <h1 className="text-xl font-heading font-bold text-foreground">
              Nice work! 🎉
            </h1>
            <p className="text-sm text-muted-foreground">{scenarioTitle}</p>
          </div>
        </div>
      </div>

      <div className="px-6 flex-1 flex flex-col gap-5 max-w-md mx-auto w-full">
        {/* What you practiced */}
        <div className="rounded-2xl bg-card p-5 border border-border shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-heading font-semibold text-foreground">What You Practiced</h2>
          </div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              Starting and maintaining a natural conversation
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              Asking engaging follow-up questions
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              Using expressive and confident phrasing
            </li>
          </ul>
        </div>

        {/* Coaching Moments */}
        <div className="rounded-2xl bg-card p-5 border border-border shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="w-4 h-4 text-accent" />
            <h2 className="text-sm font-heading font-semibold text-foreground">Moments Where AI Helped</h2>
          </div>
          <div className="space-y-4">
            {coachingMoments.map((moment, idx) => (
              <div key={idx} className="space-y-1.5">
                <p className="text-sm text-muted-foreground line-through decoration-muted-foreground/40">
                  "{moment.original}"
                </p>
                <p className="text-sm font-medium text-foreground">
                  ✨ "{moment.improved}"
                </p>
                <p className="text-xs text-coaching">{moment.reason}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Reusable Phrases */}
        <div className="rounded-2xl bg-primary/5 p-5 border border-primary/10">
          <h2 className="text-sm font-heading font-semibold text-foreground mb-3">
            Phrases to Reuse 💬
          </h2>
          <div className="space-y-2">
            {reusablePhrases.map((phrase, idx) => (
              <div key={idx} className="bg-background rounded-xl px-4 py-3 text-sm text-foreground border border-border">
                "{phrase}"
              </div>
            ))}
          </div>
        </div>

        {/* Encouragement */}
        <div className="text-center py-6">
          <p className="text-base font-heading font-semibold text-foreground mb-1">
            You're getting more natural every session
          </p>
          <p className="text-sm text-muted-foreground">
            Keep going — confidence comes with practice 💪
          </p>
          <button
            onClick={() => navigate("/")}
            className="mt-5 bg-primary text-primary-foreground px-8 py-3 rounded-full font-medium shadow-md hover:shadow-lg transition-all active:scale-95"
          >
            Practice Again
          </button>
        </div>
      </div>

      <div className="h-8" />
    </div>
  );
};

export default SessionRecap;
