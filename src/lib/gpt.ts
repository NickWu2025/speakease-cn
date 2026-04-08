import OpenAI from "openai";

const client = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true, // demo only — move to backend for production
});

export interface GPTMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ConversationTurnResult {
  reply: string;
  coaching: {
    type: "subtle" | "rewrite" | "interrupt";
    text: string;
    improved?: string;
    original?: string;
  } | null;
}

export interface RecapAnalysis {
  practiced: string[];
  moments: { original: string; improved: string; reason: string }[];
  phrases: string[];
  encouragement: string;
}

const SCENARIO_DESCRIPTIONS: Record<string, string> = {
  classmate: "two students meeting in a university lecture hall",
  party: "two guests meeting at a casual house party",
  networking: "two professionals meeting at a networking event",
  improv: "two people having a fun, open-ended improv conversation",
};

export async function getConversationReply(
  history: GPTMessage[],
  scenarioId: string,
  partnerName: string
): Promise<ConversationTurnResult> {
  const scenarioDesc = SCENARIO_DESCRIPTIONS[scenarioId] ?? "two people having a casual conversation";

  const systemPrompt = `You are ${partnerName}, playing the role of a friendly person in a scenario: ${scenarioDesc}.

Your job is to have a natural, engaging conversation. Keep your reply to 1-3 sentences. Ask a follow-up question when appropriate to keep the conversation flowing.

After reading what the user just said, also optionally provide a real-time coaching tip to help them improve their conversational English.

Respond ONLY with a JSON object in this exact format:
{
  "reply": "<your conversational response as ${partnerName}>",
  "coaching": null
}

OR if you have a useful coaching tip:
{
  "reply": "<your conversational response>",
  "coaching": {
    "type": "subtle" | "rewrite" | "interrupt",
    "text": "<coaching tip text>",
    "original": "<the user's phrase to improve, if rewriting>",
    "improved": "<the improved version of their phrase, if rewriting>"
  }
}

Coaching types:
- "subtle": a small nudge or suggestion (e.g. ask a follow-up, show more interest)
- "rewrite": suggest a more natural/expressive way to say what they said
- "interrupt": flag something important mid-conversation (e.g. they were too vague, awkward phrasing)

Only include coaching when it would genuinely help. Leave coaching as null if what they said was good.`;

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
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
    .map((m) => `${m.role === "user" ? "User" : "AI Partner"}: ${m.text}`)
    .join("\n");

  const systemPrompt = `You are SpeakFlow, an AI conversation coach. Analyze the following conversation transcript from a practice session titled "${scenarioTitle}".

Provide structured feedback to help the user improve their conversational English skills.

Respond ONLY with a JSON object in this exact format:
{
  "practiced": ["<skill 1>", "<skill 2>", "<skill 3>"],
  "moments": [
    {
      "original": "<exact phrase the user said>",
      "improved": "<a more natural/expressive version>",
      "reason": "<brief explanation why>"
    }
  ],
  "phrases": ["<reusable phrase 1>", "<reusable phrase 2>", "<reusable phrase 3>"],
  "encouragement": "<one warm, specific sentence of encouragement based on what they did well>"
}

Rules:
- "practiced": 3 specific conversation skills they used in this session
- "moments": 2-4 real moments from the transcript where phrasing could be improved (use exact quotes)
- "phrases": 3 natural English phrases from the conversation they should remember and reuse
- Keep all feedback constructive and specific to this actual conversation`;

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: `Transcript:\n\n${transcript}` },
    ],
    response_format: { type: "json_object" },
    temperature: 0.7,
  });

  const raw = response.choices[0].message.content ?? "{}";
  return JSON.parse(raw) as RecapAnalysis;
}
