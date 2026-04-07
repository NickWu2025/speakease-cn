import { useNavigate } from "react-router-dom";
import { MessageCircle, Zap, Flame } from "lucide-react";
import aiAvatar from "@/assets/ai-avatar.png";

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="pt-14 pb-8 px-6 text-center">
        <div className="flex justify-center mb-4">
          <img src={aiAvatar} alt="SpeakFlow" width={72} height={72} className="rounded-full shadow-lg" />
        </div>
        <h1 className="text-3xl font-heading font-bold text-foreground tracking-tight">
          SpeakFlow
        </h1>
        <p className="text-muted-foreground mt-2 text-base max-w-xs mx-auto leading-relaxed">
          Practice real conversations with live AI coaching
        </p>
      </div>

      {/* Mode Buttons */}
      <div className="px-6 flex-1 flex flex-col gap-4 max-w-md mx-auto w-full">
        <button
          onClick={() => navigate("/scenarios")}
          className="group relative w-full rounded-2xl bg-primary p-6 text-left shadow-md hover:shadow-lg transition-all active:scale-[0.98]"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary-foreground/20 flex items-center justify-center shrink-0">
              <MessageCircle className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-lg font-heading font-semibold text-primary-foreground">
                Small Talk Practice
              </h2>
              <p className="text-primary-foreground/80 text-sm mt-1">
                Real social scenarios — classmates, parties, networking
              </p>
            </div>
          </div>
        </button>

        <button
          onClick={() => navigate("/conversation?mode=improv")}
          className="group relative w-full rounded-2xl bg-secondary p-6 text-left shadow-md hover:shadow-lg transition-all active:scale-[0.98]"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-secondary-foreground/10 flex items-center justify-center shrink-0">
              <Zap className="w-6 h-6 text-secondary-foreground" />
            </div>
            <div>
              <h2 className="text-lg font-heading font-semibold text-secondary-foreground">
                Improv Mode
              </h2>
              <p className="text-secondary-foreground/70 text-sm mt-1">
                Random topics — think fast, respond naturally
              </p>
            </div>
          </div>
        </button>

        {/* Stats Card */}
        <div className="mt-6 rounded-2xl bg-card p-5 shadow-sm border border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/30 flex items-center justify-center">
                <Flame className="w-5 h-5 text-accent-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Daily Streak</p>
                <p className="text-xs text-muted-foreground">Keep practicing every day</p>
              </div>
            </div>
            <span className="text-2xl font-heading font-bold text-primary">3</span>
          </div>
        </div>

        {/* Recent Sessions */}
        <div className="rounded-2xl bg-card p-5 shadow-sm border border-border">
          <p className="text-sm font-medium text-foreground mb-3">Recent Sessions</p>
          <div className="space-y-3">
            {[
              { title: "Party Conversation", time: "2 min ago", emoji: "🎉" },
              { title: "Meeting a Classmate", time: "Yesterday", emoji: "👋" },
            ].map((session) => (
              <div key={session.title} className="flex items-center gap-3">
                <span className="text-lg">{session.emoji}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{session.title}</p>
                  <p className="text-xs text-muted-foreground">{session.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom spacer */}
      <div className="h-8" />
    </div>
  );
};

export default Home;
