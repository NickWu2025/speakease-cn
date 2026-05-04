import { useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronRight, Settings2, Sparkles } from "lucide-react";
import { RolePlayConfig, SCENARIO_ROLE_DEFAULTS } from "@/types/roleplay";

interface ScenarioDef {
  id: string;
  title: string;
  description: string;
  emoji: string;
  badge: string;
  badgeColor: string;
  partnerName: string;
  isNew?: boolean;
  hasRolePlay?: boolean;
}

const CATEGORIES: { label: string; desc: string; scenarios: ScenarioDef[] }[] = [
  {
    label: "Everyday Conversations",
    desc: "Informal & social",
    scenarios: [
      {
        id: "classmate",
        title: "Meeting a Classmate",
        description: "Sit next to someone new in class and break the ice.",
        emoji: "👋",
        badge: "Informal",
        badgeColor: "bg-blue-100 text-blue-700",
        partnerName: "Alex",
      },
      {
        id: "party",
        title: "Party Conversation",
        description: "Someone walks up to you at a social gathering.",
        emoji: "🎉",
        badge: "Informal",
        badgeColor: "bg-pink-100 text-pink-700",
        partnerName: "Jordan",
      },
      {
        id: "networking",
        title: "Networking Event",
        description: "Professional mixer — introduce yourself and find common ground.",
        emoji: "🤝",
        badge: "Semi-formal",
        badgeColor: "bg-amber-100 text-amber-700",
        partnerName: "Sam",
      },
    ],
  },
  {
    label: "Career & Professional",
    desc: "Structured & high-stakes",
    scenarios: [
      {
        id: "interview",
        title: "Job Interview",
        description: "Answer structured questions and showcase your strengths.",
        emoji: "💼",
        badge: "Structured",
        badgeColor: "bg-indigo-100 text-indigo-700",
        partnerName: "Morgan",
        isNew: true,
        hasRolePlay: true,
      },
      {
        id: "presentation",
        title: "Give a Presentation",
        description: "Present your ideas and handle audience questions with confidence.",
        emoji: "🎤",
        badge: "One-to-many",
        badgeColor: "bg-violet-100 text-violet-700",
        partnerName: "Alex",
        isNew: true,
        hasRolePlay: true,
      },
    ],
  },
  {
    label: "Advanced Practice",
    desc: "Multi-party & complex",
    scenarios: [
      {
        id: "group_discussion",
        title: "Group Discussion",
        description: "Navigate a dynamic multi-party discussion and make your voice heard.",
        emoji: "👥",
        badge: "Multi-party",
        badgeColor: "bg-teal-100 text-teal-700",
        partnerName: "Jordan",
        isNew: true,
        hasRolePlay: true,
      },
    ],
  },
];

function buildDefaultRolePlay(scenario: ScenarioDef): RolePlayConfig {
  const defaults = SCENARIO_ROLE_DEFAULTS[scenario.id] ?? {};
  return {
    scenarioId: scenario.id,
    scenarioTitle: scenario.title,
    partnerName: scenario.partnerName,
    counterpartRole: defaults.counterpartRole ?? "peer",
    personality: defaults.personality ?? "friendly",
    culturalBackground: defaults.culturalBackground ?? "american",
  };
}

const ScenarioSelect = () => {
  const navigate = useNavigate();

  const quickStart = (scenario: ScenarioDef) => {
    const rolePlay = buildDefaultRolePlay(scenario);
    navigate(`/conversation?scenario=${scenario.id}`, { state: { rolePlay } });
  };

  const openSetup = (e: React.MouseEvent, scenario: ScenarioDef) => {
    e.stopPropagation();
    navigate("/roleplay-setup", { state: { scenarioId: scenario.id, scenarioTitle: scenario.title, partnerName: scenario.partnerName } });
  };

  return (
    <div className="min-h-screen gradient-warm flex flex-col">
      {/* Header */}
      <div className="pt-14 pb-2 px-6 max-w-md mx-auto w-full">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors mb-5 -ml-1"
        >
          <ArrowLeft className="w-[18px] h-[18px]" />
          <span className="text-[13px] font-medium">Back</span>
        </button>
        <h1 className="text-[1.5rem] font-heading font-bold text-foreground tracking-tight">
          Choose a Scenario
        </h1>
        <p className="text-muted-foreground mt-1 text-[14px]">
          Pick a situation — or customize your conversation partner
        </p>
      </div>

      {/* Categories */}
      <div className="px-5 flex-1 flex flex-col gap-6 max-w-md mx-auto w-full mt-4 pb-10">
        {CATEGORIES.map((cat) => (
          <div key={cat.label}>
            <div className="flex items-baseline gap-2 mb-3">
              <p className="text-[13px] font-heading font-semibold text-foreground">{cat.label}</p>
              <p className="text-[11px] text-muted-foreground/60">{cat.desc}</p>
            </div>

            <div className="flex flex-col gap-2.5">
              {cat.scenarios.map((scenario, idx) => (
                <button
                  key={scenario.id}
                  onClick={() => quickStart(scenario)}
                  className={`stagger-${idx + 1} group w-full rounded-2xl bg-card p-4 text-left border border-border/50 shadow-soft hover:shadow-lg hover:border-primary/20 transition-all active:scale-[0.98] relative overflow-hidden`}
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-muted/60 flex items-center justify-center shrink-0">
                      <span className="text-xl">{scenario.emoji}</span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="text-[15px] font-heading font-semibold text-foreground leading-tight">
                          {scenario.title}
                        </h3>
                        {scenario.isNew && (
                          <span className="flex items-center gap-0.5 text-[9px] font-bold bg-primary/15 text-primary px-1.5 py-0.5 rounded-full uppercase tracking-wide">
                            <Sparkles className="w-2.5 h-2.5" /> New
                          </span>
                        )}
                      </div>
                      <p className="text-[12px] text-muted-foreground leading-snug">
                        {scenario.description}
                      </p>
                      <span className={`inline-block mt-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full ${scenario.badgeColor}`}>
                        {scenario.badge}
                      </span>
                    </div>

                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                      <button
                        onClick={(e) => openSetup(e, scenario)}
                        className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground/50 hover:text-primary transition-colors px-1.5 py-0.5 rounded-lg hover:bg-primary/10"
                        aria-label="Customize role play"
                      >
                        <Settings2 className="w-3 h-3" />
                        Setup
                      </button>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ScenarioSelect;
