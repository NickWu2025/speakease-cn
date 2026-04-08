import { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Mic, MicOff, Square } from "lucide-react";
import aiAvatar from "@/assets/ai-avatar.png";
import CoachingTip, { CoachingLayer, CoachingFlavor } from "@/components/CoachingTip";
import ChatBubble from "@/components/ChatBubble";
import VoiceWave from "@/components/VoiceWave";
import { getConversationReply, GPTMessage } from "@/lib/gpt";

// Web Speech API type declarations
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
  const [status, setStatus] = useState<"idle" | "listening" | "thinking">("idle");
  const [sessionDuration, setSessionDuration] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [speechSupported] = useState(
    () => typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)
  );

  // GPT conversation history (excludes the initial AI opener for cleanliness)
  const gptHistoryRef = useRef<GPTMessage[]>([
    { role: "assistant", content: scenario.aiOpener },
  ]);
  const recognitionRef = useRef<ISpeechRecognition | null>(null);
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

  const submitTurn = async (userText: string) => {
    if (!userText.trim()) {
      setIsListening(false);
      setStatus("idle");
      return;
    }

    const trimmed = userText.trim();

    setMessages((prev) => [
      ...prev,
      { id: prev.length + 1, role: "user", text: trimmed },
    ]);
    setTranscript("");
    setStatus("thinking");
    setIsListening(false);
    setCurrentCoaching(null);

    // Add user message to GPT history
    gptHistoryRef.current = [
      ...gptHistoryRef.current,
      { role: "user", content: trimmed },
    ];

    try {
      const result = await getConversationReply(
        gptHistoryRef.current,
        scenarioId,
        scenario.partnerName
      );

      // Add AI reply to GPT history
      gptHistoryRef.current = [
        ...gptHistoryRef.current,
        { role: "assistant", content: result.reply },
      ];

      setMessages((prev) => [
        ...prev,
        { id: prev.length + 1, role: "ai", text: result.reply },
      ]);

      if (result.coaching) {
        const coachingLayerMap: Record<string, CoachingLayer> = {
          subtle: "subtle",
          rewrite: "rewrite",
          interrupt: "interrupt",
        };
        const coachingFlavorMap: Record<string, CoachingFlavor> = {
          subtle: "nudge",
          rewrite: "rewrite",
          interrupt: "interrupt",
        };
        setCurrentCoaching({
          layer: coachingLayerMap[result.coaching.type] ?? "subtle",
          flavor: coachingFlavorMap[result.coaching.type] ?? "suggestion",
          text: result.coaching.text,
          originalText: result.coaching.original,
        });
        setTimeout(() => setCurrentCoaching(null), 8000);
      }
    } catch (err) {
      console.error("GPT error:", err);
      setMessages((prev) => [
        ...prev,
        { id: prev.length + 1, role: "ai", text: "Sorry, I had trouble responding. Please try again." },
      ]);
    }

    setStatus("idle");
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }

    if (!speechSupported) {
      alert("Speech recognition is not supported in this browser. Try Chrome or Edge.");
      return;
    }

    const SpeechRecognitionAPI = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    let finalTranscript = "";

    recognition.onresult = (event) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interim = result[0].transcript;
        }
      }
      setTranscript(finalTranscript + interim);
    };

    recognition.onerror = (event) => {
      if (event.error !== "aborted") {
        console.error("Speech recognition error:", event.error);
      }
    };

    recognition.onend = () => {
      recognitionRef.current = null;
      submitTurn(finalTranscript);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
    setStatus("listening");
    setTranscript("");
    setCurrentCoaching(null);
  };

  const endSession = () => {
    recognitionRef.current?.stop();
    clearInterval(timerRef.current);
    navigate("/recap", {
      state: {
        scenario: scenario.title,
        scenarioId,
        messages,
        mode,
        duration: sessionDuration,
      },
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col max-w-lg mx-auto">
      {/* Header */}
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

      {/* Voice Controls */}
      <div className="pb-8 pt-3 px-5 glass border-t border-border/30">
        {isListening && (
          <div className="flex flex-col items-center gap-2 mb-3 animate-fade-in">
            <VoiceWave active={isListening} />
            {transcript && (
              <p className="text-[12px] text-muted-foreground text-center max-w-[280px] leading-relaxed italic px-3 py-1.5 bg-muted/40 rounded-xl">
                {transcript}
              </p>
            )}
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
            disabled={status === "thinking"}
            className={`w-[64px] h-[64px] rounded-full flex items-center justify-center transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${
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
