import { useNavigate } from "react-router-dom";
import { MessageCircle, Zap, Flame, ChevronRight } from "lucide-react";
import aiAvatar from "@/assets/ai-avatar.png";

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen gradient-warm flex flex-col">
      {/* Hero */}
      <div className="pt-16 pb-10 px-6 text-center">
        <div className="flex justify-center mb-5">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl scale-150 animate-mic-breathe" />
            <img
              src={aiAvatar}
              alt="SpeakFlow"
              width={80}
              height={80}
              className="relative rounded-full shadow-glow-primary ring-4 ring-background"
            />
          </div>
        </div>
        <h1 className="text-[2rem] font-heading font-bold text-foreground tracking-tight leading-tight">
          SpeakFlow
        </h1>
        <p className="text-muted-foreground mt-2.5 text-[15px] max-w-[260px] mx-auto leading-relaxed">
          Practice real conversations with live AI coaching
        </p>
      </div>

      {/* Mode Cards */}
      <div className="px-5 flex-1 flex flex-col gap-3.5 max-w-md mx-auto w-full">
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

        {/* Streak */}
        <div className="stagger-3 mt-4 rounded-2xl surface-elevated p-4 flex items-center gap-4 border border-border/50">
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
        <div className="stagger-4 rounded-2xl surface-elevated p-4 border border-border/50">
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
