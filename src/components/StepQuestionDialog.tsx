import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle, Loader2, Send, Image } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { MathGraph } from "./MathGraph";
import { TheoryQuiz } from "./TheoryQuiz";
import { supabase } from "@/integrations/supabase/client";
import { SessionManager } from "@/lib/sessionManager";

// Generate a chat session ID for theory conversations
const getTheoryChatSessionId = (topic: string): string => {
  const storageKey = `theoryChatSession_${topic}`;
  let chatSessionId = sessionStorage.getItem(storageKey);

  if (!chatSessionId) {
    // Generate new UUID for this theory chat session
    chatSessionId = 'tc-' + crypto.randomUUID?.() ||
      'tc-' + 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    sessionStorage.setItem(storageKey, chatSessionId);
  }

  return chatSessionId;
};

interface Message {
  role: "user" | "assistant";
  content: string;
  graphData?: {
    type: "parabola" | "line" | "points";
    parameters: any;
  };
}

interface StepQuestionDialogProps {
  stepContent: string;
  stepExplanation: string;
  stepExample?: string;
  topic: string;
  gradeLevel: string;
}

export const StepQuestionDialog = ({
  stepContent,
  stepExplanation,
  stepExample,
  topic,
  gradeLevel,
}: StepQuestionDialogProps) => {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [canGenerateVisual, setCanGenerateVisual] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [canShowQuiz, setCanShowQuiz] = useState(false);
  const { toast: toastHook } = useToast();

  // Ref for auto-scrolling to bottom of messages
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change or loading state changes
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Check if the last message context supports visual generation and quiz
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === "assistant") {
        // Only show button for specific quadratic/parabola contexts
        const content = lastMessage.content.toLowerCase();
        const hasQuadraticContext = 
          (content.includes("parabola") || content.includes("quadratic")) &&
          (content.includes("discriminant") || content.includes("root") || content.includes("solution") || content.includes("x-axis"));
        
        setCanGenerateVisual(hasQuadraticContext);
      }
    }

    // Check if enough theory has been discussed (at least 3 AI responses)
    const aiResponses = messages.filter(m => m.role === "assistant");
    const hasSubstantialTheory = aiResponses.length >= 3 && 
      aiResponses.some(m => m.content.length > 200);
    
    setCanShowQuiz(hasSubstantialTheory && !showQuiz);
  }, [messages, showQuiz]);

  const generateQuiz = async () => {
    setIsGeneratingQuiz(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-quiz", {
        body: {
          conversationHistory: messages,
          topic: topic,
          gradeLevel: gradeLevel,
        },
      });

      if (error) throw error;

      if (data?.questions && data.questions.length > 0) {
        setQuizQuestions(data.questions);
        setShowQuiz(true);
        toast.success("Quiz generated!");
      } else {
        toast.error("Failed to generate quiz questions");
      }
    } catch (error) {
      console.error("Error generating quiz:", error);
      toast.error("Failed to generate quiz");
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  const handleQuizComplete = (score: number) => {
    const percentage = Math.round((score / quizQuestions.length) * 100);
    toast.success(`Quiz complete! You scored ${score}/${quizQuestions.length} (${percentage}%)`);
  };

  const handleReadTheory = () => {
    setShowQuiz(false);
    setQuizQuestions([]);
  };

  const handleRetryQuiz = () => {
    setShowQuiz(false);
    setTimeout(() => {
      generateQuiz();
    }, 100);
  };

  const generateVisualExample = async () => {
    if (messages.length === 0) return;
    
    const lastAssistantMessage = [...messages].reverse().find(m => m.role === "assistant");
    if (!lastAssistantMessage) return;

    setIsGeneratingImage(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-graph-data`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            context: lastAssistantMessage.content,
            topic,
            gradeLevel,
            stepContent,
            stepExample,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to generate graph data");
      }

      const data = await response.json();

      if (data.graphData) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Here's a visual representation to help you understand:",
            graphData: data.graphData,
          },
        ]);
      }
    } catch (error) {
      console.error("Error generating graph:", error);
      toastHook({
        title: "Error",
        description: "Failed to generate graph. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const askQuestion = async () => {
    if (!question.trim()) {
      toastHook({
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
      // Get session IDs for tracking
      const mainSessionId = SessionManager.getSession();
      const theoryChatSessionId = getTheoryChatSessionId(topic);

      const response = await fetch(
        'https://oopsautomation.app.n8n.cloud/webhook/theoryactual53423',
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            // Session tracking
            sessionId: mainSessionId, // Main user session ID
            chatSessionId: theoryChatSessionId, // Unique ID for this theory chat (persists across steps)
            // Theory content - all in LaTeX format (use $...$ for inline math, $$...$$ for display math)
            stepTitle: stepContent,
            stepExplanation: stepExplanation, // Contains LaTeX math expressions
            stepExample: stepExample, // Contains LaTeX math expressions
            // User interaction
            userQuestion: userMessage.content,
            conversationHistory: messages.map(m => ({
              role: m.role,
              content: m.content
            })),
            // Context
            topic: topic,
            gradeLevel: gradeLevel,
            // Metadata
            timestamp: new Date().toISOString(),
            contentFormat: "latex", // Indicates math expressions are in LaTeX format
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to get AI response");
      }

      const responseText = await response.text();
      let aiResponse = "";

      try {
        const data = JSON.parse(responseText);
        aiResponse = data.message || data.response || data.text || data.output || responseText;
      } catch {
        aiResponse = responseText;
      }

      setMessages((prev) => [...prev, { role: "assistant", content: aiResponse }]);
    } catch (error) {
      console.error("Error asking question:", error);
      toastHook({
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
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
      >
        <MessageCircle className="w-4 h-4 mr-1" />
        Ask AI
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full sm:max-w-xl flex flex-col h-full p-0">
          <div className="p-6 border-b border-border">
            <SheetHeader>
              <SheetTitle>Ask About This Step</SheetTitle>
              <SheetDescription>
                Have a question about this step? Ask the AI tutor for help!
              </SheetDescription>
            </SheetHeader>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <div className="p-4 bg-secondary/30 rounded-lg">
              <p className="text-sm font-medium mb-2">Step Context:</p>
              <div className="prose prose-sm dark:prose-invert">
                <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                  {stepContent}
                </ReactMarkdown>
              </div>
              {stepExample && (
                <div className="mt-3 pt-3 border-t border-border">
                  <p className="text-sm font-medium mb-1">Example:</p>
                  <div className="prose prose-sm dark:prose-invert">
                    <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                      {stepExample}
                    </ReactMarkdown>
                  </div>
                </div>
              )}
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
                {message.graphData && (
                  <div className="mt-3">
                    <MathGraph
                      type={message.graphData.type}
                      parameters={message.graphData.parameters}
                      interactive={true}
                    />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">AI Tutor is thinking...</span>
              </div>
            )}
            {/* Auto-scroll anchor */}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-6 border-t border-border space-y-3">
            {canGenerateVisual && !isGeneratingImage && (
              <Button
                onClick={generateVisualExample}
                variant="outline"
                className="w-full"
                disabled={isLoading}
              >
                <Image className="w-4 h-4 mr-2" />
                Generate Interactive Graph
              </Button>
            )}
            
            {isGeneratingImage && (
              <div className="flex items-center justify-center gap-2 text-muted-foreground p-3 bg-secondary/20 rounded-lg">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Creating visual example...</span>
              </div>
            )}

            {canShowQuiz && !showQuiz && (
              <Button
                onClick={generateQuiz}
                disabled={isGeneratingQuiz || isLoading}
                className="w-full"
                variant="default"
              >
                {isGeneratingQuiz ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Quiz...
                  </>
                ) : (
                  "Take Quiz on Theory"
                )}
              </Button>
            )}

            {showQuiz && quizQuestions.length > 0 && (
              <div className="mb-4">
                <TheoryQuiz
                  questions={quizQuestions}
                  onComplete={handleQuizComplete}
                  onReadTheory={handleReadTheory}
                  onRetry={handleRetryQuiz}
                />
              </div>
            )}

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
