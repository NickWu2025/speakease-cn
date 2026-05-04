import { useNavigate } from "react-router-dom";
import { MessageCircle, Zap, Flame, ChevronRight, Laugh, LogOut, User } from "lucide-react";
import aiAvatar from "@/assets/ai-avatar.png";
import { useAuth } from "@/contexts/AuthContext";
import { PROFICIENCY_META, GOALS } from "@/types/profile";

const SCENARIO_CONFIG = {
  classmate: { label: "Meeting a Classmate", emoji: "👋", path: "/conversation?scenario=classmate" },
  party:     { label: "Party Conversation",  emoji: "🎉", path: "/conversation?scenario=party" },
  networking:{ label: "Networking Event",    emoji: "🤝", path: "/conversation?scenario=networking" },
  improv:    { label: "Improv Mode",         emoji: "⚡", path: "/conversation?mode=improv" },
};

const Home = () => {
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();

  const firstName = user?.name?.split(" ")[0] ?? "there";
  const levelMeta = profile ? PROFICIENCY_META[profile.proficiencyLevel] : null;
  const primaryGoalLabel = profile?.goals[0] ? GOALS.find((g) => g.id === profile.goals[0])?.label : null;

  const handleSignOut = () => {
    signOut();
    navigate("/auth");
  };

  return (
    <div className="min-h-screen gradient-warm flex flex-col">
      {/* Header */}
      <div className="pt-14 pb-4 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl scale-150 animate-mic-breathe" />
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name} width={44} height={44} className="relative rounded-full shadow-glow-primary ring-2 ring-background" />
            ) : (
              <img src={aiAvatar} alt="SpeakFlow" width={44} height={44} className="relative rounded-full shadow-glow-primary ring-2 ring-background" />
            )}
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground font-medium">Welcome back</p>
            <h1 className="text-[17px] font-heading font-bold text-foreground leading-tight">{firstName} 👋</h1>
          </div>
        </div>
        <button onClick={handleSignOut} className="p-2 rounded-xl hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground">
          <LogOut className="w-4 h-4" />
        </button>
      </div>

      {/* Profile card (if onboarded) */}
      {profile && levelMeta && (
        <div className="mx-5 mb-4 rounded-2xl bg-card border border-border/50 shadow-soft px-4 py-3.5 flex items-center gap-3">
          <div className={`px-3 py-1 rounded-full border text-[11px] font-semibold uppercase tracking-wider ${levelMeta.colorClass}`}>
            {profile.proficiencyLevel === "beginner" ? "🌱" : profile.proficiencyLevel === "intermediate" ? "🔥" : "⚡"} {levelMeta.label}
          </div>
          {primaryGoalLabel && (
            <p className="text-[12px] text-muted-foreground flex-1 truncate">Goal: {primaryGoalLabel}</p>
          )}
          <button onClick={() => navigate("/onboarding")} className="p-1 text-muted-foreground/50 hover:text-muted-foreground transition-colors">
            <User className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Recommended (if profile has recommendations) */}
      {profile?.recommendedScenarios?.length > 0 && (
        <div className="px-5 mb-2">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Recommended for you</p>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {profile.recommendedScenarios.slice(0, 3).map((scenId) => {
              const cfg = SCENARIO_CONFIG[scenId as keyof typeof SCENARIO_CONFIG];
              if (!cfg) return null;
              return (
                <button
                  key={scenId}
                  onClick={() => navigate(cfg.path)}
                  className="shrink-0 flex items-center gap-2 rounded-xl bg-primary/10 border border-primary/20 px-3.5 py-2 text-[13px] font-medium text-primary hover:bg-primary/15 transition-all"
                >
                  <span>{cfg.emoji}</span> {cfg.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Mode Cards */}
      <div className="px-5 flex-1 flex flex-col gap-3.5 max-w-md mx-auto w-full mt-2">
        <button
          onClick={() => navigate("/scenarios")}
          className="stagger-1 group w-full rounded-2xl gradient-primary p-5 text-left shadow-glow-primary hover:shadow-lg transition-all active:scale-[0.98] relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
          <div className="relative flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center shrink-0 backdrop-blur-sm">
              <MessageCircle className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-[17px] font-heading font-semibold text-primary-foreground">
                Small Talk Practice
              </h2>
              <p className="text-primary-foreground/75 text-[13px] mt-0.5">
                Classmates, parties, networking
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-primary-foreground/50 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </button>

        <button
          onClick={() => navigate("/conversation?mode=improv")}
          className="stagger-2 group w-full rounded-2xl bg-secondary p-5 text-left shadow-soft hover:shadow-lg transition-all active:scale-[0.98] relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
          <div className="relative flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-secondary-foreground/10 flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5 text-secondary-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-[17px] font-heading font-semibold text-secondary-foreground">
                Improv Mode
              </h2>
              <p className="text-secondary-foreground/60 text-[13px] mt-0.5">
                Random topics — think fast, speak naturally
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-secondary-foreground/30 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </button>

        <button
          onClick={() => navigate("/conversation?mode=humor&scenario=humor")}
          className="stagger-3 group w-full rounded-2xl bg-card p-5 text-left shadow-soft hover:shadow-lg transition-all active:scale-[0.98] relative overflow-hidden border border-border/50"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[hsl(45_80%_97%)] to-[hsl(25_70%_95%)]" />
          <div className="relative flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-[hsl(38_90%_88%)] flex items-center justify-center shrink-0">
              <Laugh className="w-5 h-5 text-[hsl(30_80%_45%)]" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-[17px] font-heading font-semibold text-foreground">
                Humor Practice
              </h2>
              <p className="text-muted-foreground text-[13px] mt-0.5">
                Random prompts — be witty, get instant feedback
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground/30 group-hover:text-[hsl(30_80%_45%)] group-hover:translate-x-0.5 transition-all" />
          </div>
        </button>

        {/* Streak */}
        <div className="stagger-4 mt-4 rounded-2xl surface-elevated p-4 flex items-center gap-4 border border-border/50">
          <div className="w-11 h-11 rounded-xl bg-accent/20 flex items-center justify-center shrink-0">
            <Flame className="w-5 h-5 text-accent" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-semibold text-foreground">Daily Streak</p>
            <p className="text-[12px] text-muted-foreground mt-0.5">Keep it going every day</p>
          </div>
          <div className="flex items-baseline gap-0.5">
            <span className="text-[28px] font-heading font-bold text-primary leading-none">3</span>
            <span className="text-[11px] text-muted-foreground font-medium">days</span>
          </div>
        </div>

        {/* Recent Sessions */}
        <div className="stagger-5 rounded-2xl surface-elevated p-4 border border-border/50">
          <p className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">Recent</p>
          <div className="space-y-2.5">
            {[
              { title: "Party Conversation", time: "2 min ago", emoji: "🎉" },
              { title: "Meeting a Classmate", time: "Yesterday", emoji: "👋" },
            ].map((session) => (
              <div key={session.title} className="flex items-center gap-3 rounded-xl hover:bg-muted/50 p-2 -mx-2 transition-colors cursor-pointer">
                <div className="w-9 h-9 rounded-lg bg-muted/70 flex items-center justify-center">
                  <span className="text-base">{session.emoji}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-medium text-foreground">{session.title}</p>
                  <p className="text-[12px] text-muted-foreground">{session.time}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground/30" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="h-10" />
    </div>
  );
};

export default Home;
