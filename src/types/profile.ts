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
  { id: "social", emoji: "🎉", label: "Social & Small Talk", desc: "Connect naturally at parties and with new people" },
  { id: "interview", emoji: "💼", label: "Job Interviews", desc: "Ace interviews and professional conversations" },
  { id: "presentation", emoji: "🎤", label: "Public Speaking", desc: "Present confidently in classes and meetings" },
];

export const CHALLENGES: { id: ChallengeId; label: string }[] = [
  { id: "freeze", label: "I freeze and can't think of what to say" },
  { id: "vocabulary", label: "My vocabulary feels limited" },
  { id: "grammar", label: "I worry about making grammar mistakes" },
  { id: "flow", label: "I struggle to keep conversations going" },
  { id: "nervous", label: "I feel nervous speaking English" },
  { id: "natural", label: "I can't express myself naturally" },
];

export const PROFICIENCY_META: Record<ProficiencyLevel, { label: string; colorClass: string; desc: string }> = {
  beginner: { label: "Building Confidence", colorClass: "text-accent bg-accent/10 border-accent/30", desc: "Focused on comfort and basics" },
  intermediate: { label: "Growing Strong", colorClass: "text-coaching bg-coaching-soft border-coaching/30", desc: "Ready to tackle real scenarios" },
  advanced: { label: "Polishing Fluency", colorClass: "text-primary bg-primary/10 border-primary/30", desc: "Fine-tuning natural expression" },
};

export const SCENARIO_FOR_GOAL: Record<GoalId, string> = {
  social: "party",
  interview: "networking",
  presentation: "networking",
};
