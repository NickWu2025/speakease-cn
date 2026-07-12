export type GoalId = "social" | "interview" | "presentation";
export type ChallengeId = "freeze" | "vocabulary" | "grammar" | "flow" | "nervous" | "natural";
export type ProficiencyLevel = "beginner" | "intermediate" | "advanced";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  isGuest: boolean;
  goals: GoalId[];
  challenges: ChallengeId[];
  proficiencyLevel: ProficiencyLevel;
  strengths: string[];
  areasToImprove: string[];
  recommendedScenarios: string[];
  coachNote: string;
  onboardingCompleted: boolean;
  createdAt: string;
}

export const GOALS: { id: GoalId; emoji: string; label: string; desc: string }[] = [
  { id: "social", emoji: "🎤", label: "演讲展示", desc: "在会议和公开场合自信表达" },
  { id: "interview", emoji: "💼", label: "面试模拟", desc: "结构化回答，用故事展示能力" },
  { id: "presentation", emoji: "🚀", label: "创业路演", desc: "向投资人和客户讲好你的故事" },
];

export const CHALLENGES: { id: ChallengeId; label: string }[] = [
  { id: "freeze", label: "我说话容易紧张，大脑空白" },
  { id: "vocabulary", label: "我讲故事没有重点，容易跑题" },
  { id: "grammar", label: "我不知道怎么组织语言，逻辑混乱" },
  { id: "flow", label: "我的表达缺乏感染力，听众没兴趣" },
  { id: "nervous", label: "我不擅长即兴发言" },
  { id: "natural", label: "我不知道如何用故事打动别人" },
];

export const PROFICIENCY_META: Record<ProficiencyLevel, { label: string; colorClass: string; desc: string }> = {
  beginner: { label: "初学者", colorClass: "text-accent bg-accent/10 border-accent/30", desc: "正在建立表达自信" },
  intermediate: { label: "成长中", colorClass: "text-coaching bg-coaching-soft border-coaching/30", desc: "适合开始实战练习" },
  advanced: { label: "精进中", colorClass: "text-primary bg-primary/10 border-primary/30", desc: "打磨自然流畅的表达" },
};

export const SCENARIO_FOR_GOAL: Record<GoalId, string> = {
  social: "elevator_pitch",
  interview: "interview",
  presentation: "product_pitch",
};