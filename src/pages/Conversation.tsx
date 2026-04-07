import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Mic, MicOff, Square } from "lucide-react";
import aiAvatar from "@/assets/ai-avatar.png";
import CoachingTip from "@/components/CoachingTip";
import ChatBubble from "@/components/ChatBubble";

interface Message {
  id: number;
  role: "user" | "ai";
  text: string;
}

const scenarioStarters: Record<string, { title: string; aiOpener: string }> = {
  classmate: {
    title: "Meeting a Classmate",
    aiOpener: "Hey! I think we're in the same lecture. I'm Alex — are you also majoring in CS?",
  },
  party: {
    title: "Party Conversation",
    aiOpener: "Hi there! Great party, right? I don't think we've met — I'm Jordan. How do you know the host?",
  },
  networking: {
    title: "Networking Event",
    aiOpener: "Hi! I'm Sam, I work in product design. What brings you to this event?",
  },
  improv: {
    title: "Improv Mode",
    aiOpener: "Okay, here's a random topic — if you could live in any city for a year, where would you go and why?",
  },
};

const coachingTips = [
  { id: 1, type: "suggestion" as const, text: 'Try: "That sounds interesting — how did you get into that?"' },
  { id: 2, type: "rewrite" as const, text: 'More natural: "I\'ve been really into that lately too."' },
  { id: 3, type: "nudge" as const, text: "Quick tip — ask a follow-up question here to keep it going." },
  { id: 4, type: "humor" as const, text: 'Playful version: "No way — that\'s exactly what I was thinking!"' },
];

const simulatedUserReplies = [
  "Oh yeah, I just started this semester. It's been pretty intense so far.",
  "I actually came with a friend, but they disappeared somewhere. So here I am!",
  "I think Tokyo would be amazing. The food, the culture, everything.",
  "That's a really good point. I hadn't thought about it that way.",
];

const simulatedAIFollowups = [
  "That's awesome! What's been the most challenging part so far? I found the first few weeks pretty overwhelming too.",
  "Ha, that happens! Well, you picked a good person to talk to. So what do you do when you're not at parties?",
  "Tokyo is an amazing choice! I've always wanted to visit. What specifically about the culture draws you in?",
  "I appreciate you saying that! It's actually something I read about recently. Do you read much about topics like that?",
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
  const [currentTip, setCurrentTip] = useState<typeof coachingTips[0] | null>(null);
  const [turnCount, setTurnCount] = useState(0);
  const [status, setStatus] = useState<"idle" | "listening" | "thinking">("idle");

  const simulateTurn = useCallback(() => {
    const idx = turnCount % simulatedUserReplies.length;
    
    // User message
    setMessages((prev) => [
      ...prev,
      { id: prev.length + 1, role: "user", text: simulatedUserReplies[idx] },
    ]);
    setStatus("thinking");
    setIsListening(false);

    // Show coaching tip
    setTimeout(() => {
      setCurrentTip(coachingTips[idx % coachingTips.length]);
    }, 800);

    // AI response
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { id: prev.length + 1, role: "ai", text: simulatedAIFollowups[idx] },
      ]);
      setStatus("idle");
      setTurnCount((t) => t + 1);

      // Clear tip after a bit
      setTimeout(() => setCurrentTip(null), 4000);
    }, 2000);
  }, [turnCount]);

  const toggleListening = () => {
    if (isListening) {
      // Stop → simulate turn
      simulateTurn();
    } else {
      setIsListening(true);
      setStatus("listening");
      setCurrentTip(null);
    }
  };

  const endSession = () => {
    navigate("/recap", {
      state: {
        scenario: scenario.title,
        messages,
        mode,
      },
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="pt-12 pb-3 px-5 flex items-center justify-between border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="text-center">
          <p className="text-sm font-heading font-semibold text-foreground">{scenario.title}</p>
          <p className="text-xs text-muted-foreground">
            {status === "listening" ? "Listening…" : status === "thinking" ? "AI is thinking…" : "Tap mic to speak"}
          </p>
        </div>
        <button
          onClick={endSession}
          className="text-xs font-medium text-primary bg-primary/10 px-3 py-1.5 rounded-full hover:bg-primary/20 transition-colors"
        >
          End
        </button>
      </div>

      {/* AI Partner */}
      <div className="flex justify-center pt-5 pb-2">
        <div className="relative">
          <img src={aiAvatar} alt="AI Coach" width={56} height={56} className="rounded-full" />
          {status === "thinking" && (
            <div className="absolute inset-0 rounded-full border-2 border-primary animate-pulse-ring" />
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto px-5 pb-4 space-y-3">
        {messages.map((msg) => (
          <ChatBubble key={msg.id} role={msg.role} text={msg.text} />
        ))}
      </div>

      {/* Coaching Tip */}
      {currentTip && (
        <div className="px-5 pb-2 animate-slide-up">
          <CoachingTip type={currentTip.type} text={currentTip.text} onDismiss={() => setCurrentTip(null)} />
        </div>
      )}

      {/* Voice Controls */}
      <div className="pb-10 pt-4 px-5 bg-background border-t border-border">
        <div className="flex items-center justify-center gap-6">
          <button
            onClick={endSession}
            className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
          >
            <Square className="w-5 h-5" />
          </button>

          <button
            onClick={toggleListening}
            className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-95 ${
              isListening
                ? "bg-primary text-primary-foreground shadow-primary/30"
                : "bg-card border-2 border-primary text-primary hover:bg-primary/5"
            }`}
          >
            {isListening ? <MicOff className="w-7 h-7" /> : <Mic className="w-7 h-7" />}
          </button>

          <div className="w-12 h-12" /> {/* Spacer for symmetry */}
        </div>
        {isListening && (
          <p className="text-center text-xs text-primary mt-3 animate-fade-in">Tap again when you're done speaking</p>
        )}
      </div>
    </div>
  );
};

export default Conversation;
