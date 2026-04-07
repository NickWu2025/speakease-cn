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

// Simulated conversation turns with layered coaching
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

    // User message
    setMessages((prev) => [
      ...prev,
      { id: prev.length + 1, role: "user", text: turn.userText },
    ]);
    setStatus("thinking");
    setIsListening(false);

    // Coaching tip appears
    setTimeout(() => {
      setCurrentCoaching(turn.coaching);
    }, turn.delay.coaching);

    // AI response
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { id: prev.length + 1, role: "ai", text: turn.aiFollowup },
      ]);
      setStatus("idle");
      setTurnCount((t) => t + 1);

      // Clear coaching after reading time
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
      {/* Header */}
      <div className="pt-12 pb-3 px-5 flex items-center justify-between border-b border-border bg-background/90 backdrop-blur-md sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground transition-colors p-1">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="text-center">
          <p className="text-sm font-heading font-semibold text-foreground">{scenario.title}</p>
          <div className="flex items-center justify-center gap-2 mt-0.5">
            <div className={`w-1.5 h-1.5 rounded-full ${status === "listening" ? "bg-primary animate-pulse" : status === "thinking" ? "bg-accent animate-pulse" : "bg-muted-foreground/40"}`} />
            <p className="text-[11px] text-muted-foreground">
              {status === "listening" ? "Listening…" : status === "thinking" ? `${scenario.partnerName} is typing…` : "Your turn"}
            </p>
            <span className="text-[11px] text-muted-foreground/60">·</span>
            <span className="text-[11px] text-muted-foreground/60 tabular-nums">{formatTime(sessionDuration)}</span>
          </div>
        </div>
        <button
          onClick={endSession}
          className="text-xs font-medium text-destructive/70 bg-destructive/8 px-3 py-1.5 rounded-full hover:bg-destructive/15 hover:text-destructive transition-colors"
        >
          End
        </button>
      </div>

      {/* AI Partner Bar */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-border/50">
        <div className="relative">
          <img src={aiAvatar} alt={scenario.partnerName} width={40} height={40} className="rounded-full ring-2 ring-primary/20" />
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-success border-2 border-background" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-heading font-semibold text-foreground">{scenario.partnerName}</p>
          <p className="text-[11px] text-muted-foreground">AI conversation partner</p>
        </div>
        <div className="flex items-center gap-1.5 bg-coaching-soft px-2.5 py-1 rounded-full">
          <div className="w-1.5 h-1.5 rounded-full bg-coaching" />
          <span className="text-[10px] font-semibold text-coaching uppercase tracking-wider">Coach active</span>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {messages.map((msg, idx) => (
          <ChatBubble
            key={msg.id}
            role={msg.role}
            text={msg.text}
            isLatest={idx === messages.length - 1}
          />
        ))}

        {/* Inline coaching — appears in flow */}
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

      {/* Voice Controls */}
      <div className="pb-8 pt-4 px-5 bg-background/95 backdrop-blur-sm border-t border-border">
        {/* Listening wave */}
        {isListening && (
          <div className="flex justify-center mb-3 animate-fade-in">
            <VoiceWave active={isListening} />
          </div>
        )}

        <div className="flex items-center justify-center gap-6">
          <button
            onClick={endSession}
            className="w-11 h-11 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
            aria-label="End session"
          >
            <Square className="w-4 h-4" />
          </button>

          <button
            onClick={toggleListening}
            className={`w-16 h-16 rounded-full flex items-center justify-center transition-all active:scale-95 ${
              isListening
                ? "bg-primary text-primary-foreground shadow-lg animate-listening-glow"
                : "bg-card border-2 border-primary text-primary hover:bg-primary/5 shadow-md"
            }`}
            aria-label={isListening ? "Stop speaking" : "Start speaking"}
          >
            {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </button>

          <div className="w-11 h-11" />
        </div>

        <p className="text-center text-[11px] text-muted-foreground mt-2.5 animate-fade-in">
          {isListening ? "Tap when done speaking" : status === "thinking" ? `Waiting for ${scenario.partnerName}…` : "Tap the mic to respond"}
        </p>
      </div>
    </div>
  );
};

export default Conversation;
