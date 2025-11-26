import { Card } from "@/components/ui/card";
import { User, Bot } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface MathMessageProps {
  message: Message;
}

export const MathMessage = ({ message }: MathMessageProps) => {
  const isUser = message.role === "user";

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
        isUser ? "bg-secondary" : "bg-primary/10"
      }`}>
        {isUser ? (
          <User className="h-4 w-4 text-secondary-foreground" />
        ) : (
          <Bot className="h-4 w-4 text-primary" />
        )}
      </div>
      <Card className={`flex-1 p-4 ${
        isUser 
          ? "bg-secondary text-secondary-foreground" 
          : "bg-card border-accent/20"
      }`}>
        <div className="prose prose-sm max-w-none dark:prose-invert">
          <ReactMarkdown
            remarkPlugins={[remarkMath]}
            rehypePlugins={[rehypeKatex]}
            components={{
              p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
              ul: ({ children }) => <ul className="ml-4 mb-2 list-disc">{children}</ul>,
              ol: ({ children }) => <ol className="ml-4 mb-2 list-decimal">{children}</ol>,
              li: ({ children }) => <li className="mb-1">{children}</li>,
              strong: ({ children }) => <strong className="text-primary font-semibold">{children}</strong>,
              h3: ({ children }) => <h3 className="text-lg font-semibold mb-2 text-foreground">{children}</h3>,
              code: ({ children }) => <code className="bg-muted px-1 py-0.5 rounded text-sm font-mono">{children}</code>,
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>
        <div className={`text-xs mt-2 ${
          isUser ? "text-secondary-foreground/70" : "text-muted-foreground"
        }`}>
          {message.timestamp.toLocaleTimeString()}
        </div>
      </Card>
    </div>
  );
};
