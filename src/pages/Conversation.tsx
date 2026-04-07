import { useState, useCallback, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Mic, MicOff, Square } from "lucide-react";
import aiAvatar from "@/assets/ai-avatar.png";
import CoachingTip, { CoachingLayer, CoachingFlavor } from "@/components/CoachingTip";
import ChatBubble from "@/components/ChatBubble";
import VoiceWave from "@/components/VoiceWave";

interface Message {
  id: number;
  role: "user" | "ai";
  text: string;
}

interface CoachingEvent {
  layer: CoachingLayer;
  flavor: CoachingFlavor;
  text: string;
  originalText?: string;
}

const scenarioStarters: Record<string, { title: string; partnerName: string; aiOpener: string }> = {
  classmate: {
    title: "Meeting a Classmate",
    partnerName: "Alex",
    aiOpener: "Hey! I think we're in the same lecture. I'm Alex — are you also majoring in CS?",
  },
  party: {
    title: "Party Conversation",
    partnerName: "Jordan",
    aiOpener: "Hi there! Great party, right? I don't think we've met — I'm Jordan. How do you know the host?",
  },
  networking: {
    title: "Networking Event",
    partnerName: "Sam",
    aiOpener: "Hi! I'm Sam, I work in product design. What brings you to this event?",
  },
  improv: {
    title: "Improv Mode",
    partnerName: "Alex",
    aiOpener: "Okay, here's a random topic — if you could live in any city for a year, where would you go and why?",
  },
};

const conversationScript = [
  {
    userText: "Oh yeah, I just started this semester. It's been pretty intense so far.",
    coaching: {
      layer: "subtle" as CoachingLayer,
      flavor: "suggestion" as CoachingFlavor,
      text: 'Ask about their weekend — "What have you been up to outside class?"',
    },
    aiFollowup: "I feel that! The first few weeks are always a lot. Have you found any good spots to study around campus?",
    delay: { coaching: 600, ai: 2200 },
  },
  {
    userText: "I actually came with a friend, but they disappeared somewhere. So here I am!",
    coaching: {
      layer: "rewrite" as CoachingLayer,
      flavor: "humor" as CoachingFlavor,
      text: '"My friend vanished into thin air, so I figured I\'d actually socialize for once."',
      originalText: "I actually came with a friend, but they disappeared somewhere.",
    },
    aiFollowup: "Ha, classic move! Well, lucky me — I get the good conversation then. So what do you do when you're not rescuing yourself at parties?",
    delay: { coaching: 500, ai: 2400 },
  },
  {
    userText: "I think Tokyo would be amazing. The food, the culture, everything.",
    coaching: {
      layer: "rewrite" as CoachingLayer,
      flavor: "rewrite" as CoachingFlavor,
      text: '"Honestly, I\'d pick Tokyo in a heartbeat — the street food alone would be worth it."',
      originalText: "I think Tokyo would be amazing. The food, the culture, everything.",
    },
    aiFollowup: "Amazing choice! I've been dreaming about visiting Shibuya. What specifically about the culture draws you in?",
    delay: { coaching: 700, ai: 2800 },
  },
  {
    userText: "Um... I don't know... I guess I just like it.",
    coaching: {
      layer: "interrupt" as CoachingLayer,
      flavor: "interrupt" as CoachingFlavor,
      text: "You're being too vague — try being specific! Say something like: \"I love how detailed everything is — even convenience store food is an experience.\"",
    },
    aiFollowup: "I get that! Sometimes it's just a vibe that pulls you in. For me, it's the mix of tradition and futurism — temples next to neon streets. Have you traveled much in Asia?",
    delay: { coaching: 400, ai: 3000 },
  },
  {
    userText: "Not really, but I want to. I've been saving up for it actually.",
    coaching: {
      layer: "subtle" as CoachingLayer,
      flavor: "nudge" as CoachingFlavor,
      text: "Nice! Now flip it — ask them where they'd go.",
    },
    aiFollowup: "That's awesome that you're actually making it happen! I respect that. Most people just talk about it but never plan.",
    delay: { coaching: 800, ai: 2000 },
  },
];

const Conversation = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get("mode") || "improv";
  const scenarioId = searchParams.get("scenario") || "improv";

  const scenario = scenarioStarters[scenarioId] || scenarioStarters.improv;

  const [messages, setMessages] = useState<Message[]>([
    { id: 1, role: "ai", text: scenario.aiOpener },
  ]);
  const [isListening, setIsListening] = useState(false);
  const [currentCoaching, setCurrentCoaching] = useState<CoachingEvent | null>(null);
  const [turnCount, setTurnCount] = useState(0);
  const [status, setStatus] = useState<"idle" | "listening" | "thinking">("idle");
  const [sessionDuration, setSessionDuration] = useState(0);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    timerRef.current = setInterval(() => setSessionDuration((d) => d + 1), 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, currentCoaching]);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  const simulateTurn = useCallback(() => {
    const turn = conversationScript[turnCount % conversationScript.length];

    setMessages((prev) => [
      ...prev,
      { id: prev.length + 1, role: "user", text: turn.userText },
    ]);
    setStatus("thinking");
    setIsListening(false);

    setTimeout(() => {
      setCurrentCoaching(turn.coaching);
    }, turn.delay.coaching);

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { id: prev.length + 1, role: "ai", text: turn.aiFollowup },
      ]);
      setStatus("idle");
      setTurnCount((t) => t + 1);
      setTimeout(() => setCurrentCoaching(null), 5000);
    }, turn.delay.ai);
  }, [turnCount]);

  const toggleListening = () => {
    if (isListening) {
      simulateTurn();
    } else {
      setIsListening(true);
      setStatus("listening");
      setCurrentCoaching(null);
    }
  };

  const endSession = () => {
    clearInterval(timerRef.current);
    navigate("/recap", {
      state: {
        scenario: scenario.title,
        messages,
        mode,
        duration: sessionDuration,
      },
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col max-w-lg mx-auto">
      {/* Header — frosted glass */}
      <div className="pt-12 pb-2.5 px-5 flex items-center justify-between glass sticky top-0 z-10 border-b border-border/40">
        <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground transition-colors p-1.5 -ml-1.5 rounded-lg hover:bg-muted/50">
          <ArrowLeft className="w-[18px] h-[18px]" />
        </button>
        <div className="text-center flex-1">
          <p className="text-[14px] font-heading font-semibold text-foreground leading-tight">{scenario.title}</p>
          <div className="flex items-center justify-center gap-1.5 mt-0.5">
            <div className={`w-1.5 h-1.5 rounded-full transition-colors ${status === "listening" ? "bg-primary animate-pulse" : status === "thinking" ? "bg-accent animate-pulse" : "bg-muted-foreground/30"}`} />
            <p className="text-[11px] text-muted-foreground font-medium">
              {status === "listening" ? "Listening…" : status === "thinking" ? `${scenario.partnerName} is thinking…` : "Your turn"}
            </p>
            <span className="text-[11px] text-muted-foreground/40">·</span>
            <span className="text-[11px] text-muted-foreground/40 tabular-nums font-medium">{formatTime(sessionDuration)}</span>
          </div>
        </div>
        <button
          onClick={endSession}
          className="text-[12px] font-semibold text-destructive/80 px-3 py-1.5 rounded-full hover:bg-destructive/10 transition-colors"
        >
          End
        </button>
      </div>

      {/* AI Partner Bar */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-border/30 bg-background">
        <div className="relative">
          <img src={aiAvatar} alt={scenario.partnerName} width={38} height={38} className="rounded-full ring-2 ring-primary/15 shadow-sm" />
          <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-success border-[2px] border-background" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-heading font-semibold text-foreground">{scenario.partnerName}</p>
          <p className="text-[11px] text-muted-foreground">AI conversation partner</p>
        </div>
        <div className="flex items-center gap-1.5 bg-coaching-soft px-2.5 py-1 rounded-full shadow-glow-coaching">
          <div className="w-1.5 h-1.5 rounded-full bg-coaching animate-pulse" />
          <span className="text-[10px] font-semibold text-coaching uppercase tracking-wider">Coach on</span>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
        {messages.map((msg, idx) => (
          <ChatBubble
            key={msg.id}
            role={msg.role}
            text={msg.text}
            isLatest={idx === messages.length - 1}
          />
        ))}

        {currentCoaching && (
          <div className="pl-10">
            <CoachingTip
              layer={currentCoaching.layer}
              flavor={currentCoaching.flavor}
              text={currentCoaching.text}
              originalText={currentCoaching.originalText}
              onDismiss={() => setCurrentCoaching(null)}
            />
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Voice Controls — premium bottom bar */}
      <div className="pb-8 pt-3 px-5 glass border-t border-border/30">
        {isListening && (
          <div className="flex justify-center mb-3 animate-fade-in">
            <VoiceWave active={isListening} />
          </div>
        )}

        <div className="flex items-center justify-center gap-6">
          <button
            onClick={endSession}
            className="w-11 h-11 rounded-full bg-muted/60 flex items-center justify-center text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all"
            aria-label="End session"
          >
            <Square className="w-4 h-4" />
          </button>

          <button
            onClick={toggleListening}
            className={`w-[64px] h-[64px] rounded-full flex items-center justify-center transition-all active:scale-95 ${
              isListening
                ? "gradient-primary text-primary-foreground shadow-glow-primary animate-listening-glow"
                : "bg-card border-2 border-primary/30 text-primary hover:border-primary/60 shadow-soft animate-mic-breathe"
            }`}
            aria-label={isListening ? "Stop speaking" : "Start speaking"}
          >
            {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </button>

          <div className="w-11 h-11" />
        </div>

        <p className="text-center text-[11px] text-muted-foreground/70 mt-2.5 font-medium">
          {isListening ? "Tap when done speaking" : status === "thinking" ? `Waiting for ${scenario.partnerName}…` : "Tap the mic to respond"}
        </p>
      </div>
    </div>
  );
};

export default Conversation;
