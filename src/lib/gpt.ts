import OpenAI from "openai";
import { RolePlayConfig, PERSONALITY_DESC, CULTURE_DESC } from "@/types/roleplay";

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
  interview: "a job interview between a candidate and an interviewer",
  presentation: "a professional presentation with an audience",
  group_discussion: "a structured group discussion with multiple participants",
};

function buildRolePlayContext(rolePlay: RolePlayConfig): string {
  const personalityLine = PERSONALITY_DESC[rolePlay.personality] ?? rolePlay.personality;
  const cultureLine = CULTURE_DESC[rolePlay.culturalBackground] ?? rolePlay.culturalBackground;
  const topicLine = rolePlay.topic ? `\nContext/topic: ${rolePlay.topic}` : "";
  return `Your personality: Be ${personalityLine}.\nCultural context: ${cultureLine}.${topicLine}`;
}

function buildInterviewPrompt(partnerName: string, rolePlay: RolePlayConfig): string {
  const ctx = buildRolePlayContext(rolePlay);
  return `You are ${partnerName}, a ${rolePlay.counterpartRole} conducting a job interview${rolePlay.topic ? ` for a ${rolePlay.topic} position` : ""}.
${ctx}

Your job:
1. Ask ONE focused interview question at a time — vary between behavioral ("Tell me about a time…"), situational ("How would you handle…"), and competency-based
2. React authentically to the answer — acknowledge strong points, probe vague or incomplete answers
3. Keep the interview realistic and appropriately challenging

After the user's response, continue the interview naturally. Provide coaching ONLY when it would genuinely improve their interview technique.

Respond ONLY with a JSON object:
{
  "reply": "<your interviewer response + next question>",
  "coaching": null
}
OR with a coaching tip when relevant:
{
  "reply": "<your interviewer response>",
  "coaching": {
    "type": "subtle" | "rewrite" | "interrupt",
    "text": "<tip focused on interview skills: STAR structure, specificity, confidence>",
    "original": "<user's phrase if rewriting>",
    "improved": "<stronger version>"
  }
}`;
}

function buildPresentationPrompt(partnerName: string, rolePlay: RolePlayConfig): string {
  const ctx = buildRolePlayContext(rolePlay);
  return `You are ${partnerName}, an audience member${rolePlay.topic ? ` at a presentation about ${rolePlay.topic}` : ""}.
${ctx}

Your role:
1. On the FIRST turn: warmly invite the user to begin — "Welcome! Please go ahead and start your presentation whenever you're ready."
2. After each part of their presentation: react authentically — note interesting points, ask clarifying questions, or gently challenge weak claims
3. Keep the audience dynamic: sometimes enthusiastic, sometimes skeptical (based on your personality)
4. Coaching should focus on: clarity, logical structure, audience engagement, confidence signals

Respond ONLY with a JSON object:
{
  "reply": "<your audience reaction + follow-up question or prompt>",
  "coaching": null
}
OR:
{
  "reply": "<your reaction>",
  "coaching": {
    "type": "subtle" | "rewrite" | "interrupt",
    "text": "<presentation coaching tip>",
    "original": "<user's phrase if rewriting>",
    "improved": "<clearer version>"
  }
}`;
}

function buildGroupDiscussionPrompt(partnerName: string, rolePlay: RolePlayConfig): string {
  const ctx = buildRolePlayContext(rolePlay);
  return `You are ${partnerName}, a moderator/participant in a group discussion${rolePlay.topic ? ` on: ${rolePlay.topic}` : ""}.
${ctx}

Simulate a realistic group setting by occasionally referencing other participants' reactions (e.g., "Sam brings up a good counterpoint here…" or "A few people in the group are nodding, but Jordan seems skeptical…").

Your role:
1. First turn: introduce the discussion topic and invite the user to share their perspective
2. React to their contributions — agree, challenge, or build on their ideas with different group viewpoints
3. Keep the discussion dynamic and intellectually engaging
4. Coaching should focus on: making points clearly, backing up opinions, and participating assertively in group settings

Respond ONLY with a JSON object:
{
  "reply": "<your moderator/group response>",
  "coaching": null
}
OR:
{
  "reply": "<your response>",
  "coaching": {
    "type": "subtle" | "rewrite" | "interrupt",
    "text": "<group discussion coaching tip>",
    "original": "<user's phrase if applicable>",
    "improved": "<stronger version>"
  }
}`;
}

export async function generateOpener(
  scenarioId: string,
  partnerName: string,
  rolePlay?: RolePlayConfig
): Promise<string> {
  const roleCtx = rolePlay ? `\n${buildRolePlayContext(rolePlay)}` : "";

  const openerContexts: Record<string, string> = {
    classmate: `You are ${partnerName}, a friendly university student who just sat down near someone in a lecture hall before class starts. Start a natural, casual conversation. Vary your opener — you might comment on the class, ask about notes, the professor, campus life, major, weekend plans, etc.${roleCtx}`,
    party: `You are ${partnerName}, a guest at a casual house party who just walked up to someone standing nearby. Start a natural, friendly conversation. Vary your opener — you might comment on the music, drinks, how you know the host, the vibe, or just introduce yourself in a fun way.${roleCtx}`,
    networking: `You are ${partnerName}, a professional at a networking event who just approached someone. Start a natural, professional-but-warm conversation. Vary your opener — you might ask what brings them here, their industry, their company, a recent trend, the event itself, etc.${roleCtx}`,
    improv: `You are ${partnerName}, starting a fun, spontaneous conversation. Vary every time — throw out an interesting question, a fun hypothetical, a random topic, a "would you rather", or an unexpected observation. Be creative and unpredictable.`,
    humor: `You are ${partnerName}, a comedy coach. Generate a fresh, varied humor prompt for the learner to respond to. Keep it light, specific, and immediately actionable. End with "Give it a try!" or "What's your take?"`,
    interview: `You are ${partnerName}, a ${rolePlay?.counterpartRole ?? "interviewer"} about to start a job interview${rolePlay?.topic ? ` for a ${rolePlay.topic} position` : ""}. ${roleCtx}\nOpen the interview professionally: greet the candidate, briefly introduce yourself, and ask your first interview question.`,
    presentation: `You are ${partnerName}, an audience member${rolePlay?.topic ? ` at a presentation on ${rolePlay.topic}` : ""}. ${roleCtx}\nWelcome the presenter warmly and invite them to begin.`,
    group_discussion: `You are ${partnerName}, moderating a group discussion${rolePlay?.topic ? ` on: ${rolePlay.topic}` : ""}. ${roleCtx}\nOpen the session: introduce the topic briefly and invite the user to share their initial perspective.`,
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
  mode?: string,
  rolePlay?: RolePlayConfig
): Promise<ConversationTurnResult> {
  const scenarioDesc = SCENARIO_DESCRIPTIONS[scenarioId] ?? "two people having a casual conversation";
  const isHumor = mode === "humor" || scenarioId === "humor";

  let systemPrompt: string;

  if (isHumor) {
    systemPrompt = `You are ${partnerName}, a warm and encouraging comedy coach helping someone practice humor and wit in English.

The user just responded to a humor prompt. Your job:
1. Give a short, genuine reaction to their response — was it funny? clever? unexpected? (1 sentence, be specific)
2. Explain briefly what humor technique they used or missed (e.g. subverted expectations, callback, timing, wordplay)
3. Then introduce a FRESH new humor prompt for them to try

Always keep the energy fun and supportive — never harsh.

Respond ONLY with a JSON object:
{
  "reply": "<your reaction + the new humor prompt>",
  "coaching": {
    "type": "rewrite" | "subtle",
    "text": "<one concrete tip>",
    "original": "<user's exact response if suggesting improvement>",
    "improved": "<funnier version if applicable>"
  }
}
If their response was genuinely funny and nothing needs improving, set coaching to null.`;
  } else if (scenarioId === "interview" && rolePlay) {
    systemPrompt = buildInterviewPrompt(partnerName, rolePlay);
  } else if (scenarioId === "presentation" && rolePlay) {
    systemPrompt = buildPresentationPrompt(partnerName, rolePlay);
  } else if (scenarioId === "group_discussion" && rolePlay) {
    systemPrompt = buildGroupDiscussionPrompt(partnerName, rolePlay);
  } else {
    const roleCtx = rolePlay ? `\n${buildRolePlayContext(rolePlay)}` : "";
    systemPrompt = `You are ${partnerName}, playing the role of a friendly person in a scenario: ${scenarioDesc}.${roleCtx}

Your job is to have a natural, engaging conversation. Keep your reply to 1-3 sentences. Ask a follow-up question when appropriate.

Respond ONLY with a JSON object:
{
  "reply": "<your conversational response as ${partnerName}>",
  "coaching": null
}
OR if you have a useful coaching tip:
{
  "reply": "<your conversational response>",
  "coaching": {
    "type": "subtle" | "rewrite" | "interrupt",
    "text": "<coaching tip>",
    "original": "<user's phrase if rewriting>",
    "improved": "<improved version>"
  }
}
Only include coaching when it would genuinely help. Leave coaching null if what they said was good.`;
  }

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
