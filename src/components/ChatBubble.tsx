import aiAvatar from "@/assets/ai-avatar.png";

interface ChatBubbleProps {
  role: "user" | "ai";
  text: string;
  isLatest?: boolean;
}

const ChatBubble = ({ role, text, isLatest = false }: ChatBubbleProps) => {
  const isAI = role === "ai";

  return (
    <div className={`flex ${isAI ? "justify-start" : "justify-end"} ${isLatest ? "animate-slide-up" : ""}`}>
      {isAI && (
        <img
          src={aiAvatar}
          alt=""
          width={28}
          height={28}
          className="rounded-full mt-1 mr-2 shrink-0 ring-2 ring-background"
        />
      )}
      <div className="flex flex-col max-w-[78%]">
        {isAI && (
          <span className="text-[10px] text-muted-foreground mb-1 ml-1 font-medium uppercase tracking-wide">
            Alex
          </span>
        )}
        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
            isAI
              ? "bg-card border border-border text-foreground rounded-tl-md shadow-sm"
              : "bg-secondary text-secondary-foreground rounded-tr-md shadow-sm"
          }`}
        >
          {text}
        </div>
        {!isAI && (
          <span className="text-[10px] text-muted-foreground mt-1 mr-1 self-end font-medium uppercase tracking-wide">
            You
          </span>
        )}
      </div>
    </div>
  );
};

export default ChatBubble;
