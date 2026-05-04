import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, BookOpen, Search, Plus, Trash2, ChevronRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Story, TAG_CONFIG } from "@/types/story";
import { loadStories, deleteStory } from "@/lib/storyStore";

const StoryLibrary = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stories, setStories] = useState<Story[]>([]);
  const [search, setSearch] = useState("");
  const [filterTag, setFilterTag] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setStories(loadStories(user.id));
  }, [user]);

  const allTags = [...new Set(stories.flatMap((s) => s.tags))];

  const filtered = stories.filter((s) => {
    const matchSearch =
      !search ||
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.summary.toLowerCase().includes(search.toLowerCase());
    const matchTag = !filterTag || s.tags.includes(filterTag);
    return matchSearch && matchTag;
  });

  const handleDelete = (storyId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    deleteStory(user.id, storyId);
    setStories((prev) => prev.filter((s) => s.id !== storyId));
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });

  return (
    <div className="min-h-screen gradient-warm flex flex-col">
      {/* Header */}
      <div className="pt-14 pb-4 px-6">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors mb-6 -ml-1"
        >
          <ArrowLeft className="w-[18px] h-[18px]" />
          <span className="text-[13px] font-medium">Home</span>
        </button>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shadow-sm">
            <BookOpen className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-[1.35rem] font-heading font-bold text-foreground leading-tight">
              Story Library
            </h1>
            <p className="text-[13px] text-muted-foreground mt-0.5">
              {stories.length} {stories.length === 1 ? "story" : "stories"} saved
            </p>
          </div>
        </div>
      </div>

      <div className="px-5 flex-1 flex flex-col gap-3 max-w-md mx-auto w-full pb-10">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
          <input
            type="text"
            placeholder="Search stories…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-card border border-border/50 text-[14px] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/30"
          />
        </div>

        {/* Tag filters */}
        {allTags.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setFilterTag(null)}
              className={`shrink-0 text-[11px] font-semibold px-3 py-1.5 rounded-full border transition-all ${
                !filterTag
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card border-border/50 text-muted-foreground hover:text-foreground"
              }`}
            >
              All
            </button>
            {allTags.map((tag) => {
              const cfg = TAG_CONFIG[tag];
              if (!cfg) return null;
              return (
                <button
                  key={tag}
                  onClick={() => setFilterTag(filterTag === tag ? null : tag)}
                  className={`shrink-0 text-[11px] font-semibold px-3 py-1.5 rounded-full border transition-all ${
                    filterTag === tag
                      ? cfg.cls
                      : "bg-card border-border/50 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {cfg.emoji} {cfg.label}
                </button>
              );
            })}
          </div>
        )}

        {/* Empty state */}
        {filtered.length === 0 && (
          <div className="flex flex-col items-center py-16 gap-4">
            <div className="w-16 h-16 rounded-2xl bg-muted/30 flex items-center justify-center">
              <BookOpen className="w-7 h-7 text-muted-foreground/30" />
            </div>
            {stories.length === 0 ? (
              <>
                <div className="text-center">
                  <p className="text-[15px] font-heading font-semibold text-foreground">No stories yet</p>
                  <p className="text-[13px] text-muted-foreground mt-2 max-w-[260px] leading-snug">
                    Stories are automatically extracted from your practice conversations at the end of each session.
                  </p>
                </div>
                <button
                  onClick={() => navigate("/scenarios")}
                  className="gradient-primary text-primary-foreground px-6 py-2.5 rounded-full font-semibold shadow-glow-primary text-[13px] flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Start a conversation
                </button>
              </>
            ) : (
              <p className="text-[13px] text-muted-foreground">No stories match your search.</p>
            )}
          </div>
        )}

        {/* Story cards */}
        {filtered.map((story) => (
          <button
            key={story.id}
            onClick={() => navigate(`/stories/${story.id}`)}
            className="w-full rounded-2xl bg-card border border-border/50 p-4 text-left shadow-soft hover:shadow-lg transition-all active:scale-[0.98] group"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/8 flex items-center justify-center shrink-0">
                <BookOpen className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-[15px] font-heading font-semibold text-foreground leading-snug">
                    {story.title}
                  </h3>
                  <button
                    onClick={(e) => handleDelete(story.id, e)}
                    className="shrink-0 p-1 -m-1 text-muted-foreground/20 hover:text-rose-500 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-[12px] text-muted-foreground mt-1 leading-snug line-clamp-2">
                  {story.summary}
                </p>
                <div className="flex items-center gap-2 mt-2.5 flex-wrap">
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
                    <span className="text-[10px] text-muted-foreground/50">· {story.scenarioTitle}</span>
                  )}
                  <span className="text-[10px] text-muted-foreground/40 ml-auto">
                    {formatDate(story.extractedAt)}
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground/20 group-hover:text-muted-foreground/50 transition-colors shrink-0 mt-0.5" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default StoryLibrary;
