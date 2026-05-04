import OpenAI from "openai";

const client = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY ?? "",
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

export async function generateOpener(scenarioId: string, partnerName: string): Promise<string> {
  const openerContexts: Record<string, string> = {
    classmate: `You are ${partnerName}, a friendly university student who just sat down near someone in a lecture hall before class starts. Start a natural, casual conversation. Vary your opener — you might comment on the class, ask about notes, the professor, campus life, major, weekend plans, etc.`,
    party: `You are ${partnerName}, a guest at a casual house party who just walked up to someone standing nearby. Start a natural, friendly conversation. Vary your opener — you might comment on the music, drinks, how you know the host, the vibe, or just introduce yourself in a fun way.`,
    networking: `You are ${partnerName}, a professional at a networking event who just approached someone. Start a natural, professional-but-warm conversation. Vary your opener — you might ask what brings them here, their industry, their company, a recent trend, the event itself, etc.`,
    improv: `You are ${partnerName}, starting a fun, spontaneous conversation. Vary every time — throw out an interesting question, a fun hypothetical, a random topic, a "would you rather", or an unexpected observation. Be creative and unpredictable.`,
    humor: `You are ${partnerName}, a comedy coach. Generate a fresh, varied humor prompt for the learner to respond to. Examples of prompt types (rotate randomly):
- A quirky everyday situation to react to with wit (e.g. "The office printer just printed a resignation letter addressed to itself.")
- A fill-in-the-blank joke setup (e.g. "I tried to write a joke about time travel, but...")
- A "how would you explain X to Y" challenge (e.g. "Explain WiFi to a medieval knight — make it funny.")
- A playful roast target (e.g. "Roast the concept of Mondays in one sentence.")
- A weird hypothetical (e.g. "If your pet wrote a Yelp review of you, what would it say?")
Keep it light, specific, and immediately actionable. End with an invitation like "Give it a try!" or "What's your take?"`,
  };

  const context = openerContexts[scenarioId] ?? openerContexts.improv;

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `${context}\n\nRespond ONLY with a JSON object: { "opener": "<your opening line>" }\nKeep it to 1-3 sentences. Sound natural and human. Do NOT start with "Hey!" every time — vary greetings.`,
      },
      { role: "user", content: "Generate a fresh, varied opening line." },
    ],
    response_format: { type: "json_object" },
    temperature: 1.1,
  });

  const raw = response.choices[0].message.content ?? '{"opener": "Hey! Great to meet you."}';
  const parsed = JSON.parse(raw) as { opener: string };
  return parsed.opener;
}

export async function getConversationReply(
  history: GPTMessage[],
  scenarioId: string,
  partnerName: string,
  mode?: string
): Promise<ConversationTurnResult> {
  const scenarioDesc = SCENARIO_DESCRIPTIONS[scenarioId] ?? "two people having a casual conversation";

  const isHumor = mode === "humor" || scenarioId === "humor";

  const systemPrompt = isHumor
    ? `You are ${partnerName}, a warm and encouraging comedy coach helping someone practice humor and wit in English.

The user just responded to a humor prompt. Your job:
1. Give a short, genuine reaction to their response — was it funny? clever? unexpected? (1 sentence, be specific)
2. Explain briefly what humor technique they used or missed (e.g. subverted expectations, callback, timing, wordplay)
3. Then introduce a FRESH new humor prompt for them to try

Always keep the energy fun and supportive — never harsh.

Respond ONLY with a JSON object:
{
  "reply": "<your reaction to their response + the new humor prompt>",
  "coaching": {
    "type": "rewrite" | "subtle",
    "text": "<one concrete tip: how they could make it funnier, or what technique to try next time>",
    "original": "<the user's exact response if suggesting an improvement>",
    "improved": "<a funnier version of their response, if applicable — otherwise omit this field>"
  }
}

If their response was genuinely funny and nothing needs improving, set coaching to null.`
    : `You are ${partnerName}, playing the role of a friendly person in a scenario: ${scenarioDesc}.

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
    .map((m) => `${m.role === "user" ? "Learner" : "Coach"}: ${m.text}`)
    .join("\n");

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are SpeakFlow, an AI English conversation coach. Analyze this short diagnostic conversation from a new user who wants to improve their English conversation skills.

User's stated goals: ${goals.join(", ")}
User's stated challenges: ${challenges.join(", ")}

Based on the conversation, assess the user's proficiency and create their learning profile.

Respond ONLY with a JSON object:
{
  "proficiencyLevel": "beginner" | "intermediate" | "advanced",
  "strengths": ["<2 specific strengths observed from their responses>"],
  "areasToImprove": ["<2 specific improvement areas>"],
  "recommendedScenarios": ["<best scenario id from: classmate, party, networking, improv>", "<second best>"],
  "coachNote": "<1 warm, personal sentence of encouragement based on what you noticed>"
}

Proficiency guide:
- beginner: short responses, basic vocabulary, noticeable grammar gaps
- intermediate: complete sentences, decent vocabulary, occasional errors
- advanced: natural flow, varied vocabulary, expressive`,
      },
      { role: "user", content: `Diagnostic transcript:\n\n${transcript}` },
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
    voice: "nova",
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
