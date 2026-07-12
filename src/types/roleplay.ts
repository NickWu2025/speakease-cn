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
  { id: "investor", label: "投资人", emoji: "💰", desc: "评估你的项目价值" },
  { id: "customer", label: "客户", emoji: "🤝", desc: "考虑购买你的产品" },
  { id: "interviewer", label: "面试官", emoji: "👔", desc: "考察你的能力和潜力" },
  { id: "boss", label: "上级", emoji: "🏢", desc: "你的直属领导" },
  { id: "colleague", label: "同事", emoji: "👥", desc: "你的团队成员" },
  { id: "audience", label: "听众", emoji: "👂", desc: "听你的演讲或汇报" },
  { id: "partner", label: "合伙人", emoji: "🤜", desc: "你的创业伙伴" },
  { id: "mentor", label: "导师", emoji: "🎓", desc: "行业前辈或顾问" },
];

export const PERSONALITIES: RoleOption[] = [
  { id: "friendly", label: "友善型", emoji: "😊", desc: "温和鼓励，容易交流" },
  { id: "strict", label: "严格型", emoji: "🎯", desc: "直接提问，不留情面" },
  { id: "analytical", label: "分析型", emoji: "🔍", desc: "注重细节，追问到底" },
  { id: "encouraging", label: "鼓励型", emoji: "💪", desc: "积极支持，激发信心" },
  { id: "formal", label: "正式型", emoji: "🏛️", desc: "专业严谨，注重结构" },
  { id: "casual", label: "随和型", emoji: "😌", desc: "轻松自然，像朋友聊天" },
];

export const CULTURES: RoleOption[] = [
  { id: "chinese_mainland", label: "中国大陆", emoji: "🇨🇳", desc: "直接务实，注重效率和结果" },
  { id: "chinese_overseas", label: "海外华人", emoji: "🌏", desc: "中西融合，跨文化沟通" },
  { id: "international", label: "国际商务", emoji: "🌍", desc: "多元文化环境，英语沟通" },
  { id: "formal", label: "正式场合", emoji: "🏛️", desc: "高规格商务环境" },
  { id: "startup", label: "创业圈", emoji: "🚀", desc: "快节奏，注重创新和执行" },
];

export const PERSONALITY_DESC: Record<string, string> = {
  friendly: "温和、鼓励、善于倾听",
  strict: "直接、严格、不讲情面",
  analytical: "注重细节、逻辑性强、喜欢追问",
  encouraging: "积极正向、激发信心、关注成长",
  formal: "专业严谨、注重结构和流程",
  casual: "轻松自然、像朋友聊天一样",
};

export const CULTURE_DESC: Record<string, string> = {
  chinese_mainland: "中国大陆沟通风格：直接务实，注重效率和结果，偏好简洁有力的表达",
  chinese_overseas: "海外华人沟通风格：中西融合，跨文化视角，灵活适应不同沟通场景",
  international: "国际商务环境：多元文化背景，英语为主要工作语言，注重清晰和逻辑",
  formal: "正式商务场合：语言规范严谨，注重礼节和结构化表达",
  startup: "创业圈沟通风格：快节奏，注重创新、执行力和商业模式表达",
};

// Sensible defaults per scenario
export const SCENARIO_ROLE_DEFAULTS: Record<string, Partial<RolePlayConfig>> = {
  elevator_pitch: { counterpartRole: "investor", personality: "analytical", culturalBackground: "chinese_mainland" },
  product_pitch: { counterpartRole: "investor", personality: "strict", culturalBackground: "startup" },
  interview: { counterpartRole: "interviewer", personality: "formal", culturalBackground: "formal" },
};