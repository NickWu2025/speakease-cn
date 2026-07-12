import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { SessionRecord, computeStats, RATING_LABEL, SCENARIO_EMOJI, DimKey } from "@/lib/sessionStore";

const DIM_CONFIG: Record<DimKey, { label: string; emoji: string; bar: string; track: string }> = {
  content:  { label: "内容",   emoji: "💬", bar: "bg-blue-400",   track: "bg-blue-100" },
  structure:{ label: "结构", emoji: "🧱", bar: "bg-amber-400",  track: "bg-amber-100" },
  delivery: { label: "表达",  emoji: "🎙️", bar: "bg-violet-400", track: "bg-violet-100" },
};

const DIM_DOT: Record<string, string> = {
  strong:       "bg-green-400",
  developing:   "bg-amber-400",
  "needs-work": "bg-rose-400",
};

function formatRelative(iso: string) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days === 0) return "今天";
  if (days === 1) return "昨天";
  return `${days} 天前`;
}

interface Props {
  sessions: SessionRecord[];
  storyCount: number;
}

const ProgressWidget = ({ sessions, storyCount }: Props) => {
  const navigate = useNavigate();
  const stats = useMemo(() => computeStats(sessions), [sessions]);
  const recent = sessions.slice(0, 3);

  if (sessions.length === 0) {
    return (
      <div className="stagger-5 rounded-2xl surface-elevated border border-border/50 p-5 text-center">
        <p className="text-[26px] mb-2">📊</p>
        <p className="text-[14px] font-heading font-semibold text-foreground">还没有练习记录</p>
        <p className="text-[12px] text-muted-foreground mt-1 leading-snug">
          完成一次对话后即可在此查看进步。
        </p>
      </div>
    );
  }

  return (
    <div className="stagger-5 rounded-2xl surface-elevated border border-border/50 overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-border/40">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[13px] font-semibold text-foreground">📊 我的进步</p>
          <button
            onClick={() => navigate("/analytics")}
            className="text-[11px] text-primary font-semibold hover:underline"
          >
            完整报告 →
          </button>
        </div>
        {/* Quick stats */}
        <div className="flex gap-2">
          {[
            { value: sessions.length, label: "练习" },
            { value: storyCount,      label: "故事" },
            { value: stats?.streak ?? 0, label: "连续天数" },
          ].map((s) => (
            <div key={s.label} className="flex-1 bg-muted/30 rounded-xl py-2 text-center">
              <p className="text-[22px] font-heading font-bold text-primary leading-none">{s.value}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Dimension bars */}
      {stats && (
        <div className="px-4 py-3 space-y-2.5 border-b border-border/40">
          {(["content", "structure", "delivery"] as DimKey[]).map((dim) => {
            const cfg = DIM_CONFIG[dim];
            const d = stats.dims[dim];
            return (
              <div key={dim}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[12px] font-medium text-foreground">
                    {cfg.emoji} {cfg.label}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-muted-foreground">{RATING_LABEL[d.rating]}</span>
                    {d.trend === "up"     && <TrendingUp   className="w-3 h-3 text-green-500" />}
                    {d.trend === "down"   && <TrendingDown className="w-3 h-3 text-rose-500" />}
                    {d.trend === "stable" && <Minus        className="w-3 h-3 text-muted-foreground/40" />}
                  </div>
                </div>
                <div className={`h-1.5 rounded-full ${cfg.track}`}>
                  <div className={`h-full rounded-full ${cfg.bar}`} style={{ width: `${d.barPct}%` }} />
                </div>
              </div>
            );
          })}

          {/* Focus tip */}
          {stats.weakestDim && (
            <div className="mt-1 pt-2 border-t border-border/30">
              <p className="text-[11px] text-muted-foreground">
                💡 重点方向：{" "}
                <span className="font-semibold text-foreground">
                  {DIM_CONFIG[stats.weakestDim].label}
                </span>{" "}
                — 选择挑战这个维度的练习场景效果最好。
              </p>
            </div>
          )}
        </div>
      )}

      {/* Recent sessions */}
      <div className="px-4 py-3">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">
          最近练习
        </p>
        <div className="space-y-2.5">
          {recent.map((s) => (
            <div key={s.id} className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-muted/50 flex items-center justify-center shrink-0 text-sm">
                {SCENARIO_EMOJI[s.scenarioId ?? ""] ?? "💬"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-foreground truncate">{s.scenarioTitle}</p>
                <p className="text-[11px] text-muted-foreground">{formatRelative(s.date)}</p>
              </div>
              {/* Dim dots: 内容 · 结构 · 表达 */}
              <div className="flex gap-1 shrink-0">
                {(["content", "structure", "delivery"] as DimKey[]).map((dim) => (
                  <div
                    key={dim}
                    title={`${DIM_CONFIG[dim].label}: ${RATING_LABEL[s.dimensions[dim]]}`}
                    className={`w-2 h-2 rounded-full ${DIM_DOT[s.dimensions[dim]]}`}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProgressWidget;