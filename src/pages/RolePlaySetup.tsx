import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { ROLES, PERSONALITIES, CULTURES, SCENARIO_ROLE_DEFAULTS, RolePlayConfig } from "@/types/roleplay";

interface LocationState {
  scenarioId: string;
  scenarioTitle: string;
  partnerName: string;
}

const PARTNER_NAMES = ["张总", "李经理", "王面试官", "刘总监", "陈总", "赵经理"];

function OptionGrid({
  options,
  selected,
  onSelect,
}: {
  options: { id: string; label: string; emoji: string; desc: string }[];
  selected: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {options.map((opt) => {
        const active = selected === opt.id;
        return (
          <button
            key={opt.id}
            onClick={() => onSelect(opt.id)}
            className={`rounded-2xl p-3.5 text-left transition-all active:scale-[0.97] border-2 ${
              active
                ? "gradient-primary border-transparent shadow-glow-primary"
                : "bg-card border-border/50 shadow-soft hover:border-primary/30"
            }`}
          >
            <span className="text-xl block mb-1">{opt.emoji}</span>
            <p className={`text-[13px] font-heading font-semibold leading-tight ${active ? "text-primary-foreground" : "text-foreground"}`}>
              {opt.label}
            </p>
            <p className={`text-[11px] mt-0.5 leading-snug ${active ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
              {opt.desc}
            </p>
          </button>
        );
      })}
    </div>
  );
}

export default function RolePlaySetup() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state ?? {}) as LocationState;

  const scenarioId = state.scenarioId ?? "elevator_pitch";
  const scenarioTitle = state.scenarioTitle ?? "对话练习";
  const partnerName = state.partnerName ?? "张总";

  const defaults = SCENARIO_ROLE_DEFAULTS[scenarioId] ?? {};

  const [counterpartRole, setCounterpartRole] = useState(defaults.counterpartRole ?? "investor");
  const [personality, setPersonality] = useState(defaults.personality ?? "friendly");
  const [culturalBackground, setCulturalBackground] = useState(defaults.culturalBackground ?? "chinese_mainland");
  const [topic, setTopic] = useState("");
  const [selectedName, setSelectedName] = useState(partnerName);

  const handleStart = () => {
    const config: RolePlayConfig = {
      scenarioId,
      scenarioTitle,
      partnerName: selectedName,
      counterpartRole,
      personality,
      culturalBackground,
      topic: topic.trim() || undefined,
    };
    navigate(`/conversation?scenario=${scenarioId}`, { state: { rolePlay: config } });
  };

  return (
    <div className="min-h-screen gradient-warm flex flex-col max-w-md mx-auto">
      {/* Header */}
      <div className="pt-14 pb-2 px-6 glass sticky top-0 z-10 border-b border-border/30">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors mb-3 -ml-1"
        >
          <ArrowLeft className="w-[18px] h-[18px]" />
          <span className="text-[13px] font-medium">返回</span>
        </button>
        <h1 className="text-[1.4rem] font-heading font-bold text-foreground leading-tight">
          设置你的对话对象
        </h1>
        <p className="text-muted-foreground text-[13px] mt-0.5">{scenarioTitle}</p>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-32 space-y-6 pt-5">

        {/* Partner name */}
        <section>
          <p className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">
            对话对象姓名
          </p>
          <div className="flex gap-2 flex-wrap">
            {PARTNER_NAMES.map((name) => (
              <button
                key={name}
                onClick={() => setSelectedName(name)}
                className={`px-4 py-2 rounded-full text-[13px] font-medium transition-all border ${
                  selectedName === name
                    ? "gradient-primary text-primary-foreground border-transparent shadow-glow-primary"
                    : "bg-card border-border/50 text-foreground hover:border-primary/30"
                }`}
              >
                {name}
              </button>
            ))}
          </div>
        </section>

        {/* Counterpart role */}
        <section>
          <p className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">
            对方的角色
          </p>
          <OptionGrid options={ROLES} selected={counterpartRole} onSelect={setCounterpartRole} />
        </section>

        {/* Personality */}
        <section>
          <p className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">
            对方性格
          </p>
          <OptionGrid options={PERSONALITIES} selected={personality} onSelect={setPersonality} />
        </section>

        {/* Cultural background */}
        <section>
          <p className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">
            沟通场景
          </p>
          <OptionGrid options={CULTURES} selected={culturalBackground} onSelect={setCulturalBackground} />
        </section>

        {/* Optional topic */}
        <section>
          <p className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            话题 / 背景 <span className="normal-case font-normal text-muted-foreground/50">（可选）</span>
          </p>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder={
              scenarioId === "interview" ? "例如：某创业公司的产品经理"
              : scenarioId === "product_pitch" ? "例如：AI 教育产品"
              : scenarioId === "elevator_pitch" ? "例如：你的创业项目或产品"
              : "例如：你想要聊的话题"
            }
            className="w-full rounded-2xl bg-card border border-border/60 px-4 py-3.5 text-[14px] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all shadow-soft"
          />
        </section>

      </div>

      {/* Sticky CTA */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md px-5 pb-8 pt-4 glass border-t border-border/30">
        <button
          onClick={handleStart}
          className="w-full flex items-center justify-center gap-2 rounded-2xl gradient-primary px-5 py-4 text-[15px] font-semibold text-primary-foreground shadow-glow-primary transition-all active:scale-[0.98]"
        >
          开始对话
          <ChevronRight className="w-4 h-4" />
        </button>
        <p className="text-center text-[11px] text-muted-foreground/50 mt-2">
          与 {selectedName} · {ROLES.find(r => r.id === counterpartRole)?.emoji} {ROLES.find(r => r.id === counterpartRole)?.label} · {PERSONALITIES.find(p => p.id === personality)?.label}
        </p>
      </div>
    </div>
  );
}