import { useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronRight } from "lucide-react";

const scenarios = [
  {
    id: "classmate",
    title: "Meeting a Classmate",
    description: "You just sat next to someone new in class. Start a friendly conversation.",
    emoji: "👋",
    gradient: "from-[hsl(200_70%_95%)] to-[hsl(200_50%_92%)]",
  },
  {
    id: "party",
    title: "Party Conversation",
    description: "You're at a social gathering and someone approaches you. Keep it fun and light.",
    emoji: "🎉",
    gradient: "from-[hsl(340_60%_96%)] to-[hsl(340_40%_93%)]",
  },
  {
    id: "networking",
    title: "Networking Event",
    description: "You're at a professional mixer. Introduce yourself and find common ground.",
    emoji: "🤝",
    gradient: "from-[hsl(38_60%_95%)] to-[hsl(38_40%_92%)]",
  },
];

const ScenarioSelect = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen gradient-warm flex flex-col">
      {/* Header */}
      <div className="pt-14 pb-2 px-6">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors mb-6 -ml-1"
        >
          <ArrowLeft className="w-4.5 h-4.5" />
          <span className="text-[13px] font-medium">Back</span>
        </button>
        <h1 className="text-[1.5rem] font-heading font-bold text-foreground tracking-tight">
          Choose a Scenario
        </h1>
        <p className="text-muted-foreground mt-1 text-[14px]">
          Pick a social situation to practice
        </p>
      </div>

      {/* Scenarios */}
      <div className="px-5 flex-1 flex flex-col gap-3 max-w-md mx-auto w-full mt-4">
        {scenarios.map((scenario, idx) => (
          <button
            key={scenario.id}
            onClick={() => navigate(`/conversation?mode=smalltalk&scenario=${scenario.id}`)}
            className={`stagger-${idx + 1} group w-full rounded-2xl bg-gradient-to-br ${scenario.gradient} p-5 text-left border border-border/40 shadow-soft hover:shadow-lg hover:border-primary/20 transition-all active:scale-[0.98]`}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-background/80 flex items-center justify-center shrink-0 shadow-sm">
                <span className="text-2xl">{scenario.emoji}</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-[15px] font-heading font-semibold text-foreground">
                  {scenario.title}
                </h3>
                <p className="text-[13px] text-muted-foreground mt-0.5 leading-relaxed">
                  {scenario.description}
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
            </div>
          </button>
        ))}
      </div>

      <div className="h-10" />
    </div>
  );
};

export default ScenarioSelect;
