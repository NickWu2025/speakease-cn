import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Camera, CameraOff, CheckCircle2 } from "lucide-react";

const PROMPTS = [
  "用 3 句话介绍你最喜欢的周末活动。",
  "最近学到了什么有趣的东西？简单说一说。",
  "描述你理想的早晨日常。",
  "如果能去世界上任何地方，你会去哪里？为什么？",
  "今年最想提升的一个技能是什么？打算怎么做？",
];

const ROUND_DURATION = 20;
const TOTAL_ROUNDS = PROMPTS.length;

type Phase = "intro" | "active" | "done";

const EyeContactTrainer = () => {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>("intro");
  const [round, setRound] = useState(0);
  const [timeLeft, setTimeLeft] = useState(ROUND_DURATION);
  const [cameraError, setCameraError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const roundRef = useRef(0);
  roundRef.current = round;

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  // Wire stream to video element once the active phase renders the <video>
  useEffect(() => {
    if (phase === "active" && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [phase]);

  // Cleanup on unmount
  useEffect(() => () => stopCamera(), []);

  // Stop camera when done
  useEffect(() => {
    if (phase === "done") stopCamera();
  }, [phase]);

  // Round timer
  useEffect(() => {
    if (phase !== "active") return;
    const id = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (roundRef.current + 1 >= TOTAL_ROUNDS) {
            setPhase("done");
            return 0;
          }
          setRound((r) => r + 1);
          return ROUND_DURATION;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [phase]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      streamRef.current = stream;
    } catch {
      setCameraError(true);
    }
    setPhase("active");
    setRound(0);
    setTimeLeft(ROUND_DURATION);
  };

  const restart = () => {
    stopCamera();
    setCameraError(false);
    setPhase("intro");
    setRound(0);
    setTimeLeft(ROUND_DURATION);
  };

  const progressPct = ((ROUND_DURATION - timeLeft) / ROUND_DURATION) * 100;

  return (
    <div className="min-h-screen gradient-warm flex flex-col">
      <div className="pt-14 pb-4 px-6">
        <button
          onClick={() => { stopCamera(); navigate("/warmup"); }}
          className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors mb-6 -ml-1"
        >
          <ArrowLeft className="w-[18px] h-[18px]" />
          <span className="text-[13px] font-medium">热身练习</span>
        </button>
        <h1 className="text-[1.35rem] font-heading font-bold text-foreground">
          眼神训练 👁️
        </h1>
        <p className="text-[13px] text-muted-foreground mt-0.5">建立自信、自然的眼神交流</p>
      </div>

      <div className="px-5 flex-1 flex flex-col gap-4 max-w-md mx-auto w-full pb-10">
        {/* ── Intro ── */}
        {phase === "intro" && (
          <div className="flex flex-col gap-4">
            <div className="rounded-2xl bg-violet-50 border border-violet-100 p-5">
              <h2 className="text-[14px] font-heading font-bold text-violet-800 mb-3">练习方式</h2>
              <div className="space-y-2.5">
                {[
                  { emoji: "📸", text: "开启你的摄像头，让你能看到自己" },
                  { emoji: "👁️", text: "直视摄像头镜头 — 而不是屏幕" },
                  { emoji: "🗣️", text: "回答 5 个提示，同时保持目光" },
                  { emoji: "⏱️", text: "每个提示 20 秒 — 保持专注和自然" },
                ].map((s, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <span className="text-base">{s.emoji}</span>
                    <p className="text-[13px] text-violet-700 leading-snug">{s.text}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl bg-card border border-border/50 p-4">
              <p className="text-[13px] text-muted-foreground leading-relaxed">
                <strong className="text-foreground">小贴士：</strong>专注看一只眼睛而不是在两只眼之间来回看。
                目标 60-70% 的眼神接触 — 一直盯着看也会让人不舒服。
              </p>
            </div>
            <button
              onClick={startCamera}
              className="gradient-primary text-primary-foreground px-8 py-3.5 rounded-full font-semibold shadow-glow-primary hover:shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <Camera className="w-4 h-4" />
              开始训练
            </button>
          </div>
        )}

        {/* ── Active ── */}
        {phase === "active" && (
          <div className="flex flex-col gap-4">
            {/* Camera view */}
            <div className="relative rounded-2xl overflow-hidden bg-slate-800 aspect-video shadow-lg">
              {!cameraError ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover scale-x-[-1]"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-white/50 gap-2">
                  <CameraOff className="w-8 h-8" />
                  <p className="text-[13px]">摄像头不可用 — 想象你的对话对象在镜头后面</p>
                </div>
              )}

              {/* Camera target dot */}
              {!cameraError && (
                <div className="absolute top-3 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 pointer-events-none">
                  <div className="w-4 h-4 rounded-full bg-white/40 border-2 border-white animate-pulse" />
                  <span className="text-[10px] text-white/70 font-semibold tracking-wide">看这里</span>
                </div>
              )}

              {/* Round badge */}
              <div className="absolute bottom-3 right-3 bg-black/40 backdrop-blur-sm rounded-full px-3 py-1">
                <span className="text-[11px] text-white font-semibold">{round + 1}/{TOTAL_ROUNDS}</span>
              </div>
            </div>

            {/* Timer bar */}
            <div>
              <div className="w-full bg-muted/50 rounded-full h-1.5">
                <div
                  className="h-full rounded-full bg-violet-500 transition-all duration-1000"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-[11px] text-muted-foreground">第 {round + 1} 轮，共 {TOTAL_ROUNDS} 轮</span>
                <span className="text-[11px] font-semibold text-violet-600">{timeLeft}秒</span>
              </div>
            </div>

            {/* Prompt */}
            <div className="rounded-2xl bg-violet-50 border border-violet-100 p-5">
              <p className="text-[10px] font-semibold text-violet-500 uppercase tracking-wider mb-2">
                看着摄像头回答：
              </p>
              <p className="text-[16px] font-heading font-semibold text-violet-900 leading-snug">
                {PROMPTS[round]}
              </p>
            </div>

            {/* Tip */}
            <div className="rounded-2xl bg-card border border-border/50 p-3 flex items-center gap-2.5">
              <span className="text-lg">💡</span>
              <p className="text-[12px] text-muted-foreground">
                看<strong className="text-foreground">摄像头镜头</strong>，而不是屏幕 — 这才是视频通话中的真正眼神交流。
              </p>
            </div>
          </div>
        )}

        {/* ── Done ── */}
        {phase === "done" && (
          <div className="flex flex-col items-center gap-5 py-6">
            <div className="w-16 h-16 rounded-2xl bg-green-50 border border-green-100 flex items-center justify-center shadow-sm">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
            <div className="text-center">
              <h2 className="text-[1.2rem] font-heading font-bold text-foreground">训练完成！🎉</h2>
              <p className="text-[13px] text-muted-foreground mt-1">
                你完成了全部 {TOTAL_ROUNDS} 轮
              </p>
            </div>
            <div className="w-full rounded-2xl bg-violet-50 border border-violet-100 p-5 space-y-3">
              <p className="text-[13px] font-heading font-bold text-violet-800">要点总结</p>
              {[
                "目标 60-70% 的眼神接触 — 不是一直盯着看",
                "专注一只眼睛会显得更自然真诚",
                "偶尔移开目光表示你在思考 — 完全正常",
                "在重要会议或演讲前多练习",
              ].map((tip, i) => (
                <div key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0 text-violet-500 opacity-70" />
                  <p className="text-[12px] text-violet-700">{tip}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-3 w-full">
              <button
                onClick={restart}
                className="flex-1 py-3 rounded-full border border-border text-[14px] font-semibold text-foreground hover:bg-muted/50 transition-all active:scale-95"
              >
                再来一次
              </button>
              <button
                onClick={() => navigate("/warmup")}
                className="flex-1 gradient-primary text-primary-foreground py-3 rounded-full text-[14px] font-semibold shadow-glow-primary hover:shadow-lg transition-all active:scale-95"
              >
                完成
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EyeContactTrainer;