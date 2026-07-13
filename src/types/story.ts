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
  career:      { label: "职业",     emoji: "💼", cls: "bg-blue-50 text-blue-700 border-blue-100" },
  challenge:   { label: "挑战",     emoji: "💪", cls: "bg-rose-50 text-rose-700 border-rose-100" },
  achievement: { label: "成就",     emoji: "🏆", cls: "bg-amber-50 text-amber-700 border-amber-100" },
  learning:    { label: "学习",     emoji: "📚", cls: "bg-violet-50 text-violet-700 border-violet-100" },
  teamwork:    { label: "团队",     emoji: "🤝", cls: "bg-green-50 text-green-700 border-green-100" },
  leadership:  { label: "领导力",   emoji: "⭐", cls: "bg-yellow-50 text-yellow-700 border-yellow-100" },
  personal:    { label: "个人",     emoji: "❤️", cls: "bg-pink-50 text-pink-700 border-pink-100" },
  networking:  { label: "社交",     emoji: "🌐", cls: "bg-teal-50 text-teal-700 border-teal-100" },
};

export const TONE_CONFIG: Record<StoryTone, { label: string; emoji: string; desc: string }> = {
  casual:       { label: "日常",     emoji: "💬", desc: "像和朋友聊天一样讲" },
  interview:    { label: "面试",     emoji: "💼", desc: "STAR 结构，专业严谨" },
  storytelling: { label: "叙事",     emoji: "📖", desc: "生动有画面感，有叙事弧线" },
  short:        { label: "精简",     emoji: "⚡", desc: "2-3 句话，一语中的" },
};
