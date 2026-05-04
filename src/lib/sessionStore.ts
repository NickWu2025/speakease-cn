export type DimensionRating = "strong" | "developing" | "needs-work";

export interface SessionRecord {
  id: string;
  scenarioTitle: string;
  scenarioId?: string;
  date: string; // ISO
  duration: number; // seconds
  dimensions: {
    content: DimensionRating;
    structure: DimensionRating;
    delivery: DimensionRating;
  };
}

export const RATING_SCORE: Record<DimensionRating, number> = {
  strong: 3,
  developing: 2,
  "needs-work": 1,
};

export const RATING_LABEL: Record<DimensionRating, string> = {
  strong: "Strong",
  developing: "Developing",
  "needs-work": "Focus here",
};

export const SCENARIO_EMOJI: Record<string, string> = {
  classmate:        "👋",
  party:            "🎉",
  networking:       "🤝",
  interview:        "💼",
  presentation:     "📢",
  group_discussion: "👥",
  improv:           "⚡",
};

function key(userId: string) {
  return `speakflow_sessions_${userId}`;
}

export function loadSessions(userId: string): SessionRecord[] {
  try {
    return JSON.parse(localStorage.getItem(key(userId)) ?? "[]") as SessionRecord[];
  } catch {
    return [];
  }
}

export function saveSessionRecord(userId: string, record: SessionRecord): void {
  const sessions = loadSessions(userId);
  sessions.unshift(record);
  localStorage.setItem(key(userId), JSON.stringify(sessions.slice(0, 100)));
}

// ── Analytics helpers ─────────────────────────────────────────────────

export type DimKey = "content" | "structure" | "delivery";

export interface DimStats {
  avgScore: number;
  rating: DimensionRating;
  trend: "up" | "down" | "stable";
  barPct: number; // 15–95
}

export interface ProgressStats {
  totalSessions: number;
  streak: number;
  dims: Record<DimKey, DimStats>;
  weakestDim: DimKey;
  topScenarioTitle?: string;
}

function scoreToRating(score: number): DimensionRating {
  if (score >= 2.5) return "strong";
  if (score >= 1.5) return "developing";
  return "needs-work";
}

function scoreToBarPct(score: number): number {
  return Math.round(((score - 1) / 2) * 80 + 15);
}

export function computeStats(sessions: SessionRecord[]): ProgressStats | null {
  if (sessions.length === 0) return null;

  // Streak: consecutive days ending today
  const days = [...new Set(sessions.map((s) => new Date(s.date).toDateString()))];
  let streak = 0;
  const cursor = new Date();
  while (days.includes(cursor.toDateString())) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }

  // Top scenario
  const counts = sessions.reduce<Record<string, number>>((acc, s) => {
    if (s.scenarioTitle) acc[s.scenarioTitle] = (acc[s.scenarioTitle] ?? 0) + 1;
    return acc;
  }, {});
  const topScenarioTitle = Object.entries(counts).sort(([, a], [, b]) => b - a)[0]?.[0];

  // Per-dim
  const dimKeys: DimKey[] = ["content", "structure", "delivery"];
  const dims = {} as Record<DimKey, DimStats>;
  let weakScore = 4;
  let weakestDim: DimKey = "delivery";

  for (const dim of dimKeys) {
    const scores = sessions.map((s) => RATING_SCORE[s.dimensions[dim]]);
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;

    let trend: "up" | "down" | "stable" = "stable";
    if (sessions.length >= 4) {
      const recent = scores.slice(0, 3).reduce((a, b) => a + b, 0) / 3;
      const older = scores.slice(3).reduce((a, b) => a + b, 0) / scores.slice(3).length;
      const diff = recent - older;
      trend = diff > 0.25 ? "up" : diff < -0.25 ? "down" : "stable";
    }

    dims[dim] = { avgScore: avg, rating: scoreToRating(avg), trend, barPct: scoreToBarPct(avg) };
    if (avg < weakScore) { weakScore = avg; weakestDim = dim; }
  }

  return { totalSessions: sessions.length, streak, dims, weakestDim, topScenarioTitle };
}

export function computeReadiness(stats: ProgressStats): Record<"social" | "interview" | "presentation", string> {
  const { dims } = stats;
  const rate = (score: number) =>
    score >= 2.5 ? "Ready ✓" : score >= 1.8 ? "Almost there" : "Keep practicing";

  return {
    social:       rate((dims.content.avgScore + dims.delivery.avgScore) / 2),
    interview:    rate((dims.content.avgScore + dims.structure.avgScore + dims.delivery.avgScore) / 3),
    presentation: rate((dims.structure.avgScore + dims.delivery.avgScore) / 2),
  };
}
