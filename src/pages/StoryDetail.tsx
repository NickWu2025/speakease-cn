import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, Copy, Check, ArrowUp } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Story, StoryTone, StoryMessage, TAG_CONFIG, TONE_CONFIG } from "@/types/story";
import { loadStories, saveStory } from "@/lib/storyStore";
import { refineStory, chatAboutStory } from "@/lib/storyAI";

type Tab = "versions" | "structure" | "chat";

const STRUCTURE_FIELDS: { key: keyof NonNullable<Story["structure"]>; label: string; emoji: string; desc: string }[] = [
  { key: "situation", label: "Situation", emoji: "🌍", desc: "Context & background" },
  { key: "challenge", label: "Challenge", emoji: "⚠️", desc: "The problem or task" },
  { key: "action",    label: "Action",    emoji: "⚡", desc: "What you did" },
  { key: "result",    label: "Result",    emoji: "🏆", desc: "The outcome" },
  { key: "insight",   label: "Insight",   emoji: "💡", desc: "What you learned" },
];

const SUGGESTED_QUESTIONS = [
  "How can I make this more compelling?",
  "What details should I add?",
  "How do I tell this in an interview?",
  "What's the emotional hook here?",
];

const StoryDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [story, setStory] = useState<Story | null>(null);
  const [tab, setTab] = useState<Tab>("versions");
  const [activeTone, setActiveTone] = useState<StoryTone>("casual");
  const [generatingTone, setGeneratingTone] = useState<StoryTone | null>(null);
  const [copiedTone, setCopiedTone] = useState<StoryTone | null>(null);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatOpeningRef = useRef(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Load story from store
  useEffect(() => {
    if (!user || !id) return;
    const found = loadStories(user.id).find((s) => s.id === id);
    setStory(found ?? null);
  }, [user, id]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [story?.thread]);

  // Initialize chat with AI opener
  useEffect(() => {
    if (tab !== "chat" || !story || story.thread.length > 0 || chatOpeningRef.current) return;
    chatOpeningRef.current = true;
    chatAboutStory(story, [], "")
      .then((text) => {
        const thread: StoryMessage[] = [{ role: "ai", text }];
        persist({ ...story, thread });
      })
      .catch(console.error)
      .finally(() => { chatOpeningRef.current = false; });
  }, [tab, story?.id]);

  const persist = (updated: Story) => {
    setStory(updated);
    if (user) saveStory(user.id, updated);
  };

  const generateVersion = async (tone: StoryTone) => {
    if (!story || generatingTone) return;
    setGeneratingTone(tone);
    try {
      const text = await refineStory(story.raw, story.title, tone);
      persist({ ...story, versions: { ...story.versions, [tone]: text } });
    } catch (e) {
      console.error(e);
    } finally {
      setGeneratingTone(null);
    }
  };

  const copyVersion = async (tone: StoryTone) => {
    const text = story?.versions[tone];
    if (!text) return;
    await navigator.clipboard?.writeText(text);
    setCopiedTone(tone);
    setTimeout(() => setCopiedTone(null), 2000);
  };

  const sendChat = async () => {
    if (!story || !chatInput.trim() || chatLoading) return;
    const msg = chatInput.trim();
    setChatInput("");
    const newThread: StoryMessage[] = [...story.thread, { role: "user", text: msg }];
    const withUser = { ...story, thread: newThread };
    setStory(withUser);
    setChatLoading(true);
    try {
      const reply = await chatAboutStory(story, newThread, msg);
      persist({ ...withUser, thread: [...newThread, { role: "ai", text: reply }] });
    } catch (e) {
      console.error(e);
    } finally {
      setChatLoading(false);
    }
  };

  if (!story) {
    return (
      <div className="min-h-screen gradient-warm flex items-center justify-center">
        <p className="text-muted-foreground text-[14px]">Story not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-warm flex flex-col">
      {/* Header */}
      <div className="pt-14 pb-4 px-6">
        <button
          onClick={() => navigate("/stories")}
          className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors mb-4 -ml-1"
        >
          <ArrowLeft className="w-[18px] h-[18px]" />
          <span className="text-[13px] font-medium">Story Library</span>
        </button>
        <h1 className="text-[1.2rem] font-heading font-bold text-foreground leading-snug">
          {story.title}
        </h1>
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          {story.tags.slice(0, 2).map((tag) => {
            const cfg = TAG_CONFIG[tag];
            if (!cfg) return null;
            return (
              <span key={tag} className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${cfg.cls}`}>
                {cfg.emoji} {cfg.label}
              </span>
            );
          })}
          {story.scenarioTitle && (
            <span className="text-[11px] text-muted-foreground/60">· {story.scenarioTitle}</span>
          )}
        </div>
      </div>

      {/* Summary pill */}
      <div className="px-5 mb-3">
        <div className="rounded-2xl bg-primary/5 border border-primary/10 px-4 py-3">
          <p className="text-[13px] text-foreground/80 leading-relaxed">{story.summary}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-5 mb-3">
        <div className="flex gap-1.5 bg-muted/40 p-1 rounded-xl border border-border/40">
          {(["versions", "structure", "chat"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-1.5 rounded-lg text-[12px] font-semibold transition-all ${
                tab === t ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t === "versions" ? "Versions" : t === "structure" ? "Structure" : "Chat"}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 flex-1 flex flex-col gap-3 max-w-md mx-auto w-full pb-10">
        {/* ── Versions ── */}
        {tab === "versions" && (
          <>
            {/* Original */}
            <div className="rounded-2xl bg-card border border-border/50 p-4">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Original
              </p>
              <p className="text-[13px] text-foreground leading-relaxed">{story.raw}</p>
            </div>

            {/* Tone selector grid */}
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(TONE_CONFIG) as StoryTone[]).map((tone) => {
                const cfg = TONE_CONFIG[tone];
                const isActive = activeTone === tone;
                const hasVersion = !!story.versions[tone];
                return (
                  <button
                    key={tone}
                    onClick={() => setActiveTone(tone)}
                    className={`rounded-xl border p-3 text-left transition-all ${
                      isActive
                        ? "bg-primary/10 border-primary/30 ring-1 ring-primary/20"
                        : "bg-card border-border/50 hover:border-border"
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="text-base">{cfg.emoji}</span>
                      {hasVersion && <span className="text-[9px] text-green-600 font-bold uppercase ml-auto">✓</span>}
                    </div>
                    <p className={`text-[13px] font-semibold mt-1 ${isActive ? "text-primary" : "text-foreground"}`}>
                      {cfg.label}
                    </p>
                    <p className="text-[11px] text-muted-foreground">{cfg.desc}</p>
                  </button>
                );
              })}
            </div>

            {/* Version display */}
            <div className="rounded-2xl bg-card border border-border/50 p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  {TONE_CONFIG[activeTone].emoji} {TONE_CONFIG[activeTone].label} version
                </p>
                {story.versions[activeTone] && (
                  <button
                    onClick={() => copyVersion(activeTone)}
                    className="flex items-center gap-1 text-[11px] text-primary font-semibold"
                  >
                    {copiedTone === activeTone ? (
                      <><Check className="w-3 h-3" /> Copied</>
                    ) : (
                      <><Copy className="w-3 h-3" /> Copy</>
                    )}
                  </button>
                )}
              </div>

              {story.versions[activeTone] ? (
                <>
                  <p className="text-[13px] text-foreground leading-relaxed">
                    {story.versions[activeTone]}
                  </p>
                  <button
                    onClick={() => generateVersion(activeTone)}
                    disabled={!!generatingTone}
                    className="mt-3 text-[11px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 disabled:opacity-40"
                  >
                    {generatingTone === activeTone ? (
                      <><Loader2 className="w-3 h-3 animate-spin" /> Regenerating…</>
                    ) : (
                      "↺ Regenerate"
                    )}
                  </button>
                </>
              ) : (
                <div className="flex flex-col items-center py-6 gap-3">
                  <p className="text-[13px] text-muted-foreground text-center">
                    No {TONE_CONFIG[activeTone].label.toLowerCase()} version yet.
                  </p>
                  <button
                    onClick={() => generateVersion(activeTone)}
                    disabled={!!generatingTone}
                    className="gradient-primary text-primary-foreground px-5 py-2 rounded-full text-[13px] font-semibold shadow-glow-primary disabled:opacity-60 flex items-center gap-2"
                  >
                    {generatingTone === activeTone ? (
                      <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating…</>
                    ) : (
                      `✨ Generate ${TONE_CONFIG[activeTone].label} version`
                    )}
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {/* ── Structure ── */}
        {tab === "structure" && (
          <>
            <div className="rounded-2xl bg-amber-50 border border-amber-100 px-4 py-3">
              <p className="text-[12px] text-amber-700 leading-snug">
                <strong>STAR framework</strong> — the backbone of a compelling story. Use this to check your story has all the key elements.
              </p>
            </div>
            {story.structure ? (
              STRUCTURE_FIELDS.map((field) => (
                <div key={field.key} className="rounded-2xl bg-card border border-border/50 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-base">{field.emoji}</span>
                    <div>
                      <p className="text-[13px] font-heading font-bold text-foreground">{field.label}</p>
                      <p className="text-[10px] text-muted-foreground">{field.desc}</p>
                    </div>
                  </div>
                  <p className="text-[13px] text-foreground leading-snug pl-7">
                    {story.structure![field.key] || (
                      <span className="text-muted-foreground italic">Not detected — ask your coach in the Chat tab!</span>
                    )}
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded-2xl bg-card border border-border/50 p-6 text-center">
                <p className="text-[13px] text-muted-foreground">
                  Structure not available for this story. Try discussing it in the Chat tab.
                </p>
              </div>
            )}
          </>
        )}

        {/* ── Chat ── */}
        {tab === "chat" && (
          <>
            {/* Suggested questions (shown only when thread is empty) */}
            {story.thread.length === 0 && !chatOpeningRef.current && (
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                {SUGGESTED_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => setChatInput(q)}
                    className="shrink-0 text-[12px] bg-primary/8 text-primary border border-primary/15 rounded-full px-3.5 py-1.5 font-medium hover:bg-primary/12 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {/* Messages */}
            <div className="flex flex-col gap-3 pb-20">
              {/* AI opening loader */}
              {story.thread.length === 0 && (
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-sm">🤖</span>
                  </div>
                  <div className="bg-card border border-border/50 rounded-2xl rounded-tl-sm px-4 py-3">
                    <Loader2 className="w-4 h-4 text-primary animate-spin" />
                  </div>
                </div>
              )}

              {story.thread.map((msg, i) => (
                <div key={i} className={`flex items-end gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                  {msg.role === "ai" && (
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-sm">🤖</span>
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 text-[13px] leading-relaxed ${
                      msg.role === "user"
                        ? "gradient-primary text-primary-foreground rounded-br-sm"
                        : "bg-card border border-border/50 text-foreground rounded-tl-sm"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}

              {chatLoading && (
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-sm">🤖</span>
                  </div>
                  <div className="bg-card border border-border/50 rounded-2xl rounded-tl-sm px-4 py-3">
                    <Loader2 className="w-4 h-4 text-primary animate-spin" />
                  </div>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Sticky input */}
            <div className="sticky bottom-4 bg-background/90 backdrop-blur-sm rounded-2xl border border-border/50 shadow-lg">
              <div className="flex items-center gap-2 p-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendChat()}
                  placeholder="Ask your coach about this story…"
                  className="flex-1 bg-transparent px-3 py-2 text-[14px] text-foreground placeholder:text-muted-foreground/40 focus:outline-none"
                />
                <button
                  onClick={sendChat}
                  disabled={!chatInput.trim() || chatLoading}
                  className="w-9 h-9 rounded-xl gradient-primary text-primary-foreground flex items-center justify-center disabled:opacity-40 shrink-0 transition-opacity"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default StoryDetail;
