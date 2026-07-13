import aiAvatar from "@/assets/ai-avatar.png";

interface ChatBubbleProps {
  role: "user" | "ai" | "system";
  text: string;
  image?: string;
  isLatest?: boolean;
}

const ChatBubble = ({ role, text, image, isLatest = false }: ChatBubbleProps) => {
  const isAI = role === "ai";
  const isSystem = role === "system";

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
      <div className={`flex flex-col ${isSystem ? "max-w-[60%]" : "max-w-[78%]"} ${isSystem ? "mx-auto" : ""}`}>
        {isAI && (
          <span className="text-[10px] text-muted-foreground/60 mb-1 ml-1 font-semibold uppercase tracking-widest">
            Alex
          </span>
        )}
        {isSystem && (
          <span className="text-[10px] text-muted-foreground/40 mb-1 text-center font-semibold uppercase tracking-widest">
            截图记录
          </span>
        )}
        {image ? (
          <div className="rounded-xl overflow-hidden border border-border/40 shadow-sm">
            <img src={`data:image/jpeg;base64,${image}`} alt="截图" className="w-full h-auto" style={{ maxHeight: 160 }} />
          </div>
        ) : (
          <div
            className={`rounded-2xl px-4 py-3 text-[14px] leading-relaxed ${
              isAI
                ? "bg-card border border-border/60 text-foreground rounded-tl-md shadow-sm"
                : isSystem
                ? "bg-muted/50 border border-border/30 text-muted-foreground rounded-2xl text-center text-[12px]"
                : "gradient-primary text-primary-foreground rounded-tr-md shadow-soft"
            }`}
          >
            {text}
          </div>
        )}
        {!isAI && !isSystem && (
          <span className="text-[10px] text-muted-foreground/50 mt-1 mr-1 self-end font-semibold uppercase tracking-widest">
            You
          </span>
        )}
      </div>
    </div>
  );
};

export default ChatBubble;
