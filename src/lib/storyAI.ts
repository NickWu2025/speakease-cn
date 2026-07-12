import OpenAI from "openai";
import { Story, StoryTone, StoryMessage } from "@/types/story";
import { SessionRecord, RATING_SCORE } from "@/lib/sessionStore";

const client = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY ?? "",
  dangerouslyAllowBrowser: true,
});

interface RawExtracted {
  title: string;
  raw: string;
  summary: string;
  tags: string[];
  structure: StoryStructure;
}

export async function extractStories(
  messages: { role: "user" | "ai"; text: string }[],
  scenarioTitle: string,
  scenarioId?: string
): Promise<Story[]> {
  const transcript = messages
    .map((m) => `${m.role === "user" ? "用户" : "AI"}：${m.text}`)
    .join("\n");

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `你是易言 SpeakEase，正在分析对话记录以提取个人故事。

"故事" = 任何第一人称经历："当时我…"、"去年我…"、"在我工作的时候…"、"有一次…"等。

为每个发现的不同故事（最多 3 个）提取：
- title: 4-8 个字的描述性标题
- raw: 用户关于这段经历的原话（必要时合并相关消息）
- summary: 1-2 句第三人称摘要
- tags: 1-3 个来自 [career, challenge, achievement, learning, teamwork, leadership, personal, networking]
- structure: { situation, challenge, action, result, insight } — 上下文推断

仅返回有效 JSON（不要 markdown 标记）：
{ "stories": [ { "title": "...", "raw": "...", "summary": "...", "tags": [...], "structure": { "situation": "...", "challenge": "...", "action": "...", "result": "...", "insight": "..." } } ] }

如果没有明显的个人故事，返回 { "stories": [] }。`,
      },
      { role: "user", content: `来自"${scenarioTitle}"的对话记录：\n\n${transcript}` },
    ],
    response_format: { type: "json_object" },
    temperature: 0.6,
  });

  const raw = response.choices[0].message.content ?? '{"stories":[]}';
  const parsed = JSON.parse(raw) as { stories: RawExtracted[] };
  const now = new Date().toISOString();

  return (parsed.stories ?? []).map((s, i) => ({
    id: `story_${Date.now()}_${i}_${Math.random().toString(36).slice(2, 7)}`,
    title: s.title,
    raw: s.raw,
    summary: s.summary,
    tags: s.tags,
    scenarioId,
    scenarioTitle,
    extractedAt: now,
    structure: s.structure,
    versions: {},
    thread: [],
  }));
}

const TONE_INSTRUCTIONS: Record<StoryTone, string> = {
  casual:
    "口语化、友好 — 像跟好朋友喝咖啡时聊天。用自然的语言、轻松的语气。",
  interview:
    "专业、结构化，使用 STAR 方法（情境、行动、结果）。简洁、突出影响、用有力的行动动词。口语表达约 60-90 秒。",
  storytelling:
    "生动、有感染力，有清晰的叙事弧线：吸引听众、制造张力、给出有启发的结尾。使用感官细节和具体时刻。",
  short:
    "极度简洁 — 最多 2-3 句话。用最少的词抓住本质和关键洞察。",
};

export async function refineStory(raw: string, title: string, tone: StoryTone): Promise<string> {
  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `你是一位沟通教练，正在重写一个个人故事。

语调："${tone}" — ${TONE_INSTRUCTIONS[tone]}

仅返回重写后的故事文本。不要开头、不要解释、不要 markdown。`,
      },
      { role: "user", content: `故事："${title}"\n\n${raw}` },
    ],
    temperature: 0.8,
  });

  return response.choices[0].message.content?.trim() ?? raw;
}

export async function chatAboutStory(
  story: Story,
  thread: StoryMessage[],
  userMessage: string
): Promise<string> {
  const systemPrompt = `你是易言 SpeakEase 的沟通教练，帮助用户改进标题为"${story.title}"的个人故事。

故事摘要：${story.summary}

原始故事：
"""
${story.raw}
"""

你的角色：
1. 提出具体的跟进问题来深化清晰度、实质和洞察
2. 建议结构、语言或表现力的具体改进
3. 帮助他们发现这个故事什么让它有吸引力和独特
4. 建议如何在不同场景中调整（面试、路演、日常交流）

要具体、温暖、实用。始终引用他们故事中的实际细节。
如果是开场，问一个聚焦的问题来引发思考。`;

  const isOpener = thread.length === 0 && !userMessage;
  const history = thread.map((m) => ({
    role: (m.role === "user" ? "user" : "assistant") as "user" | "assistant",
    content: m.text,
  }));

  if (!isOpener && userMessage) history.push({ role: "user", content: userMessage });

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      ...(isOpener
        ? [{ role: "user" as const, content: "请用一个关于我故事的问题开始我们的教练对话。" }]
        : history),
    ],
    temperature: 0.85,
  });

  return response.choices[0].message.content?.trim() ?? "多告诉我一些关于你故事的情况。";
}

// ── Progress report ───────────────────────────────────────────────────

export interface ProgressReport {
  headline: string;
  improvements: string[];
  focusAreas: string[];
  readiness: Record<"social" | "interview" | "presentation", "Ready" | "Almost there" | "Keep practicing">;
}

export async function generateProgressReport(
  sessions: SessionRecord[],
  storyCount: number
): Promise<ProgressReport> {
  const dims = ["content", "structure", "delivery"] as const;
  const avg = (dim: typeof dims[number]) => {
    const sum = sessions.reduce((acc, s) => acc + RATING_SCORE[s.dimensions[dim]], 0);
    return (sum / sessions.length).toFixed(2);
  };

  const recentLines = sessions.slice(0, 8).map(
    (s) =>
      `- ${s.scenarioTitle}: 内容=${s.dimensions.content}, 结构=${s.dimensions.structure}, 表达=${s.dimensions.delivery}`
  ).join("\n");

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `你是易言 SpeakEase，正在为一位演讲沟通学习者生成个性化进步报告。

用户数据：
- 总练习次数：${sessions.length}
- 内容平均分：${avg("content")}/3
- 结构平均分：${avg("structure")}/3
- 表达平均分：${avg("delivery")}/3
- 已保存故事：${storyCount}

最近练习：
${recentLines}

仅返回有效 JSON（不要 markdown）：
{
  "headline": "<一句温暖、具体的关于整体进步的鼓励>",
  "improvements": ["<基于实际数据的具体进步 1>", "<具体进步 2>"],
  "focusAreas": ["<具体可操作的聚焦方向 1>", "<具体聚焦方向 2>"],
  "readiness": {
    "social": "Ready" | "Almost there" | "Keep practicing",
    "interview": "Ready" | "Almost there" | "Keep practicing",
    "presentation": "Ready" | "Almost there" | "Keep practicing"
  }
}`,
      },
    ],
    response_format: { type: "json_object" },
    temperature: 0.7,
  });

  return JSON.parse(response.choices[0].message.content ?? "{}") as ProgressReport;
}