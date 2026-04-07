interface ChatBubbleProps {
  role: "user" | "ai";
  text: string;
}

const ChatBubble = ({ role, text }: ChatBubbleProps) => {
  const isAI = role === "ai";

  return (
    <div className={`flex ${isAI ? "justify-start" : "justify-end"} animate-slide-up`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isAI
            ? "bg-card border border-border text-foreground rounded-tl-md"
            : "bg-primary text-primary-foreground rounded-tr-md"
        }`}
      >
        {text}
      </div>
    </div>
  );
};

export default ChatBubble;
