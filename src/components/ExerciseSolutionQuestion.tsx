import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle, Loader2, Send } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ExerciseSolutionQuestionProps {
  problemQuestion: string;
  stepContent: string;
  stepExplanation: string;
  topic?: string;
  gradeLevel?: string;
}

export const ExerciseSolutionQuestion = ({
  problemQuestion,
  stepContent,
  stepExplanation,
  topic = "Mathematics",
  gradeLevel = "High School",
}: ExerciseSolutionQuestionProps) => {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const askQuestion = async () => {
    if (!question.trim()) {
      toast({
        title: "Please enter a question",
        variant: "destructive",
      });
      return;
    }

    const userMessage: Message = { role: "user", content: question };
    setMessages((prev) => [...prev, userMessage]);
    setQuestion("");
    setIsLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ask-step-question`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            stepContent: `Problem: ${problemQuestion}\n\nStep: ${stepContent}`,
            stepExplanation,
            stepExample: "",
            userQuestion: userMessage.content,
            topic,
            gradeLevel,
            conversationHistory: messages,
          }),
        }
      );

      if (!response.ok || !response.body) {
        throw new Error("Failed to get AI response");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let streamDone = false;
      let aiResponse = "";

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") {
            streamDone = true;
            break;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              aiResponse += content;
              setMessages((prev) => {
                const lastMessage = prev[prev.length - 1];
                if (lastMessage?.role === "assistant") {
                  return [...prev.slice(0, -1), { role: "assistant", content: aiResponse }];
                }
                return [...prev, { role: "assistant", content: aiResponse }];
              });
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }
    } catch (error) {
      console.error("Error asking question:", error);
      toast({
        title: "Error",
        description: "Failed to get AI response. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        className="h-6 px-2 text-xs"
      >
        <MessageCircle className="w-3 h-3 mr-1" />
        Ask AI
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full sm:max-w-xl flex flex-col h-full p-0">
          <div className="p-6 border-b border-border">
            <SheetHeader>
              <SheetTitle>Ask About This Step</SheetTitle>
              <SheetDescription>
                Have a question about this solution step? Ask the AI tutor for help!
              </SheetDescription>
            </SheetHeader>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <div className="p-4 bg-secondary/30 rounded-lg">
              <p className="text-sm font-medium mb-2">Problem:</p>
              <div className="prose prose-sm dark:prose-invert">
                <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                  {problemQuestion}
                </ReactMarkdown>
              </div>
              <div className="mt-3 pt-3 border-t border-border">
                <p className="text-sm font-medium mb-2">Current Step:</p>
                <div className="prose prose-sm dark:prose-invert">
                  <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                    {stepContent}
                  </ReactMarkdown>
                </div>
                <p className="text-xs text-muted-foreground italic mt-1">{stepExplanation}</p>
              </div>
            </div>

            {messages.map((message, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg ${
                  message.role === "user"
                    ? "bg-primary/10 ml-8"
                    : "bg-secondary/20 mr-8"
                }`}
              >
                <p className="text-xs font-semibold mb-2 text-muted-foreground">
                  {message.role === "user" ? "You" : "AI Tutor"}
                </p>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                    {message.content}
                  </ReactMarkdown>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">AI Tutor is thinking...</span>
              </div>
            )}
          </div>

          <div className="p-6 border-t border-border">
            <div className="flex gap-2">
              <Textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    askQuestion();
                  }
                }}
                placeholder="Ask a question about this step..."
                className="min-h-[60px] resize-none"
                disabled={isLoading}
              />
              <Button
                onClick={askQuestion}
                disabled={isLoading || !question.trim()}
                size="icon"
                className="h-[60px] w-[60px] shrink-0"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};
