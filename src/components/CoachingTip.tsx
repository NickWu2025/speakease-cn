import { Lightbulb, Sparkles, MessageCircle, X } from "lucide-react";

interface CoachingTipProps {
  type: "suggestion" | "rewrite" | "nudge" | "humor";
  text: string;
  onDismiss: () => void;
}

const icons = {
  suggestion: Lightbulb,
  rewrite: Sparkles,
  nudge: MessageCircle,
  humor: Sparkles,
};

const labels = {
  suggestion: "Try this",
  rewrite: "More natural",
  nudge: "Quick tip",
  humor: "Playful option",
};

const CoachingTip = ({ type, text, onDismiss }: CoachingTipProps) => {
  const Icon = icons[type];
  const label = labels[type];

  return (
    <div className="rounded-xl bg-coaching-soft border border-coaching/20 px-4 py-3 relative">
      <button onClick={onDismiss} className="absolute top-2 right-2 text-coaching/50 hover:text-coaching transition-colors">
        <X className="w-3.5 h-3.5" />
      </button>
      <div className="flex items-start gap-2.5 pr-4">
        <div className="w-6 h-6 rounded-lg bg-coaching/15 flex items-center justify-center shrink-0 mt-0.5">
          <Icon className="w-3.5 h-3.5 text-coaching" />
        </div>
        <div>
          <p className="text-xs font-semibold text-coaching mb-0.5">{label}</p>
          <p className="text-sm text-foreground leading-relaxed">{text}</p>
        </div>
      </div>
    </div>
  );
};

export default CoachingTip;
