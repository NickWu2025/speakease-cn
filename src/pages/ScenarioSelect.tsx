import { useNavigate } from "react-router-dom";
import { ArrowLeft, Users, PartyPopper, Briefcase } from "lucide-react";

const scenarios = [
  {
    id: "classmate",
    title: "Meeting a Classmate",
    description: "You just sat next to someone new in class. Start a friendly conversation.",
    icon: Users,
    emoji: "👋",
  },
  {
    id: "party",
    title: "Party Conversation",
    description: "You're at a social gathering and someone approaches you. Keep it fun and light.",
    icon: PartyPopper,
    emoji: "🎉",
  },
  {
    id: "networking",
    title: "Networking Event",
    description: "You're at a professional mixer. Introduce yourself and find common ground.",
    icon: Briefcase,
    emoji: "🤝",
  },
];

const ScenarioSelect = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="pt-14 pb-6 px-6">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm">Back</span>
        </button>
        <h1 className="text-2xl font-heading font-bold text-foreground">
          Choose a Scenario
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Pick a social situation to practice
        </p>
      </div>

      {/* Scenarios */}
      <div className="px-6 flex-1 flex flex-col gap-4 max-w-md mx-auto w-full">
        {scenarios.map((scenario) => (
          <button
            key={scenario.id}
            onClick={() => navigate(`/conversation?mode=smalltalk&scenario=${scenario.id}`)}
            className="w-full rounded-2xl bg-card p-5 text-left border border-border shadow-sm hover:shadow-md hover:border-primary/30 transition-all active:scale-[0.98]"
          >
            <div className="flex items-start gap-4">
              <span className="text-3xl">{scenario.emoji}</span>
              <div className="flex-1">
                <h3 className="text-base font-heading font-semibold text-foreground">
                  {scenario.title}
                </h3>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                  {scenario.description}
                </p>
                <span className="inline-block mt-3 text-xs font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">
                  Start Practice →
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="h-8" />
    </div>
  );
};

export default ScenarioSelect;
