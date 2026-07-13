import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, CheckCircle2, Sparkles, Mic, MicOff, Keyboard, Send } from "lucide-react";
import aiAvatar from "@/assets/ai-avatar.png";
import { useAuth } from "@/contexts/AuthContext";
import { GOALS, CHALLENGES, PROFICIENCY_META, GoalId, ChallengeId } from "@/types/profile";
import { getConversationReply, analyzeOnboardingDiagnostic, speakText, GPTMessage } from "@/lib/gpt";
import VoiceWave from "@/components/VoiceWave";

// ── Web Speech API types ──────────────────────────────────────────────
interface ISpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}
interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}
declare global {
  interface Window {
    SpeechRecognition: new () => ISpeechRecognition;
    webkitSpeechRecognition: new () => ISpeechRecognition;
  }
}

const TOTAL_STEPS = 4;

const DIAGNOSTIC_OPENER =
  "你好！我们先简单聊两句，让我了解一下你的情况。告诉我——在什么场景下你希望表达得更自信？";

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, saveProfile } = useAuth();

  const [step, setStep] = useState(1);
  const [selectedGoals, setSelectedGoals] = useState<GoalId[]>([]);
  const [selectedChallenges, setSelectedChallenges] = useState<ChallengeId[]>([]);

  // ── Diagnostic state ──────────────────────────────────────────────
  const [diagMessages, setDiagMessages] = useState<{ role: "user" | "ai"; text: string }[]>([
    { role: "ai", text: DIAGNOSTIC_OPENER },
  ]);
  const [diagTurn, setDiagTurn] = useState(0);
  const [diagLoading, setDiagLoading] = useState(false);
  const diagHistoryRef = useRef<GPTMessage[]>([{ role: "assistant", content: DIAGNOSTIC_OPENER }]);

  // ── Voice state ───────────────────────────────────────────────────
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [speechSupported] = useState(
    () => typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)
  );
  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const ttsAbortRef = useRef<AbortController | null>(null);

  // ── Text input state ─────────────────────────────────────────────
  const [inputMode, setInputMode] = useState<"voice" | "text">(
    () => (typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)) ? "voice" : "text"
  );
  const [textInput, setTextInput] = useState("");

  const chatEndRef = useRef<HTMLDivElement>(null);

  // ── Profile generation state ──────────────────────────────────────
  const [isGenerating, setIsGenerating] = useState(false);
  const [profile, setProfile] = useState<Awaited<ReturnType<typeof analyzeOnboardingDiagnostic>> | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [diagMessages]);

  // Speak the opener when step 3 is entered
  useEffect(() => {
    if (step === 3) {
      speakAI(DIAGNOSTIC_OPENER);
    }
    return () => {
      if (step === 3) {
        ttsAbortRef.current?.abort();
        recognitionRef.current?.stop();
      }
    };
  }, [step]);

  // Trigger profile generation when step 4 is entered
  useEffect(() => {
    if (step === 4 && !profile && !isGenerating) {
      setIsGenerating(true);
      analyzeOnboardingDiagnostic(diagMessages, selectedGoals, selectedChallenges)
        .then((result) => { setProfile(result); setIsGenerating(false); })
        .catch(() => {
          setProfile({
            proficiencyLevel: "intermediate",
            strengths: ["表达清晰有条理", "善于提出好问题"],
            areasToImprove: ["增强叙事的感染力", "提升即兴应变能力"],
            recommendedScenarios: ["elevator_pitch", "interview"],
            coachNote: "你已经有了很好的基础——坚持练习，你会越来越出色！",
          });
          setIsGenerating(false);
        });
    }
  }, [step]);

  // ── Helpers ───────────────────────────────────────────────────────
  const speakAI = async (text: string) => {
    ttsAbortRef.current?.abort();
    const ctrl = new AbortController();
    ttsAbortRef.current = ctrl;
    setIsSpeaking(true);
    try {
      await speakText(text, ctrl.signal);
    } catch {
      // non-fatal
    } finally {
      setIsSpeaking(false);
    }
  };

  const toggleGoal = (id: GoalId) =>
    setSelectedGoals((prev) => prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]);

  const toggleChallenge = (id: ChallengeId) =>
    setSelectedChallenges((prev) => {
      if (prev.includes(id)) return prev.filter((c) => c !== id);
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });

  // ── Voice recognition ─────────────────────────────────────────────
  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }
    if (!speechSupported) {
      alert("此浏览器不支持语音识别，请使用 Chrome 或 Edge。");
      return;
    }
    const API = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    const rec = new API();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "zh-CN";

    let finalText = "";

    rec.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) finalText += e.results[i][0].transcript;
        else interim = e.results[i][0].transcript;
      }
      setTranscript(finalText + interim);
    };

    rec.onerror = (e) => {
      if (e.error !== "aborted") console.error("Speech error:", e.error);
    };

    rec.onend = () => {
      recognitionRef.current = null;
      setIsListening(false);
      submitDiagTurn(finalText);
    };

    recognitionRef.current = rec;
    rec.start();
    setIsListening(true);
    setTranscript("");
  };

  const submitTypedTurn = () => {
    const text = textInput.trim();
    if (!text) return;
    setTextInput("");
    submitDiagTurn(text);
  };

  const submitDiagTurn = async (spokenText: string) => {
    const text = spokenText.trim();
    setTranscript("");
    if (!text) return;

    setDiagMessages((prev) => [...prev, { role: "user", text }]);
    diagHistoryRef.current = [...diagHistoryRef.current, { role: "user", content: text }];

    const turn = diagTurn + 1;
    setDiagTurn(turn);

    if (turn >= 2) {
      setTimeout(() => setStep(4), 700);
      return;
    }

    setDiagLoading(true);
    try {
      const result = await getConversationReply(diagHistoryRef.current, "classmate", "教练");
      const aiText = result.reply;
      diagHistoryRef.current = [...diagHistoryRef.current, { role: "assistant", content: aiText }];
      setDiagMessages((prev) => [...prev, { role: "ai", text: aiText }]);
      speakAI(aiText);
    } catch {
      const fallback = "明白了！再来一个——你会怎么形容自己的沟通风格？";
      setDiagMessages((prev) => [...prev, { role: "ai", text: fallback }]);
      speakAI(fallback);
    }
    setDiagLoading(false);
  };

  const finishOnboarding = () => {
    if (!user || !profile) return;
    saveProfile({
      id: user.id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
      isGuest: user.isGuest,
      goals: selectedGoals,
      challenges: selectedChallenges,
      proficiencyLevel: profile.proficiencyLevel,
      strengths: profile.strengths,
      areasToImprove: profile.areasToImprove,
      recommendedScenarios: profile.recommendedScenarios,
      coachNote: profile.coachNote,
      onboardingCompleted: true,
      createdAt: new Date().toISOString(),
    });
    navigate("/");
  };

  // ── Skip onboarding ──────────────────────────────────────────
  const handleSkip = () => {
    const userStr = localStorage.getItem("speakflow_user");
    if (!userStr) return;
    const user = JSON.parse(userStr);
    const skipProfile = {
      onboardingCompleted: true,
      proficiencyLevel: "intermediate",
      goals: ["presentation"],
      challenges: [],
      strengths: [],
      areasToImprove: [],
      recommendedScenarios: ["elevator_pitch"],
      coachNote: "用户跳过了 onboarding",
    };
    localStorage.setItem(`speakflow_profile_${user.id}`, JSON.stringify(skipProfile));
    navigate("/");
  };

  // ── Render ────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen gradient-warm flex flex-col max-w-md mx-auto">
      {/* Progress bar */}
      <div className="pt-14 px-6 pb-2">
        <div className="flex items-center gap-1.5 mb-1">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                i < step ? "bg-primary" : i === step - 1 ? "bg-primary/50" : "bg-border/40"
              }`}
            />
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground/50 font-medium">第 {step} 步，共 {TOTAL_STEPS} 步</p>
      </div>

      <div className="flex-1 px-5 pb-8 flex flex-col">

        {/* ── Step 1: Goals ── */}
        {step === 1 && (
          <div className="flex-1 flex flex-col animate-slide-up">
            <div className="pt-4 pb-6">
              <p className="text-[13px] text-primary font-semibold uppercase tracking-wider mb-1">
                你好 {user?.name?.split(" ")[0] || "朋友"} 👋
              </p>
              <h2 className="text-[24px] font-heading font-bold text-foreground leading-tight">
                你最想提升哪个方面？
              </h2>
              <p className="text-muted-foreground text-[14px] mt-1.5">选择当前对你最重要的目标。</p>
            </div>

            <div className="space-y-3 flex-1">
              {GOALS.map((goal) => {
                const active = selectedGoals.includes(goal.id);
                return (
                  <button
                    key={goal.id}
                    onClick={() => toggleGoal(goal.id)}
                    className={`w-full rounded-2xl p-5 text-left transition-all active:scale-[0.98] border-2 ${
                      active
                        ? "gradient-primary border-transparent shadow-glow-primary"
                        : "bg-card border-border/50 shadow-soft hover:border-primary/30"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-2xl">{goal.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-[16px] font-heading font-semibold ${active ? "text-primary-foreground" : "text-foreground"}`}>
                          {goal.label}
                        </p>
                        <p className={`text-[13px] mt-0.5 ${active ? "text-primary-foreground/75" : "text-muted-foreground"}`}>
                          {goal.desc}
                        </p>
                      </div>
                      {active && <CheckCircle2 className="w-5 h-5 text-primary-foreground shrink-0" />}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 flex items-center justify-between">
              <button
                onClick={handleSkip}
                className="text-[13px] text-muted-foreground hover:text-foreground transition-colors font-medium"
              >
                跳过
              </button>
              <button
                disabled={selectedGoals.length === 0}
                onClick={() => setStep(2)}
                className="flex-1 ml-4 flex items-center justify-center gap-2 rounded-2xl gradient-primary px-5 py-4 text-[15px] font-semibold text-primary-foreground shadow-glow-primary transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                继续 <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── Step 2: Challenges ── */}
        {step === 2 && (
          <div className="flex-1 flex flex-col animate-slide-up">
            <div className="pt-4 pb-6">
              <h2 className="text-[24px] font-heading font-bold text-foreground leading-tight">
                是什么在阻碍你？
              </h2>
              <p className="text-muted-foreground text-[14px] mt-1.5">选择最多 3 个你面临的挑战。</p>
            </div>

            <div className="space-y-2.5 flex-1">
              {CHALLENGES.map((c) => {
                const active = selectedChallenges.includes(c.id);
                const disabled = !active && selectedChallenges.length >= 3;
                return (
                  <button
                    key={c.id}
                    onClick={() => !disabled && toggleChallenge(c.id)}
                    className={`w-full rounded-2xl px-5 py-4 text-left text-[14px] font-medium transition-all active:scale-[0.98] border-2 ${
                      active
                        ? "bg-secondary border-primary/60 text-secondary-foreground shadow-soft"
                        : disabled
                        ? "bg-card/50 border-border/30 text-muted-foreground/40 cursor-not-allowed"
                        : "bg-card border-border/50 text-foreground hover:border-primary/30 shadow-soft"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                        active ? "bg-primary border-primary" : "border-border"
                      }`}>
                        {active && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                      {c.label}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="rounded-2xl bg-muted/60 px-5 py-4 text-[14px] font-medium text-muted-foreground transition-all hover:bg-muted"
              >
                返回
              </button>
              <button
                disabled={selectedChallenges.length === 0}
                onClick={() => setStep(3)}
                className="flex-1 flex items-center justify-center gap-2 rounded-2xl gradient-primary px-5 py-4 text-[15px] font-semibold text-primary-foreground shadow-glow-primary transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                继续 <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: Voice diagnostic ── */}
        {step === 3 && (
          <div className="flex-1 flex flex-col animate-slide-up">
            <div className="pt-4 pb-3">
              <h2 className="text-[24px] font-heading font-bold text-foreground leading-tight">
                快速语音热身
              </h2>
              <p className="text-muted-foreground text-[14px] mt-1.5">
                简短回答 2 个问题 — 做自己就好！
              </p>
            </div>

            {/* Chat bubbles */}
            <div className="flex-1 overflow-y-auto space-y-3 pb-3 min-h-0" style={{ maxHeight: "42vh" }}>
              {diagMessages.map((msg, i) => (
                <div key={i} className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                  {msg.role === "ai" && (
                    <img src={aiAvatar} alt="教练" className="w-7 h-7 rounded-full ring-2 ring-primary/15 shrink-0 mt-0.5" />
                  )}
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-[14px] leading-relaxed ${
                      msg.role === "ai"
                        ? "bg-card shadow-soft text-foreground rounded-tl-sm"
                        : "gradient-primary text-primary-foreground shadow-glow-primary rounded-tr-sm"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}

              {/* Thinking dots */}
              {diagLoading && (
                <div className="flex gap-2.5">
                  <img src={aiAvatar} alt="教练" className="w-7 h-7 rounded-full ring-2 ring-primary/15 shrink-0 mt-0.5" />
                  <div className="bg-card rounded-2xl rounded-tl-sm px-4 py-3 shadow-soft">
                    <div className="flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <div key={i} className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Turn progress dots */}
            <div className="flex gap-1.5 justify-center py-2">
              {[0, 1].map((i) => (
                <div key={i} className={`h-1.5 w-8 rounded-full transition-all ${i < diagTurn ? "bg-primary" : "bg-border/40"}`} />
              ))}
            </div>

            {/* Voice / text controls */}
            {diagTurn < 2 ? (
              <div className="pb-4 pt-2 flex flex-col items-center gap-3">
                {inputMode === "voice" ? (
                  <>
                    {/* Live transcript */}
                    {isListening && (
                      <div className="w-full flex flex-col items-center gap-2 animate-fade-in">
                        <VoiceWave active={isListening} />
                        {transcript && (
                          <p className="text-[12px] text-muted-foreground text-center max-w-[280px] leading-relaxed italic px-3 py-1.5 bg-muted/40 rounded-xl">
                            {transcript}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Status label */}
                    <p className="text-[12px] text-muted-foreground font-medium">
                      {isSpeaking
                        ? "AI 教练正在说话…"
                        : isListening
                        ? "说完后点击"
                        : diagLoading
                        ? "AI 教练正在思考…"
                        : "点击麦克风回应"}
                    </p>

                    {/* Mic button */}
                    <button
                      onClick={toggleListening}
                      disabled={isSpeaking || diagLoading}
                      className={`w-[64px] h-[64px] rounded-full flex items-center justify-center transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${
                        isListening
                          ? "gradient-primary text-primary-foreground shadow-glow-primary animate-listening-glow"
                          : "bg-card border-2 border-primary/30 text-primary hover:border-primary/60 shadow-soft animate-mic-breathe"
                      }`}
                      aria-label={isListening ? "停止说话" : "开始说话"}
                    >
                      {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                    </button>
                  </>
                ) : (
                  <div className="w-full flex flex-col items-center gap-2">
                    <p className="text-[12px] text-muted-foreground font-medium">
                      {isSpeaking ? "AI 教练正在说话…" : diagLoading ? "AI 教练正在思考…" : "输入你的回答"}
                    </p>
                    <div className="w-full flex items-center gap-2">
                      <input
                        type="text"
                        value={textInput}
                        onChange={(e) => setTextInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") submitTypedTurn(); }}
                        disabled={isSpeaking || diagLoading}
                        placeholder="输入你的回答…"
                        className="flex-1 rounded-2xl border-2 border-border/50 bg-card px-4 py-3 text-[14px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/60 disabled:opacity-40"
                      />
                      <button
                        onClick={submitTypedTurn}
                        disabled={isSpeaking || diagLoading || !textInput.trim()}
                        aria-label="发送"
                        className="w-11 h-11 shrink-0 rounded-full gradient-primary text-primary-foreground flex items-center justify-center shadow-glow-primary transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Mode toggle */}
                <button
                  onClick={() => {
                    if (isListening) recognitionRef.current?.stop();
                    setInputMode((m) => (m === "voice" ? "text" : "voice"));
                  }}
                  disabled={isSpeaking || diagLoading}
                  className="flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground hover:text-primary transition-colors disabled:opacity-40"
                >
                  {inputMode === "voice" ? (
                    <>
                      <Keyboard className="w-3.5 h-3.5" /> 改用文字输入
                    </>
                  ) : (
                    <>
                      <Mic className="w-3.5 h-3.5" /> 改用语音输入
                    </>
                  )}
                </button>
              </div>
            ) : (
              <p className="text-center text-[13px] text-muted-foreground py-4 animate-fade-in">
                很好！正在生成你的档案…
              </p>
            )}
          </div>
        )}

        {/* ── Step 4: Profile reveal ── */}
        {step === 4 && (
          <div className="flex-1 flex flex-col animate-slide-up">
            <div className="pt-4 pb-6">
              <h2 className="text-[24px] font-heading font-bold text-foreground leading-tight">
                {isGenerating ? "正在生成你的档案…" : "你的易言档案"}
              </h2>
              <p className="text-muted-foreground text-[14px] mt-1.5">
                {isGenerating ? "正在分析你的回答…" : "为你量身定制。"}
              </p>
            </div>

            {isGenerating ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-5">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full gradient-primary animate-pulse shadow-glow-primary flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-primary-foreground" />
                  </div>
                  <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl animate-mic-breathe" />
                </div>
                <p className="text-[14px] text-muted-foreground text-center">正在制定你的专属学习计划…</p>
              </div>
            ) : profile ? (
              <div className="flex-1 space-y-4 overflow-y-auto pb-2">
                {/* Level badge */}
                <div className={`rounded-2xl border p-5 shadow-soft ${PROFICIENCY_META[profile.proficiencyLevel].colorClass}`}>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">
                      {profile.proficiencyLevel === "beginner" ? "🌱" : profile.proficiencyLevel === "intermediate" ? "🔥" : "⚡"}
                    </span>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider opacity-70">你的水平</p>
                      <p className="text-[18px] font-heading font-bold">{PROFICIENCY_META[profile.proficiencyLevel].label}</p>
                    </div>
                  </div>
                  <p className="text-[13px] opacity-75">{PROFICIENCY_META[profile.proficiencyLevel].desc}</p>
                </div>

                {/* Strengths */}
                <div className="rounded-2xl bg-card border border-border/50 p-4 shadow-soft">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">你的优势</p>
                  <div className="space-y-1.5">
                    {profile.strengths.map((s, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <p className="text-[13px] text-foreground">{s}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Focus areas */}
                <div className="rounded-2xl bg-card border border-border/50 p-4 shadow-soft">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">提升方向</p>
                  <div className="space-y-1.5">
                    {profile.areasToImprove.map((a, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <div className="w-4 h-4 rounded-full bg-accent/20 flex items-center justify-center shrink-0 mt-0.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                        </div>
                        <p className="text-[13px] text-foreground">{a}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Coach note */}
                <div className="rounded-2xl bg-secondary p-4 border border-border/30 shadow-soft">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">来自你的教练</p>
                  <p className="text-[14px] text-secondary-foreground leading-relaxed italic">"{profile.coachNote}"</p>
                </div>

                <button
                  onClick={finishOnboarding}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl gradient-primary px-5 py-4 text-[15px] font-semibold text-primary-foreground shadow-glow-primary transition-all active:scale-[0.98]"
                >
                  开始练习 <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            ) : null}
          </div>
        )}

      </div>
    </div>
  );
}