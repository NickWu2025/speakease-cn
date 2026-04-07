import { Lightbulb, Sparkles, MessageCircle, Smile, AlertCircle, X, ArrowRight } from "lucide-react";

export type CoachingLayer = "subtle" | "rewrite" | "interrupt";
export type CoachingFlavor = "suggestion" | "rewrite" | "nudge" | "humor" | "interrupt";

interface CoachingTipProps {
  layer: CoachingLayer;
  flavor: CoachingFlavor;
  text: string;
  originalText?: string;
  onDismiss: () => void;
  onApply?: () => void;
}

const flavorConfig: Record<CoachingFlavor, {
  icon: typeof Lightbulb;
  label: string;
  colorClass: string;
  bgClass: string;
  borderClass: string;
  iconBgClass: string;
}> = {
  suggestion: {
    icon: Lightbulb,
    label: "Try this",
    colorClass: "text-coaching",
    bgClass: "bg-coaching-soft",
    borderClass: "border-coaching/15",
    iconBgClass: "bg-coaching/10",
  },
  rewrite: {
    icon: Sparkles,
    label: "More natural",
    colorClass: "text-[hsl(var(--coaching-rewrite))]",
    bgClass: "bg-[hsl(var(--coaching-rewrite-soft))]",
    borderClass: "border-[hsl(var(--coaching-rewrite)/0.15)]",
    iconBgClass: "bg-[hsl(var(--coaching-rewrite)/0.1)]",
  },
  nudge: {
    icon: MessageCircle,
    label: "Quick tip",
    colorClass: "text-coaching",
    bgClass: "bg-coaching-soft",
    borderClass: "border-coaching/15",
    iconBgClass: "bg-coaching/10",
  },
  humor: {
    icon: Smile,
    label: "Playful option",
    colorClass: "text-[hsl(var(--coaching-humor))]",
    bgClass: "bg-[hsl(var(--coaching-humor-soft))]",
    borderClass: "border-[hsl(var(--coaching-humor)/0.15)]",
    iconBgClass: "bg-[hsl(var(--coaching-humor)/0.1)]",
  },
  interrupt: {
    icon: AlertCircle,
    label: "Coach stepping in",
    colorClass: "text-[hsl(var(--coaching-interrupt))]",
    bgClass: "bg-[hsl(var(--coaching-interrupt-soft))]",
    borderClass: "border-[hsl(var(--coaching-interrupt)/0.2)]",
    iconBgClass: "bg-[hsl(var(--coaching-interrupt)/0.1)]",
  },
};

const CoachingTip = ({ layer, flavor, text, originalText, onDismiss, onApply }: CoachingTipProps) => {
  const config = flavorConfig[flavor];
  const Icon = config.icon;

  if (layer === "subtle") {
    return (
      <div className="animate-coaching-enter">
        <div className={`rounded-xl ${config.bgClass} border ${config.borderClass} px-3.5 py-2.5 flex items-center gap-2.5 shadow-sm`}>
          <div className={`w-5 h-5 rounded-md ${config.iconBgClass} flex items-center justify-center shrink-0`}>
            <Icon className={`w-3 h-3 ${config.colorClass}`} />
          </div>
          <p className="text-[13px] text-foreground flex-1 leading-snug">{text}</p>
          <button onClick={onDismiss} className="text-muted-foreground/30 hover:text-muted-foreground transition-colors shrink-0 p-0.5">
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>
    );
  }

  if (layer === "rewrite") {
    return (
      <div className="animate-coaching-enter">
        <div className={`${config.bgClass} border ${config.borderClass} rounded-2xl p-4 relative shadow-sm`}>
          <button onClick={onDismiss} className="absolute top-3 right-3 text-muted-foreground/30 hover:text-muted-foreground transition-colors p-0.5">
            <X className="w-3 h-3" />
          </button>
          <div className="flex items-center gap-2 mb-2.5">
            <div className={`w-5 h-5 rounded-lg ${config.iconBgClass} flex items-center justify-center`}>
              <Icon className={`w-3 h-3 ${config.colorClass}`} />
            </div>
            <span className={`text-[10px] font-bold ${config.colorClass} uppercase tracking-widest`}>{config.label}</span>
          </div>
          {originalText && (
            <p className="text-[13px] text-muted-foreground/60 line-through decoration-muted-foreground/20 mb-1.5 pl-0.5">
              "{originalText}"
            </p>
          )}
          <div className="flex items-start gap-2 pl-0.5">
            <ArrowRight className={`w-3 h-3 ${config.colorClass} mt-1 shrink-0`} />
            <p className="text-[13px] font-medium text-foreground leading-relaxed">{text}</p>
          </div>
          {onApply && (
            <button
              onClick={onApply}
              className={`mt-3 text-[11px] font-semibold ${config.colorClass} ${config.iconBgClass} px-3 py-1.5 rounded-full hover:opacity-80 transition-opacity`}
            >
              Use this phrase ✨
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-coaching-enter animate-interrupt-shake">
      <div className={`${config.bgClass} border-2 ${config.borderClass} rounded-2xl p-4 relative shadow-soft`}>
        <button onClick={onDismiss} className="absolute top-3 right-3 text-muted-foreground/30 hover:text-muted-foreground transition-colors p-0.5">
          <X className="w-3 h-3" />
        </button>
        <div className="flex items-center gap-2 mb-2">
          <div className={`w-6 h-6 rounded-lg ${config.iconBgClass} flex items-center justify-center`}>
            <Icon className={`w-3.5 h-3.5 ${config.colorClass}`} />
          </div>
          <span className={`text-[10px] font-bold ${config.colorClass} uppercase tracking-widest`}>{config.label}</span>
        </div>
        <p className="text-[13px] font-medium text-foreground leading-relaxed pl-0.5">{text}</p>
        {onApply && (
          <button
            onClick={onApply}
            className={`mt-3 text-[11px] font-bold ${config.colorClass} ${config.iconBgClass} px-3.5 py-1.5 rounded-full hover:opacity-80 transition-opacity`}
          >
            Got it 👍
          </button>
        )}
      </div>
    </div>
  );
};

export default CoachingTip;
