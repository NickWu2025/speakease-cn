import OpenAI from "openai";
import { Story, StoryTone, StoryStructure, StoryMessage } from "@/types/story";
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
    .map((m) => `${m.role === "user" ? "User" : "AI"}: ${m.text}`)
    .join("\n");

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are SpeakFlow analyzing a conversation transcript to extract personal stories.

A "story" = any first-person experience: "when I...", "last year I...", "at my job...", "one time...", etc.

For each distinct story found (max 3), extract:
- title: 4–8 word descriptive title
- raw: the user's own words about the experience (combine related messages if needed)
- summary: 1–2 sentence third-person summary
- tags: 1–3 from [career, challenge, achievement, learning, teamwork, leadership, personal, networking]
- structure: { situation, challenge, action, result, insight } — infer from context if not explicit

Return ONLY valid JSON (no markdown fences):
{ "stories": [ { "title": "...", "raw": "...", "summary": "...", "tags": [...], "structure": { "situation": "...", "challenge": "...", "action": "...", "result": "...", "insight": "..." } } ] }

If no clear personal stories exist, return { "stories": [] }.`,
      },
      { role: "user", content: `Transcript from "${scenarioTitle}":\n\n${transcript}` },
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
    "conversational and friendly — as you'd tell a close friend over coffee. Use natural language, contractions, and a warm tone.",
  interview:
    "professional and structured using the STAR method (Situation, Action, Result). Be concise, impact-focused, and use strong action verbs. Aim for 60–90 seconds when spoken.",
  storytelling:
    "vivid and engaging with a clear narrative arc: hook the listener, build tension, deliver a satisfying conclusion. Use sensory details and specific moments.",
  short:
    "extremely concise — 2–3 sentences maximum. Capture the essence and key insight in the fewest possible words.",
};

export async function refineStory(raw: string, title: string, tone: StoryTone): Promise<string> {
  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are a communication coach rewriting a personal story.

Tone: "${tone}" — ${TONE_INSTRUCTIONS[tone]}

Return ONLY the rewritten story text. No intro, no explanation, no markdown.`,
      },
      { role: "user", content: `Story: "${title}"\n\n${raw}` },
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
  const systemPrompt = `You are SpeakFlow, a communication coach helping someone improve their personal story titled "${story.title}".

Story summary: ${story.summary}

Original story:
"""
${story.raw}
"""

Your role:
1. Ask specific follow-up questions to deepen clarity, substance, and insight
2. Suggest concrete improvements to structure, language, or impact
3. Help them discover what makes this story compelling and unique
4. Advise how to adapt it for different contexts (interview, networking, casual conversation)

Be specific, warm, and practical. Always reference actual details from their story.
If opening the conversation, ask ONE focused question to get them thinking.`;

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
        ? [{ role: "user" as const, content: "Please open our coaching conversation with a question about my story." }]
        : history),
    ],
    temperature: 0.85,
  });

  return response.choices[0].message.content?.trim() ?? "Tell me more about your story.";
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
      `- ${s.scenarioTitle}: content=${s.dimensions.content}, structure=${s.dimensions.structure}, delivery=${s.dimensions.delivery}`
  ).join("\n");

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are SpeakFlow generating a personalized progress report for an English conversation learner.

User data:
- Total sessions: ${sessions.length}
- Content avg: ${avg("content")}/3
- Structure avg: ${avg("structure")}/3
- Delivery avg: ${avg("delivery")}/3
- Stories saved: ${storyCount}

Recent sessions:
${recentLines}

Return ONLY valid JSON (no markdown):
{
  "headline": "<one warm, specific encouraging sentence about overall progress>",
  "improvements": ["<specific improvement 1 based on actual data>", "<specific improvement 2>"],
  "focusAreas": ["<specific actionable focus area 1>", "<specific focus area 2>"],
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
