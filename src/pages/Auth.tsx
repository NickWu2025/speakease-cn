import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import aiAvatar from "@/assets/ai-avatar.png";
import { useAuth } from "@/contexts/AuthContext";

function AuthInner() {
  const navigate = useNavigate();
  const { continueAsGuest } = useAuth();
  const [guestName, setGuestName] = useState("");
  const [showGuestInput, setShowGuestInput] = useState(false);

  const handleGuest = () => {
    if (!showGuestInput) {
      setShowGuestInput(true);
      return;
    }
    continueAsGuest(guestName);
    navigate("/onboarding");
  };

  const handleQuickTry = () => {
    const userId = `guest_${Date.now()}`;
    const u = { id: userId, name: "体验用户", email: "", isGuest: true };
    localStorage.setItem("speakflow_user", JSON.stringify(u));
    const minProfile = {
      onboardingCompleted: true,
      proficiencyLevel: "intermediate",
      goals: ["presentation"],
      challenges: [],
      strengths: [],
      areasToImprove: [],
      recommendedScenarios: ["elevator_pitch"],
      coachNote: "",
    };
    localStorage.setItem(`speakflow_profile_${userId}`, JSON.stringify(minProfile));
    window.location.href = "/conversation?scenario=elevator_pitch";
  };

  return (
    <div className="min-h-screen gradient-warm flex flex-col items-center justify-center px-6">
      {/* Logo */}
      <div className="flex flex-col items-center mb-10 animate-fade-in">
        <div className="relative mb-5">
          <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl scale-150 animate-mic-breathe" />
          <img
            src={aiAvatar}
            alt="易言 SpeakEase"
            width={80}
            height={80}
            className="relative rounded-full shadow-glow-primary ring-4 ring-background"
          />
        </div>
        <h1 className="text-[2rem] font-heading font-bold tracking-tight gradient-brand-text">易言 SpeakEase</h1>
        <p className="text-muted-foreground mt-2 text-[15px] text-center max-w-[260px] leading-relaxed">
          你的 AI 演讲叙事教练 — 从第一天起为你量身定制
        </p>
        <div className="mt-3 flex items-center gap-1.5">
          <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-[10px] font-semibold text-primary tracking-wide">AI 叙事教练</span>
          <span className="px-2.5 py-0.5 rounded-full bg-violet-100 text-[10px] font-semibold text-violet-600 tracking-wide">三维反馈</span>
          <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-[10px] font-semibold text-blue-600 tracking-wide">故事工坊</span>
        </div>
      </div>

      {/* Sign-in card */}
      <div className="w-full max-w-sm space-y-4">
        {/* Quick Try Button */}
        <button
          onClick={handleQuickTry}
          className="w-full flex items-center justify-center gap-2 rounded-2xl gradient-brand px-5 py-4 text-[16px] font-bold text-white shadow-lg hover:shadow-xl transition-all active:scale-[0.97]"
        >
          🚀 快速体验 — 30 秒感受 AI 教练
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-border/50" />
          <span className="text-[12px] text-muted-foreground/50 font-medium">或</span>
          <div className="flex-1 h-px bg-border/50" />
        </div>

        {/* Guest path */}
        {showGuestInput ? (
          <div className="space-y-3 animate-slide-up">
            <input
              type="text"
              placeholder="你叫什么名字？"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleGuest()}
              autoFocus
              className="w-full rounded-2xl bg-card border border-border/60 px-5 py-3.5 text-[15px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all shadow-soft"
            />
            <button
              onClick={handleGuest}
              className="w-full flex items-center justify-center gap-2 rounded-2xl gradient-primary px-5 py-3.5 text-[15px] font-semibold text-primary-foreground shadow-glow-primary transition-all active:scale-[0.98]"
            >
              开始我的旅程
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={handleGuest}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-transparent border border-border/30 px-5 py-3 text-[14px] text-muted-foreground hover:bg-muted/30 transition-all active:scale-[0.98]"
          >
            无需账号，直接开始
            <ChevronRight className="w-4 h-4 opacity-50" />
          </button>
        )}
      </div>

      <p className="mt-10 text-[11px] text-muted-foreground/40 text-center max-w-[240px] leading-relaxed">
        你的数据保存在本地，无需账号即可练习。
      </p>
    </div>
  );
}

export default function Auth() {
  return <AuthInner />;
}
