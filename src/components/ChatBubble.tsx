import aiAvatar from "@/assets/ai-avatar.png";

interface ChatBubbleProps {
  role: "user" | "ai";
  text: string;
  isLatest?: boolean;
}

const ChatBubble = ({ role, text, isLatest = false }: ChatBubbleProps) => {
  const isAI = role === "ai";

  return (
    <div className={`flex ${isAI ? "justify-start" : "justify-end"} ${isLatest ? "animate-fade-in-up" : ""}`}>
      {isAI && (
        <img
          src={aiAvatar}
          alt=""
          width={28}
          height={28}
          className="rounded-full mt-1 mr-2.5 shrink-0 ring-2 ring-background shadow-sm"
        />
      )}
      <div className="flex flex-col max-w-[78%]">
        {isAI && (
          <span className="text-[10px] text-muted-foreground/60 mb-1 ml-1 font-semibold uppercase tracking-widest">
            Alex
          </span>
        )}
        <div
          className={`rounded-2xl px-4 py-3 text-[14px] leading-relaxed ${
            isAI
              ? "bg-card border border-border/60 text-foreground rounded-tl-md shadow-sm"
              : "gradient-primary text-primary-foreground rounded-tr-md shadow-soft"
          }`}
        >
          {text}
        </div>
        {!isAI && (
          <span className="text-[10px] text-muted-foreground/50 mt-1 mr-1 self-end font-semibold uppercase tracking-widest">
            You
          </span>
        )}
      </div>
    </div>
  );
};

export default ChatBubble;
