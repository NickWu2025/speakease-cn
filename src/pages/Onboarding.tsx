import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, CheckCircle2, Sparkles, Mic, MicOff } from "lucide-react";
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
  "Hey! Let's do a quick warm-up so I can tailor your experience. Tell me — what's a situation where you'd love to feel more confident speaking English?";

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
            strengths: ["Expressing yourself clearly", "Showing genuine curiosity"],
            areasToImprove: ["Building natural flow", "Expanding vocabulary range"],
            recommendedScenarios: ["party", "classmate"],
            coachNote: "You're already on the right track — keep showing up and you'll surprise yourself!",
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
      alert("Speech recognition is not supported in this browser. Try Chrome or Edge.");
      return;
    }
    const API = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    const rec = new API();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US";

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
      const result = await getConversationReply(diagHistoryRef.current, "classmate", "Alex");
      const aiText = result.reply;
      diagHistoryRef.current = [...diagHistoryRef.current, { role: "assistant", content: aiText }];
      setDiagMessages((prev) => [...prev, { role: "ai", text: aiText }]);
      speakAI(aiText);
    } catch {
      const fallback = "Got it! One more — how would you describe yourself in a few words?";
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
        <p className="text-[11px] text-muted-foreground/50 font-medium">Step {step} of {TOTAL_STEPS}</p>
      </div>

      <div className="flex-1 px-5 pb-8 flex flex-col">

        {/* ── Step 1: Goals ── */}
        {step === 1 && (
          <div className="flex-1 flex flex-col animate-slide-up">
            <div className="pt-4 pb-6">
              <p className="text-[13px] text-primary font-semibold uppercase tracking-wider mb-1">
                Hi {user?.name?.split(" ")[0] || "there"} 👋
              </p>
              <h2 className="text-[24px] font-heading font-bold text-foreground leading-tight">
                What's your main goal?
              </h2>
              <p className="text-muted-foreground text-[14px] mt-1.5">Pick what matters most to you right now.</p>
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

            <button
              disabled={selectedGoals.length === 0}
              onClick={() => setStep(2)}
              className="mt-6 w-full flex items-center justify-center gap-2 rounded-2xl gradient-primary px-5 py-4 text-[15px] font-semibold text-primary-foreground shadow-glow-primary transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Continue <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ── Step 2: Challenges ── */}
        {step === 2 && (
          <div className="flex-1 flex flex-col animate-slide-up">
            <div className="pt-4 pb-6">
              <h2 className="text-[24px] font-heading font-bold text-foreground leading-tight">
                What holds you back?
              </h2>
              <p className="text-muted-foreground text-[14px] mt-1.5">Pick up to 3 challenges you face.</p>
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
                Back
              </button>
              <button
                disabled={selectedChallenges.length === 0}
                onClick={() => setStep(3)}
                className="flex-1 flex items-center justify-center gap-2 rounded-2xl gradient-primary px-5 py-4 text-[15px] font-semibold text-primary-foreground shadow-glow-primary transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Continue <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: Voice diagnostic ── */}
        {step === 3 && (
          <div className="flex-1 flex flex-col animate-slide-up">
            <div className="pt-4 pb-3">
              <h2 className="text-[24px] font-heading font-bold text-foreground leading-tight">
                Quick voice warm-up
              </h2>
              <p className="text-muted-foreground text-[14px] mt-1.5">
                2 short spoken answers — just be yourself!
              </p>
            </div>

            {/* Chat bubbles */}
            <div className="flex-1 overflow-y-auto space-y-3 pb-3 min-h-0" style={{ maxHeight: "42vh" }}>
              {diagMessages.map((msg, i) => (
                <div key={i} className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                  {msg.role === "ai" && (
                    <img src={aiAvatar} alt="Alex" className="w-7 h-7 rounded-full ring-2 ring-primary/15 shrink-0 mt-0.5" />
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
                  <img src={aiAvatar} alt="Alex" className="w-7 h-7 rounded-full ring-2 ring-primary/15 shrink-0 mt-0.5" />
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

            {/* Voice controls */}
            {diagTurn < 2 ? (
              <div className="pb-4 pt-2 flex flex-col items-center gap-3">
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
                    ? "Alex is speaking…"
                    : isListening
                    ? "Tap when done speaking"
                    : diagLoading
                    ? "Alex is thinking…"
                    : "Tap the mic to respond"}
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
                  aria-label={isListening ? "Stop speaking" : "Start speaking"}
                >
                  {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                </button>
              </div>
            ) : (
              <p className="text-center text-[13px] text-muted-foreground py-4 animate-fade-in">
                Great! Generating your profile…
              </p>
            )}
          </div>
        )}

        {/* ── Step 4: Profile reveal ── */}
        {step === 4 && (
          <div className="flex-1 flex flex-col animate-slide-up">
            <div className="pt-4 pb-6">
              <h2 className="text-[24px] font-heading font-bold text-foreground leading-tight">
                {isGenerating ? "Building your profile…" : "Your SpeakFlow profile"}
              </h2>
              <p className="text-muted-foreground text-[14px] mt-1.5">
                {isGenerating ? "Analyzing your responses…" : "Personalized just for you."}
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
                <p className="text-[14px] text-muted-foreground text-center">Crafting your personal learning plan…</p>
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
                      <p className="text-[11px] font-semibold uppercase tracking-wider opacity-70">Your level</p>
                      <p className="text-[18px] font-heading font-bold">{PROFICIENCY_META[profile.proficiencyLevel].label}</p>
                    </div>
                  </div>
                  <p className="text-[13px] opacity-75">{PROFICIENCY_META[profile.proficiencyLevel].desc}</p>
                </div>

                {/* Strengths */}
                <div className="rounded-2xl bg-card border border-border/50 p-4 shadow-soft">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">Your strengths</p>
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
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">Focus areas</p>
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
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">From your coach</p>
                  <p className="text-[14px] text-secondary-foreground leading-relaxed italic">"{profile.coachNote}"</p>
                </div>

                <button
                  onClick={finishOnboarding}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl gradient-primary px-5 py-4 text-[15px] font-semibold text-primary-foreground shadow-glow-primary transition-all active:scale-[0.98]"
                >
                  Start practicing <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            ) : null}
          </div>
        )}

      </div>
    </div>
  );
}
