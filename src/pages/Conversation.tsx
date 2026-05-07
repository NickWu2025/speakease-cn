import { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { ArrowLeft, Mic, MicOff, Square, Video, VideoOff } from "lucide-react";
import aiAvatar from "@/assets/ai-avatar.png";
import CoachingTip, { CoachingLayer, CoachingFlavor } from "@/components/CoachingTip";
import ChatBubble from "@/components/ChatBubble";
import VoiceWave from "@/components/VoiceWave";
import { getConversationReply, generateOpener, speakText, GPTMessage, CoachingDimension } from "@/lib/gpt";
import { RolePlayConfig } from "@/types/roleplay";

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
  dimension?: CoachingDimension;
}

const scenarioStarters: Record<string, { title: string; partnerName: string }> = {
  classmate:        { title: "Meeting a Classmate",   partnerName: "Alex" },
  party:            { title: "Party Conversation",    partnerName: "Jordan" },
  networking:       { title: "Networking Event",      partnerName: "Sam" },
  improv:           { title: "Improv Mode",           partnerName: "Alex" },
  humor:            { title: "Humor Practice",        partnerName: "Jamie" },
  interview:        { title: "Job Interview",         partnerName: "Morgan" },
  presentation:     { title: "Presentation Practice", partnerName: "Alex" },
  group_discussion: { title: "Group Discussion",      partnerName: "Jordan" },
};

const Conversation = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const rolePlay = (location.state as { rolePlay?: RolePlayConfig } | null)?.rolePlay;

  const mode = searchParams.get("mode") || "improv";
  const scenarioId = searchParams.get("scenario") || "improv";

  // RolePlay config can override partnerName
  const baseScenario = scenarioStarters[scenarioId] || scenarioStarters.improv;
  const scenario = rolePlay
    ? { title: rolePlay.scenarioTitle || baseScenario.title, partnerName: rolePlay.partnerName || baseScenario.partnerName }
    : baseScenario;

  const [messages, setMessages] = useState<Message[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [coachingHistory, setCoachingHistory] = useState<(CoachingEvent & { id: number; afterMessageId: number })[]>([]);
  const [status, setStatus] = useState<"idle" | "listening" | "thinking">("idle");
  const [sessionDuration, setSessionDuration] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechSupported] = useState(
    () => typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)
  );
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const gptHistoryRef = useRef<GPTMessage[]>([]);
  const msgIdRef = useRef(0);
  const nextMsgId = () => { msgIdRef.current += 1; return msgIdRef.current; };
  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const ttsAbortRef = useRef<AbortController | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const videoRef = useRef<HTMLVideoElement>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      cameraStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCameraOn(true);

      // Start recording
      recordedChunksRef.current = [];
      const recorder = new MediaRecorder(stream, { mimeType: "video/webm" });
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunksRef.current.push(e.data);
      };
      recorder.start(1000);
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch (err) {
      console.error("Camera access denied:", err);
      alert("无法访问摄像头，请检查浏览器权限设置。");
    }
  };

  const stopCamera = () => {
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current = null;
    cameraStreamRef.current?.getTracks().forEach((t) => t.stop());
    cameraStreamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setIsCameraOn(false);
    setIsRecording(false);
  };

  const toggleCamera = () => {
    if (isCameraOn) {
      stopCamera();
    } else {
      startCamera();
    }
  };

  const saveRecording = () => {
    if (recordedChunksRef.current.length === 0) return;
    const blob = new Blob(recordedChunksRef.current, { type: "video/webm" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `speakflow-${scenario.title.replace(/\s+/g, "-")}-${new Date().toISOString().slice(0, 10)}.webm`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const speakAIReply = async (text: string) => {
    ttsAbortRef.current?.abort();
    const controller = new AbortController();
    ttsAbortRef.current = controller;
    setIsSpeaking(true);
    try {
      await speakText(text, controller.signal);
    } catch {
      // TTS failure is non-fatal — conversation continues silently
    } finally {
      setIsSpeaking(false);
    }
  };

  useEffect(() => {
    timerRef.current = setInterval(() => setSessionDuration((d) => d + 1), 1000);
    // Generate a fresh random opener each session
    setStatus("thinking");
    generateOpener(scenarioId, scenario.partnerName, rolePlay).then((opener) => {
      gptHistoryRef.current = [{ role: "assistant", content: opener }];
      setMessages([{ id: 1, role: "ai", text: opener }]);
      setStatus("idle");
      speakAIReply(opener);
    }).catch(() => {
      const fallback = `Hi! I'm ${scenario.partnerName}. Nice to meet you!`;
      gptHistoryRef.current = [{ role: "assistant", content: fallback }];
      setMessages([{ id: 1, role: "ai", text: fallback }]);
      setStatus("idle");
    });
    return () => {
      clearInterval(timerRef.current);
      ttsAbortRef.current?.abort();
      mediaRecorderRef.current?.stop();
      cameraStreamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, coachingHistory]);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  const submitTurn = async (userText: string) => {
    if (!userText.trim()) {
      setIsListening(false);
      setStatus("idle");
      return;
    }

    const trimmed = userText.trim();
    setTranscript("");
    setStatus("thinking");
    setIsListening(false);

    // Capture a stable id before the state update so coaching can reference it reliably
    const userMsgId = nextMsgId();
    setMessages((prev) => [...prev, { id: userMsgId, role: "user", text: trimmed }]);

    // Add user message to GPT history
    gptHistoryRef.current = [
      ...gptHistoryRef.current,
      { role: "user", content: trimmed },
    ];

    try {
      const result = await getConversationReply(
        gptHistoryRef.current,
        scenarioId,
        scenario.partnerName,
        mode,
        rolePlay
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

      speakAIReply(result.reply);

      if (result.coaching) {
        const coachingLayerMap: Record<string, CoachingLayer> = {
          subtle: "subtle",
          rewrite: "rewrite",
          interrupt: "interrupt",
          prompt: "prompt",
        };
        const coachingFlavorMap: Record<string, CoachingFlavor> = {
          subtle: "nudge",
          rewrite: "rewrite",
          interrupt: "interrupt",
          prompt: "prompt",
        };
        setCoachingHistory((prev) => [
          ...prev,
          {
            id: Date.now(),
            afterMessageId: userMsgId,
            layer: coachingLayerMap[result.coaching!.type] ?? "subtle",
            flavor: coachingFlavorMap[result.coaching!.type] ?? "suggestion",
            text: result.coaching!.text,
            originalText: result.coaching!.original,
            dimension: result.coaching!.dimension,
          },
        ]);
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
  };

  const endSession = () => {
    recognitionRef.current?.stop();
    clearInterval(timerRef.current);
    if (isCameraOn) {
      // Stop recorder, wait for final chunks, then save
      mediaRecorderRef.current?.addEventListener("stop", saveRecording);
      stopCamera();
    }
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
    <div className="min-h-screen bg-background flex flex-col max-w-lg mx-auto relative">
      {/* Header */}
      <div className="pt-12 pb-2.5 px-5 flex items-center justify-between glass sticky top-0 z-10 border-b border-border/40">
        <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground transition-colors p-1.5 -ml-1.5 rounded-lg hover:bg-muted/50">
          <ArrowLeft className="w-[18px] h-[18px]" />
        </button>
        <div className="text-center flex-1">
          <p className="text-[14px] font-heading font-semibold text-foreground leading-tight">{scenario.title}</p>
          <div className="flex items-center justify-center gap-1.5 mt-0.5">
            <div className={`w-1.5 h-1.5 rounded-full transition-colors ${status === "listening" ? "bg-primary animate-pulse" : status === "thinking" ? "bg-accent animate-pulse" : isSpeaking ? "bg-success animate-pulse" : "bg-muted-foreground/30"}`} />
            <p className="text-[11px] text-muted-foreground font-medium">
              {status === "listening" ? "Listening…" : status === "thinking" ? `${scenario.partnerName} is thinking…` : isSpeaking ? `${scenario.partnerName} is speaking…` : "Your turn"}
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
          <p className="text-[11px] text-muted-foreground">
            {mode === "humor"
              ? "AI humor coach"
              : rolePlay
              ? `${rolePlay.counterpartRole} · ${rolePlay.personality}`
              : "AI conversation partner"}
          </p>
        </div>
        <div className="flex items-center gap-1.5 bg-coaching-soft px-2.5 py-1 rounded-full shadow-glow-coaching">
          <div className="w-1.5 h-1.5 rounded-full bg-coaching animate-pulse" />
          <span className="text-[10px] font-semibold text-coaching uppercase tracking-wider">
            {mode === "humor" ? "😄 Humor" : "Coach on"}
          </span>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
        {messages.map((msg, idx) => (
          <div key={msg.id}>
            <ChatBubble
              role={msg.role}
              text={msg.text}
              isLatest={idx === messages.length - 1}
            />
            {coachingHistory
              .filter((c) => c.afterMessageId === msg.id)
              .map((c) => (
                <div key={c.id} className="pl-10 mt-2">
                  <CoachingTip
                    layer={c.layer}
                    flavor={c.flavor}
                    text={c.text}
                    originalText={c.originalText}
                    dimension={c.dimension}
                    onDismiss={() => setCoachingHistory((prev) => prev.filter((x) => x.id !== c.id))}
                  />
                </div>
              ))}
          </div>
        ))}

        <div ref={chatEndRef} />
      </div>

      {/* Floating Camera Window */}
      {isCameraOn && (
        <div className="absolute top-[120px] right-4 z-20 rounded-xl overflow-hidden shadow-lg border border-border/40 bg-black" style={{ width: 140, height: 105 }}>
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover scale-x-[-1]"
          />
          {isRecording && (
            <div className="absolute top-1.5 left-1.5 flex items-center gap-1 bg-black/60 px-1.5 py-0.5 rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[9px] text-white font-semibold">REC</span>
            </div>
          )}
        </div>
      )}

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
            disabled={status === "thinking" || isSpeaking}
            className={`w-[64px] h-[64px] rounded-full flex items-center justify-center transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${
              isListening
                ? "gradient-primary text-primary-foreground shadow-glow-primary animate-listening-glow"
                : "bg-card border-2 border-primary/30 text-primary hover:border-primary/60 shadow-soft animate-mic-breathe"
            }`}
            aria-label={isListening ? "Stop speaking" : "Start speaking"}
          >
            {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </button>

          <button
            onClick={toggleCamera}
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${
              isCameraOn
                ? "bg-red-500/15 text-red-500 hover:bg-red-500/25"
                : "bg-muted/60 text-muted-foreground hover:bg-muted"
            }`}
            aria-label={isCameraOn ? "关闭摄像头" : "开启摄像头"}
          >
            {isCameraOn ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
          </button>
        </div>

        <p className="text-center text-[11px] text-muted-foreground/70 mt-2.5 font-medium">
          {isListening ? "Tap when done speaking" : status === "thinking" ? `Waiting for ${scenario.partnerName}…` : isSpeaking ? `${scenario.partnerName} is speaking…` : "Tap the mic to respond"}
        </p>
      </div>
    </div>
  );
};

export default Conversation;
