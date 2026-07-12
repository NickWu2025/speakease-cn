import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleLogin, GoogleOAuthProvider } from "@react-oauth/google";
import { ChevronRight } from "lucide-react";
import aiAvatar from "@/assets/ai-avatar.png";
import { useAuth } from "@/contexts/AuthContext";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? "";

function decodeJwt(token: string): Record<string, string> {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(window.atob(base64));
  } catch {
    return {};
  }
}

function AuthInner() {
  const navigate = useNavigate();
  const { signInWithGoogle, continueAsGuest } = useAuth();
  const [guestName, setGuestName] = useState("");
  const [showGuestInput, setShowGuestInput] = useState(false);

  const handleGoogleSuccess = (credentialResponse: { credential?: string }) => {
    if (!credentialResponse.credential) return;
    const payload = decodeJwt(credentialResponse.credential);
    signInWithGoogle({
      id: payload.sub,
      name: payload.name,
      email: payload.email,
      avatarUrl: payload.picture,
    });
    navigate("/onboarding");
  };

  const handleGuest = () => {
    if (!showGuestInput) {
      setShowGuestInput(true);
      return;
    }
    continueAsGuest(guestName);
    navigate("/onboarding");
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
        <h1 className="text-[2rem] font-heading font-bold text-foreground tracking-tight">易言 SpeakEase</h1>
        <p className="text-muted-foreground mt-2 text-[15px] text-center max-w-[260px] leading-relaxed">
          你的 AI 演讲叙事教练 — 从第一天起为你量身定制
        </p>
      </div>

      {/* Sign-in card */}
      <div className="w-full max-w-sm space-y-4">
        {/* Google sign-in */}
        {GOOGLE_CLIENT_ID ? (
          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => console.error("Google sign-in failed")}
              theme="outline"
              size="large"
              shape="pill"
              text="continue_with"
            />
          </div>
        ) : (
          <button
            disabled
            className="w-full flex items-center justify-center gap-3 rounded-2xl bg-card border border-border/60 px-5 py-3.5 text-[15px] font-medium text-muted-foreground shadow-soft opacity-60 cursor-not-allowed"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            使用 Google 登录
            <span className="text-[11px] text-muted-foreground/50">（需配置 VITE_GOOGLE_CLIENT_ID）</span>
          </button>
        )}

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
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-secondary px-5 py-3.5 text-[15px] font-medium text-secondary-foreground hover:bg-secondary/80 transition-all active:scale-[0.98]"
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
  return GOOGLE_CLIENT_ID ? (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthInner />
    </GoogleOAuthProvider>
  ) : (
    <AuthInner />
  );
}