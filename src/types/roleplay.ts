export interface RolePlayConfig {
  scenarioId: string;
  scenarioTitle: string;
  partnerName: string;
  counterpartRole: string;
  personality: string;
  culturalBackground: string;
  topic?: string;
}

export interface RoleOption {
  id: string;
  label: string;
  emoji: string;
  desc: string;
}

export const ROLES: RoleOption[] = [
  { id: "interviewer", label: "Interviewer", emoji: "👔", desc: "Evaluates you for a position" },
  { id: "journalist", label: "Journalist", emoji: "📰", desc: "Asks investigative questions" },
  { id: "peer", label: "Peer", emoji: "👥", desc: "Colleague or fellow student" },
  { id: "professor", label: "Professor", emoji: "🎓", desc: "Academic mentor or educator" },
  { id: "client", label: "Client", emoji: "💼", desc: "Business client or customer" },
  { id: "manager", label: "Manager", emoji: "🏢", desc: "Your direct supervisor" },
  { id: "audience", label: "Audience", emoji: "👂", desc: "Listening to your presentation" },
  { id: "moderator", label: "Moderator", emoji: "🎤", desc: "Facilitates group discussion" },
];

export const PERSONALITIES: RoleOption[] = [
  { id: "friendly", label: "Friendly", emoji: "😊", desc: "Warm and encouraging" },
  { id: "strict", label: "Strict", emoji: "🎯", desc: "Direct and demanding" },
  { id: "analytical", label: "Analytical", emoji: "🔍", desc: "Detail-oriented, asks follow-ups" },
  { id: "encouraging", label: "Encouraging", emoji: "💪", desc: "Supportive and motivating" },
  { id: "formal", label: "Formal", emoji: "🏛️", desc: "Professional and structured" },
  { id: "casual", label: "Casual", emoji: "😌", desc: "Relaxed and informal" },
];

export const CULTURES: RoleOption[] = [
  { id: "american", label: "American", emoji: "🇺🇸", desc: "Direct, confident, results-driven" },
  { id: "british", label: "British", emoji: "🇬🇧", desc: "Reserved, understated, formal" },
  { id: "east_asian", label: "East Asian", emoji: "🌏", desc: "Respectful, indirect, group-oriented" },
  { id: "european", label: "European", emoji: "🇪🇺", desc: "Analytical, structured, direct" },
  { id: "mixed", label: "International", emoji: "🌍", desc: "Multicultural environment" },
];

export const PERSONALITY_DESC: Record<string, string> = {
  friendly: "warm, encouraging, and supportive",
  strict: "direct, demanding, and no-nonsense",
  analytical: "detail-oriented, logical, and asks probing follow-up questions",
  encouraging: "motivating, positive, and growth-focused",
  formal: "professional, structured, and formal",
  casual: "relaxed, informal, and approachable",
};

export const CULTURE_DESC: Record<string, string> = {
  american: "American communication style: direct, confident, values concrete results and brevity",
  british: "British communication style: reserved, understated, polite formality, indirect criticism",
  east_asian: "East Asian communication style: respectful, indirect, group-harmony focused, avoids confrontation",
  european: "European style: structured, analytical, values depth and intellectual rigor",
  mixed: "international multicultural environment with diverse communication styles",
};

// Sensible defaults per scenario
export const SCENARIO_ROLE_DEFAULTS: Record<string, Partial<RolePlayConfig>> = {
  interview: { counterpartRole: "interviewer", personality: "formal", culturalBackground: "american" },
  presentation: { counterpartRole: "audience", personality: "analytical", culturalBackground: "mixed" },
  group_discussion: { counterpartRole: "moderator", personality: "friendly", culturalBackground: "mixed" },
  networking: { counterpartRole: "peer", personality: "friendly", culturalBackground: "american" },
  classmate: { counterpartRole: "peer", personality: "casual", culturalBackground: "american" },
  party: { counterpartRole: "peer", personality: "casual", culturalBackground: "american" },
};
