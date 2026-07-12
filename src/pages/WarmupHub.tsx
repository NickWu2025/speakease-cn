import { useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronRight } from "lucide-react";

const FEATURES = [
  {
    id: "exercises",
    title: "热身练习",
    desc: "绕口令、呼吸和发声热身",
    emoji: "🎯",
    path: "/warmup/exercises",
    bgCls: "bg-blue-50",
    borderCls: "border-blue-100",
    accentCls: "text-blue-600",
    tag: null,
  },
  {
    id: "humor",
    title: "即兴幽默",
    desc: "获取随机提示 — 展现机智，获得即时反馈",
    emoji: "😄",
    path: "/conversation?mode=humor&scenario=humor",
    bgCls: "bg-amber-50",
    borderCls: "border-amber-100",
    accentCls: "text-amber-600",
    tag: "AI",
  },
  {
    id: "eye-contact",
    title: "眼神训练",
    desc: "引导练习，建立自信的眼神交流",
    emoji: "👁️",
    path: "/warmup/eye-contact",
    bgCls: "bg-violet-50",
    borderCls: "border-violet-100",
    accentCls: "text-violet-600",
    tag: null,
  },
  {
    id: "filler",
    title: "口头禅检测",
    desc: '实时检测"嗯""那个""就是说"等口头禅',
    emoji: "🚫",
    path: "/warmup/filler",
    bgCls: "bg-rose-50",
    borderCls: "border-rose-100",
    accentCls: "text-rose-600",
    tag: "实时",
  },
];

const WarmupHub = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen gradient-warm flex flex-col">
      <div className="pt-14 pb-4 px-6">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors mb-6 -ml-1"
        >
          <ArrowLeft className="w-[18px] h-[18px]" />
          <span className="text-[13px] font-medium">首页</span>
        </button>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shadow-sm">
            <span className="text-2xl">🎮</span>
          </div>
          <div>
            <h1 className="text-[1.35rem] font-heading font-bold text-foreground leading-tight">
              热身练习
            </h1>
            <p className="text-[13px] text-muted-foreground mt-0.5">
              降低开口表达的门槛
            </p>
          </div>
        </div>
      </div>

      <div className="px-5 flex-1 flex flex-col gap-3 max-w-md mx-auto w-full">
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
          选择一个练习
        </p>
        {FEATURES.map((f, i) => (
          <button
            key={f.id}
            onClick={() => navigate(f.path)}
            className={`stagger-${i + 1} group w-full rounded-2xl ${f.bgCls} border ${f.borderCls} p-5 text-left shadow-soft hover:shadow-lg transition-all active:scale-[0.98]`}
          >
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-white/60 flex items-center justify-center shrink-0 shadow-sm">
                <span className="text-xl">{f.emoji}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-[16px] font-heading font-semibold text-foreground">
                    {f.title}
                  </h2>
                  {f.tag && (
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide ${f.accentCls} bg-white/70 border ${f.borderCls}`}>
                      {f.tag}
                    </span>
                  )}
                </div>
                <p className="text-muted-foreground text-[13px] mt-0.5">{f.desc}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground/30 group-hover:translate-x-0.5 transition-all shrink-0" />
            </div>
          </button>
        ))}
      </div>
      <div className="h-10" />
    </div>
  );
};

export default WarmupHub;