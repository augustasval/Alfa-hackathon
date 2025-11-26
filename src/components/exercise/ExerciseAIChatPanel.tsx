import { useState, useEffect, useRef } from "react";
import { MessageCircle, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { Problem, ChatMessage } from "@/types/exerciseTypes";
import { SessionManager } from "@/lib/sessionManager";

interface ExerciseAIChatPanelProps {
  selectedProblem: Problem | null;
  topic: string;
  onClose: () => void;
  isOpen: boolean;
}

export const ExerciseAIChatPanel = ({
  selectedProblem,
  topic,
  onClose,
  isOpen,
}: ExerciseAIChatPanelProps) => {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isSendingChat, setIsSendingChat] = useState(false);

  // Ref for auto-scrolling to bottom of messages
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change or loading state changes
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, isSendingChat]);

  const sendChatMessage = async () => {
    if (!chatInput.trim() || isSendingChat) return;

    const message = chatInput;
    // Add user message immediately
    setChatMessages(prev => [...prev, { role: 'user', content: message }]);
    setChatInput("");
    setIsSendingChat(true);

    try {
      // Get session ID
      const sessionId = SessionManager.getSession();

      const response = await fetch('https://oopsautomation.app.n8n.cloud/webhook/chatassuAItheory1421', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // Session tracking
          sessionId: sessionId, // Main user session ID
          // User message
          message: message,
          // Problem data - all math expressions are in LaTeX format (use $...$ for inline, $$...$$ for display)
          problem: selectedProblem ? {
            question: selectedProblem.question, // LaTeX format
            hint: selectedProblem.hint, // LaTeX format
            difficulty: selectedProblem.difficulty,
            detailedSolution: selectedProblem.detailedSolution.map(step => ({
              step: step.step, // LaTeX format
              explanation: step.explanation
            })),
            answer: selectedProblem.answer, // LaTeX format
          } : null,
          // Context
          topic: topic,
          chatHistory: chatMessages.map(m => ({
            role: m.role,
            content: m.content
          })),
          // Metadata
          timestamp: new Date().toISOString(),
          contentFormat: "latex", // Indicates math expressions are in LaTeX format
        }),
      });

      if (response.ok) {
        const responseText = await response.text();
        try {
          const data = JSON.parse(responseText);
          const aiMessage = data.message || data.response || data.text || data.output || responseText;
          setChatMessages(prev => [...prev, { role: 'ai', content: aiMessage }]);
        } catch {
          setChatMessages(prev => [...prev, { role: 'ai', content: responseText }]);
        }
      } else {
        setChatMessages(prev => [...prev, {
          role: 'ai',
          content: "Sorry, I couldn't process your request. Please try again."
        }]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      setChatMessages(prev => [...prev, {
        role: 'ai',
        content: "Sorry, there was an error connecting to the AI. Please try again."
      }]);
    } finally {
      setIsSendingChat(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-xl flex flex-col h-full p-0">
        <div className="p-6 border-b border-border">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-primary" />
              Ask About This Problem
            </SheetTitle>
            <SheetDescription>
              Have a question about this problem? Ask the AI tutor for help!
            </SheetDescription>
          </SheetHeader>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Problem Context */}
          {selectedProblem && (
            <div className="p-4 bg-secondary/30 rounded-lg">
              <p className="text-sm font-medium mb-2">Problem Context:</p>
              <div className="prose prose-sm dark:prose-invert">
                <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                  {selectedProblem.question}
                </ReactMarkdown>
              </div>
              {selectedProblem.hint && (
                <div className="mt-3 pt-3 border-t border-border">
                  <p className="text-sm font-medium mb-1">Hint:</p>
                  <div className="prose prose-sm dark:prose-invert">
                    <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                      {selectedProblem.hint}
                    </ReactMarkdown>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Chat Messages */}
          {chatMessages.map((msg, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-lg ${
                msg.role === 'user'
                  ? 'bg-primary/10 ml-8'
                  : 'bg-secondary/20 mr-8'
              }`}
            >
              <p className="text-xs font-semibold mb-2 text-muted-foreground">
                {msg.role === 'user' ? 'You' : 'AI Tutor'}
              </p>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                  {msg.content}
                </ReactMarkdown>
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {isSendingChat && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">AI Tutor is thinking...</span>
            </div>
          )}

          {/* Auto-scroll anchor */}
          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input */}
        <div className="p-6 border-t border-border space-y-3">
          <div className="flex gap-2">
            <Textarea
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendChatMessage();
                }
              }}
              placeholder="Ask a question about this problem..."
              className="min-h-[60px] resize-none"
              disabled={isSendingChat}
            />
            <Button
              onClick={sendChatMessage}
              disabled={isSendingChat || !chatInput.trim()}
              size="icon"
              className="h-[60px] w-[60px] shrink-0"
            >
              {isSendingChat ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
