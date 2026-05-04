import { useNavigate } from "react-router-dom";
import { MessageCircle, ChevronRight, Gamepad2, LogOut, User, BookOpen } from "lucide-react";
import aiAvatar from "@/assets/ai-avatar.png";
import { useAuth } from "@/contexts/AuthContext";
import { PROFICIENCY_META, GOALS } from "@/types/profile";
import { loadStories } from "@/lib/storyStore";
import { loadSessions } from "@/lib/sessionStore";
import ProgressWidget from "@/components/ProgressWidget";

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
  const storyCount = user ? loadStories(user.id).length : 0;
  const sessions = user ? loadSessions(user.id) : [];

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
                Conversation Practice
              </h2>
              <p className="text-primary-foreground/75 text-[13px] mt-0.5">
                Social, interview, presentation & more
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-primary-foreground/50 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </button>

        <button
          onClick={() => navigate("/stories")}
          className="stagger-2 group w-full rounded-2xl bg-card p-5 text-left shadow-soft hover:shadow-lg transition-all active:scale-[0.98] relative overflow-hidden border border-border/50"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[hsl(230_80%_97%)] to-[hsl(250_60%_95%)]" />
          <div className="relative flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-[hsl(230_70%_88%)] flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5 text-[hsl(230_55%_45%)]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-[17px] font-heading font-semibold text-foreground">
                  Story Library
                </h2>
                {storyCount > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[hsl(230_70%_88%)] text-[hsl(230_55%_45%)] border border-[hsl(230_60%_80%)]">
                    {storyCount}
                  </span>
                )}
              </div>
              <p className="text-muted-foreground text-[13px] mt-0.5">
                Refine your stories, debate with AI
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground/30 group-hover:text-[hsl(230_55%_45%)] group-hover:translate-x-0.5 transition-all" />
          </div>
        </button>

        <button
          onClick={() => navigate("/warmup")}
          className="stagger-3 group w-full rounded-2xl bg-card p-5 text-left shadow-soft hover:shadow-lg transition-all active:scale-[0.98] relative overflow-hidden border border-border/50"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[hsl(152_80%_97%)] to-[hsl(180_60%_95%)]" />
          <div className="relative flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-[hsl(152_70%_88%)] flex items-center justify-center shrink-0">
              <Gamepad2 className="w-5 h-5 text-[hsl(152_55%_32%)]" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-[17px] font-heading font-semibold text-foreground">
                Warm-up Game
              </h2>
              <p className="text-muted-foreground text-[13px] mt-0.5">
                Exercises, humor, eye contact & filler trainer
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground/30 group-hover:text-[hsl(152_55%_32%)] group-hover:translate-x-0.5 transition-all" />
          </div>
        </button>

        <ProgressWidget sessions={sessions} storyCount={storyCount} />
      </div>

      <div className="h-10" />
    </div>
  );
};

export default Home;
