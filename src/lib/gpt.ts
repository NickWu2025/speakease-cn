import OpenAI from "openai";
import { RolePlayConfig, PERSONALITY_DESC, CULTURE_DESC } from "@/types/roleplay";

// Doubao (Volcengine Ark) client for chat completions
const doubaoClient = new OpenAI({
  apiKey: import.meta.env.VITE_DOUBAO_API_KEY ?? "",
  baseURL: "https://ark.cn-beijing.volces.com/api/v3",
  dangerouslyAllowBrowser: true, // demo only — move to backend for production
});

// OpenAI client for TTS fallback
const client = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY ?? "",
  dangerouslyAllowBrowser: true,
});

export interface GPTMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export type CoachingDimension = "content" | "structure" | "delivery";

export interface ConversationTurnResult {
  reply: string;
  coaching: {
    type: "subtle" | "rewrite" | "interrupt" | "prompt";
    dimension: CoachingDimension;
    text: string;
    improved?: string;
    original?: string;
  } | null;
}

export interface DimensionFeedback {
  rating: "strong" | "developing" | "needs-work";
  observations: string[];
  tip: string;
}

export interface RecapAnalysis {
  dimensions: {
    content: DimensionFeedback;
    structure: DimensionFeedback;
    delivery: DimensionFeedback;
  };
  moments: { original: string; improved: string; reason: string; dimension: CoachingDimension }[];
  phrases: string[];
  encouragement: string;
}

const SCENARIO_DESCRIPTIONS: Record<string, string> = {
  elevator_pitch: "在电梯里遇到投资人，只有30秒时间介绍自己的项目",
  product_pitch: "向投资人和客户做完整的产品路演展示",
  interview: "一场正式的求职面试，面试官用行为面试法提问",
  group_discussion: "一场结构化的多人小组讨论",
  classmate: "两个同学在课堂上破冰交谈",
  party: "在社交聚会上认识新朋友",
  networking: "在行业交流活动中认识新伙伴",
  presentation: "一场面向听众的专业演讲",
};

// Shared coaching JSON schema injected into every system prompt
const COACHING_SCHEMA = `
当需要给出教练建议时，使用以下 JSON 格式，并务必设置 "dimension"：
{
  "type": "subtle" | "rewrite" | "interrupt" | "prompt",
  "dimension": "content" | "structure" | "delivery",
  "text": "<建议或引导性问题>",
  "original": "<用户的原话，仅当 type 为 'rewrite' 时>",
  "improved": "<更优的表达版本，仅当 type 为 'rewrite' 时>"
}
类型说明（选择最合适的一个）：
- "subtle" → 小的行内建议，关于措辞、用词或表达方式
- "rewrite" → 建议一个更好的表达方式（需要 original + improved 字段）
- "interrupt" → 用户当前需要立刻纠正的重要问题
- "prompt" → 一个简短的引导性问题（以"？"结尾），帮助用户打开更好的思路方向

维度说明（选择最合适的一个）：
- "content" → 内容维度：故事是否有吸引力？信息是否清晰？观点是否有力？核心信息是否传达到位？
- "structure" → 结构维度：开头是否抓人？有无冲突和高潮？结尾是否有启发？是否符合 STAR 等叙事框架？逻辑是否连贯？
- "delivery" → 表达维度：语速和节奏变化、停顿的运用、情绪起伏、互动感、表达的自信程度`;

function buildRolePlayContext(rolePlay: RolePlayConfig): string {
  const personalityLine = PERSONALITY_DESC[rolePlay.personality] ?? rolePlay.personality;
  const cultureLine = CULTURE_DESC[rolePlay.culturalBackground] ?? rolePlay.culturalBackground;
  const topicLine = rolePlay.topic ? `\n话题/背景：${rolePlay.topic}` : "";
  return `你的性格：${personalityLine}。\n沟通场景：${cultureLine}。${topicLine}`;
}

function buildInterviewPrompt(partnerName: string, rolePlay: RolePlayConfig): string {
  const ctx = buildRolePlayContext(rolePlay);
  return `你是${partnerName}，一位${rolePlay.counterpartRole}，正在进行一场求职面试${rolePlay.topic ? `，应聘${rolePlay.topic}岗位` : ""}。
${ctx}

你的职责：
1. 每次只问一个有针对性的面试问题 — 交替使用行为面试题（"请讲一次你经历过的…"）、情境题（"如果遇到…你会怎么处理？"）和能力面试题
2. 对回答做出真实反应 — 认可好的地方，追问模糊或不完整的回答
3. 保持面试的真实性和适当的挑战性
4. **你必须用中文进行对话**

用户的回答后，自然地继续面试。大部分回合（约70%）给出教练建议 — 即使好的回答也可以给予正面强化加一个具体改进点。只有在真正出色、无需补充时才返回 coaching: null。
${COACHING_SCHEMA}

仅返回 JSON 对象：
{ "reply": "<你的面试官回应和下一个问题>", "coaching": null }
或带建议的（聚焦 STAR 结构、具体性、自信度）：
{ "reply": "<你的面试官回应>", "coaching": { ...coachingShape } }`;
}

function buildPresentationPrompt(partnerName: string, rolePlay: RolePlayConfig): string {
  const ctx = buildRolePlayContext(rolePlay);
  return `你是${partnerName}，一位听众${rolePlay.topic ? `，在听一场关于${rolePlay.topic}的演讲` : ""}。
${ctx}

你的角色：
1. 第一轮：热情邀请用户开始 — "欢迎！请随时开始你的演讲。"
2. 用户演讲的每一段之后：真实反应 — 注意有趣的点，提问或温和地质疑薄弱之处
3. 保持听众的动态感：根据你的性格，有时热情，有时质疑
4. 教练建议聚焦于：清晰度、逻辑结构、听众互动、自信信号

**你必须用中文进行对话**

${COACHING_SCHEMA}

仅返回 JSON 对象：
{ "reply": "<你的听众反应和追问>", "coaching": null }
或: { "reply": "<你的反应>", "coaching": { ...coachingShape } }`;
}

function buildGroupDiscussionPrompt(partnerName: string, rolePlay: RolePlayConfig): string {
  const ctx = buildRolePlayContext(rolePlay);
  return `你是${partnerName}，一场小组讨论的主持人/参与者${rolePlay.topic ? `，讨论主题：${rolePlay.topic}` : ""}。
${ctx}

模拟真实的多人场景，偶尔引用其他参与者的反应（例如"张总刚才提了一个很好的反面观点"或"组里有几个人在点头，但李经理似乎有疑问"）。

你的角色：
1. 第一轮：介绍讨论话题并邀请用户分享观点
2. 对用户的发言做出反应 — 同意、质疑或用不同角度补充
3. 保持讨论的动态和智力挑战
4. 教练建议聚焦于：清晰表达观点、有力支撑论据、在群体中自信参与

**你必须用中文进行对话**

${COACHING_SCHEMA}

仅返回 JSON 对象：
{ "reply": "<你的主持人/群体回应>", "coaching": null }
或: { "reply": "<你的回应>", "coaching": { ...coachingShape } }`;
}

export async function generateOpener(
  scenarioId: string,
  partnerName: string,
  rolePlay?: RolePlayConfig
): Promise<string> {
  const roleCtx = rolePlay ? `\n${buildRolePlayContext(rolePlay)}` : "";

  const openerContexts: Record<string, string> = {
    elevator_pitch: `你是${partnerName}，一位投资人，在电梯里碰到了一位创业者。你只有一分钟时间听对方介绍项目。用中文开始一段自然但带有审视感的对话。${roleCtx}`,
    product_pitch: `你是${partnerName}，一位严谨的投资人/客户，正在听一位创业者做产品路演。用中文开始对话。${roleCtx}`,
    interview: `你是${partnerName}，一位${rolePlay?.counterpartRole ?? "面试官"}，即将开始一场求职面试${rolePlay?.topic ? `，应聘${rolePlay.topic}岗位` : ""}。${roleCtx}\n用中文专业地开场：问候候选人，简单介绍自己，并问出第一个面试问题。`,
    classmate: `你是${partnerName}，一位友好的同学，刚在教室里坐下。用中文开始一段自然的对话。${roleCtx}`,
    party: `你是${partnerName}，一位社交聚会的嘉宾，刚走到某人身边。用中文开始一段友好的对话。${roleCtx}`,
    networking: `你是${partnerName}，一位行业交流活动的专业人士。用中文开始一段专业但温暖的对话。${roleCtx}`,
    improv: `你是${partnerName}，开始一段有趣、开放的对话。多变每次开场。${roleCtx}`,
    humor: `你是${partnerName}，一位幽默教练。生成一个新鲜的幽默练习提示给用户。保持轻松、具体、直接可用。`,
    presentation: `你是${partnerName}，一位听众${rolePlay?.topic ? `，在听一场关于${rolePlay.topic}的演讲` : ""}。${roleCtx}\n用中文热情地欢迎演讲者并邀请开始。`,
    group_discussion: `你是${partnerName}，主持一场小组讨论${rolePlay?.topic ? `，讨论主题：${rolePlay.topic}` : ""}。${roleCtx}\n开场：简要介绍话题并邀请用户分享观点。`,
  };

  const context = openerContexts[scenarioId] ?? openerContexts.improv;

  const response = await doubaoClient.chat.completions.create({
    model: "ep-20260713140908-gltxz",
    messages: [
      {
        role: "system",
        content: `${context}\n\n仅返回 JSON 对象：{ "opener": "<你的开场白>" }\n保持 1-3 句话。语气自然像真人。不要每次都一样 — 多变开场方式。`,
      },
      { role: "user", content: "生成一段新鲜、多样的开场白。" },
    ],
    response_format: { type: "json_object" },
    temperature: 1.1,
  });

  const raw = response.choices[0].message.content ?? '{"opener": "你好！很高兴认识你。"}';
  const parsed = JSON.parse(raw) as { opener: string };
  return parsed.opener;
}

export async function getConversationReply(
  history: GPTMessage[],
  scenarioId: string,
  partnerName: string,
  mode?: string,
  rolePlay?: RolePlayConfig
): Promise<ConversationTurnResult> {
  const scenarioDesc = SCENARIO_DESCRIPTIONS[scenarioId] ?? "两个人在进行一段对话";
  const isHumor = mode === "humor" || scenarioId === "humor";

  let systemPrompt: string;

  if (isHumor) {
    systemPrompt = `你是${partnerName}，一位温暖鼓励的幽默教练，帮助用户练习幽默和机智。

用户刚回应了一个幽默提示。你的职责：
1. 简短真诚地评价他们的回应 — 有趣吗？巧妙吗？出人意料吗？（一句话，要具体）
2. 简要解释他们用了或错过了什么幽默技巧（如反转预期、回扣、节奏、文字游戏）
3. 然后介绍一个新的幽默提示

保持轻松积极的氛围。

**你必须用中文进行对话**

${COACHING_SCHEMA}

仅返回 JSON 对象：
{ "reply": "<你的评价 + 新的幽默提示>", "coaching": null }
或: { "reply": "<你的评价>", "coaching": { ...coachingShape } }
大部分回合（约70%）给出教练建议 — 即使有趣的回应也可以获得正面强化加一个技巧微调。只有真正出色、无需补充时才返回 coaching: null。`;
  } else if (scenarioId === "interview" && rolePlay) {
    systemPrompt = buildInterviewPrompt(partnerName, rolePlay);
  } else if (scenarioId === "presentation" && rolePlay) {
    systemPrompt = buildPresentationPrompt(partnerName, rolePlay);
  } else if (scenarioId === "group_discussion" && rolePlay) {
    systemPrompt = buildGroupDiscussionPrompt(partnerName, rolePlay);
  } else {
    const roleCtx = rolePlay ? `\n${buildRolePlayContext(rolePlay)}` : "";
    systemPrompt = `你是${partnerName}，在一个场景中扮演角色：${scenarioDesc}。${roleCtx}

你的职责是进行一段自然、有吸引力的对话。回复保持 1-3 句话。适时追问。

**你必须用中文进行对话**

${COACHING_SCHEMA}

仅返回 JSON 对象：
{ "reply": "<你作为${partnerName}的对话回应>", "coaching": null }
或如果有有用的建议：
{ "reply": "<你的回应>", "coaching": { ...coachingShape } }
大部分回合（约70%）给出教练建议 — 即使好的回应也可以获得具体的正面强化加一个改进点。只有真正出色、无需补充时才返回 coaching: null。`;
  }

  const response = await doubaoClient.chat.completions.create({
    model: "ep-20260713140908-gltxz",
    messages: [{ role: "system", content: systemPrompt }, ...history],
    response_format: { type: "json_object" },
    temperature: 0.85,
  });

  const raw = response.choices[0].message.content ?? "{}";
  const parsed = JSON.parse(raw) as ConversationTurnResult;
  return parsed;
}

export async function analyzeSession(
  messages: { role: "user" | "ai"; text: string }[],
  scenarioTitle: string
): Promise<RecapAnalysis> {
  const transcript = messages
    .map((m) => `${m.role === "user" ? "用户" : "AI 对话伙伴"}：${m.text}`)
    .join("\n");

  const systemPrompt = `你是易言 SpeakEase 的 AI 演讲叙事教练。分析这段来自"${scenarioTitle}"会话的对话记录。

从 3 个维度构建反馈。聚焦于叙事和表达质量，而非语法。

仅返回以下 JSON 格式：
{
  "dimensions": {
    "content": {
      "rating": "strong" | "developing" | "needs-work",
      "observations": ["<从对话中的具体观察>", "<第二个观察>"],
      "tip": "<一个可操作的建议来改善内容清晰度或表达力>"
    },
    "structure": {
      "rating": "strong" | "developing" | "needs-work",
      "observations": ["<关于回答组织或流畅度的观察>", "<第二个观察>"],
      "tip": "<一个可操作的建议来改善逻辑或完整性>"
    },
    "delivery": {
      "rating": "strong" | "developing" | "needs-work",
      "observations": ["<关于语气、自信或互动的观察>", "<第二个观察>"],
      "tip": "<一个可操作的建议来改善表达或互动>"
    }
  },
  "moments": [
    {
      "original": "<用户说的原话>",
      "improved": "<更自然/更有表现力的版本>",
      "reason": "<简要解释>",
      "dimension": "content" | "structure" | "delivery"
    }
  ],
  "phrases": ["<可复用表达 1>", "<可复用表达 2>", "<可复用表达 3>"],
  "encouragement": "<一句温暖、具体的鼓励，基于他们做得好的地方>"
}

规则：
- 维度评级："strong" = 一直很好，"developing" = 有努力和成长空间，"needs-work" = 明显需要改进
- "moments"：2-4 个来自对话的真实时刻，用用户原话 — 每个标记最相关的维度
- "phrases"：3 个这次对话中值得复用的自然中文表达
- 要具体到这次实际对话，不要给泛泛建议`;

  const response = await doubaoClient.chat.completions.create({
    model: "ep-20260713140908-gltxz",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: `对话记录：\n\n${transcript}` },
    ],
    response_format: { type: "json_object" },
    temperature: 0.7,
  });

  const raw = response.choices[0].message.content ?? "{}";
  return JSON.parse(raw) as RecapAnalysis;
}

export interface DiagnosticResult {
  proficiencyLevel: "beginner" | "intermediate" | "advanced";
  strengths: string[];
  areasToImprove: string[];
  recommendedScenarios: string[];
  coachNote: string;
}

export async function analyzeOnboardingDiagnostic(
  conversation: { role: "user" | "ai"; text: string }[],
  goals: string[],
  challenges: string[]
): Promise<DiagnosticResult> {
  const transcript = conversation
    .map((m) => `${m.role === "user" ? "学习者" : "教练"}：${m.text}`)
    .join("\n");

  const response = await doubaoClient.chat.completions.create({
    model: "ep-20260713140908-gltxz",
    messages: [
      {
        role: "system",
        content: `你是易言 SpeakEase 的 AI 演讲叙事教练。分析这段来自新用户的简短诊断对话，他们想提升演讲和沟通表达能力。

用户的目标：${goals.join(", ")}
用户的挑战：${challenges.join(", ")}

根据对话评估用户水平并创建学习档案。

仅返回 JSON 对象：
{
  "proficiencyLevel": "beginner" | "intermediate" | "advanced",
  "strengths": ["<从回答中观察到的 2 个具体优势>"],
  "areasToImprove": ["<2 个具体改进方向>"],
  "recommendedScenarios": ["<最佳场景 id：elevator_pitch, product_pitch, interview>", "<第二佳>"],
  "coachNote": "<一句温暖、个性化的鼓励，基于你观察到的内容>"
}

水平指南：
- beginner：回答简短，表达基础，逻辑需要加强
- intermediate：能完整表达，有一定逻辑，偶有不足
- advanced：表达流畅自然，有叙事意识，表现力强`,
      },
      { role: "user", content: `诊断对话记录：\n\n${transcript}` },
    ],
    response_format: { type: "json_object" },
    temperature: 0.7,
  });

  const raw = response.choices[0].message.content ?? "{}";
  return JSON.parse(raw) as DiagnosticResult;
}

export async function speakText(text: string, signal?: AbortSignal): Promise<void> {
  const response = await client.audio.speech.create({
    model: "tts-1",
    voice: "alloy",
    input: text,
  });
  if (signal?.aborted) return;
  const arrayBuffer = await response.arrayBuffer();
  if (signal?.aborted) return;
  const blob = new Blob([arrayBuffer], { type: "audio/mpeg" });
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  return new Promise((resolve) => {
    const cleanup = () => {
      URL.revokeObjectURL(url);
      resolve();
    };
    audio.onended = cleanup;
    audio.onerror = cleanup;
    signal?.addEventListener("abort", () => {
      audio.pause();
      cleanup();
    });
    audio.play().catch(cleanup);
  });
}