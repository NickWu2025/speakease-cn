export type StoryTone = "casual" | "interview" | "storytelling" | "short";

export interface StoryStructure {
  situation: string;
  challenge: string;
  action: string;
  result: string;
  insight: string;
}

export interface StoryMessage {
  role: "user" | "ai";
  text: string;
}

export interface Story {
  id: string;
  title: string;
  raw: string;
  summary: string;
  tags: string[];
  scenarioId?: string;
  scenarioTitle?: string;
  extractedAt: string;
  structure?: StoryStructure;
  versions: Partial<Record<StoryTone, string>>;
  thread: StoryMessage[];
}

export const TAG_CONFIG: Record<string, { label: string; emoji: string; cls: string }> = {
  career:      { label: "Career",      emoji: "💼", cls: "bg-blue-50 text-blue-700 border-blue-100" },
  challenge:   { label: "Challenge",   emoji: "💪", cls: "bg-rose-50 text-rose-700 border-rose-100" },
  achievement: { label: "Achievement", emoji: "🏆", cls: "bg-amber-50 text-amber-700 border-amber-100" },
  learning:    { label: "Learning",    emoji: "📚", cls: "bg-violet-50 text-violet-700 border-violet-100" },
  teamwork:    { label: "Teamwork",    emoji: "🤝", cls: "bg-green-50 text-green-700 border-green-100" },
  leadership:  { label: "Leadership",  emoji: "⭐", cls: "bg-yellow-50 text-yellow-700 border-yellow-100" },
  personal:    { label: "Personal",    emoji: "❤️", cls: "bg-pink-50 text-pink-700 border-pink-100" },
  networking:  { label: "Networking",  emoji: "🌐", cls: "bg-teal-50 text-teal-700 border-teal-100" },
};

export const TONE_CONFIG: Record<StoryTone, { label: string; emoji: string; desc: string }> = {
  casual:       { label: "Casual",       emoji: "💬", desc: "As you'd tell a friend" },
  interview:    { label: "Interview",    emoji: "💼", desc: "STAR format, professional" },
  storytelling: { label: "Storytelling", emoji: "📖", desc: "Vivid, narrative arc" },
  short:        { label: "Short",        emoji: "⚡", desc: "2–3 sentences, punchy" },
};
