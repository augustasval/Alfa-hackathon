import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Send, Loader2, CheckCircle, XCircle, Trash2 } from "lucide-react";
import katex from "katex";
import "katex/dist/katex.min.css";
import { WebhookStep } from "@/types/exerciseTypes";
import { toast } from "sonner";

interface IncorrectStep {
  stepNumber: number;
  correctAnswer?: string | null;
  explanation?: string | null;
}

interface CorrectSolutionStep {
  stepNumber: number;
  latex: string;
}

interface ValidationResponse {
  isCorrect: boolean;
  incorrectSteps: IncorrectStep[];
  correctSteps: number[];
  correctSolution?: CorrectSolutionStep[] | null;
  feedback: string;
}

interface WebhookStepsDisplayProps {
  steps: WebhookStep[];
  onStepsChange: (steps: WebhookStep[]) => void;
  onDismiss: () => void;
  problemQuestion?: string;
  onWebhookResponse?: (response: string) => void;
}

export const WebhookStepsDisplay = ({
  steps,
  onStepsChange,
  onDismiss,
  problemQuestion,
  onWebhookResponse,
}: WebhookStepsDisplayProps) => {
  const [editingStepId, setEditingStepId] = useState<number | null>(null);
  const [editingLatex, setEditingLatex] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResponse | null>(null);

  const handleStepClick = (step: WebhookStep) => {
    setEditingStepId(step.id);
    setEditingLatex(step.latex);
  };

  const handleStepSave = () => {
    if (editingStepId !== null) {
      onStepsChange(steps.map(step =>
        step.id === editingStepId
          ? { ...step, latex: editingLatex }
          : step
      ));
      setEditingStepId(null);
      setEditingLatex('');
    }
  };

  const handleStepCancel = () => {
    setEditingStepId(null);
    setEditingLatex('');
  };

  const handleDeleteStep = (stepId: number) => {
    const updatedSteps = steps
      .filter(step => step.id !== stepId)
      .map((step, index) => ({ ...step, id: index + 1 })); // Re-number steps
    onStepsChange(updatedSteps);
  };

  const handleSubmitSteps = async () => {
    setIsSubmitting(true);
    setValidationResult(null);
    try {
      const payload = {
        problem: problemQuestion || '',
        steps: steps.map(step => ({
          stepNumber: step.id,
          latex: step.latex,
        })),
        timestamp: new Date().toISOString(),
      };

      const response = await fetch('https://oopsautomation.app.n8n.cloud/webhook/matkestestai2324', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const responseText = await response.text();
        try {
          const data = JSON.parse(responseText);
          // Check if it's the validation response format
          if ('isCorrect' in data && 'feedback' in data) {
            setValidationResult(data as ValidationResponse);
            if (onWebhookResponse) {
              onWebhookResponse(data.feedback);
            }
          } else {
            // Fallback for other response formats
            const feedback = data.message || data.response || data.text || data.output || responseText;
            setValidationResult({
              isCorrect: true,
              incorrectSteps: [],
              correctSteps: steps.map(s => s.id),
              feedback: feedback
            });
            if (onWebhookResponse) {
              onWebhookResponse(feedback);
            }
          }
        } catch {
          setValidationResult({
            isCorrect: true,
            incorrectSteps: [],
            correctSteps: steps.map(s => s.id),
            feedback: responseText
          });
          if (onWebhookResponse) {
            onWebhookResponse(responseText);
          }
        }
        setIsSubmitted(true);
        toast.success('Solution checked!');
      } else {
        toast.error('Failed to submit. Please try again.');
      }
    } catch (error) {
      console.error('Submit error:', error);
      toast.error('Failed to submit. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper functions for step status
  const getStepStatus = (stepId: number): 'correct' | 'incorrect' | 'neutral' => {
    if (!validationResult) return 'neutral';
    if (validationResult.correctSteps.includes(stepId)) return 'correct';
    if (validationResult.incorrectSteps.some(s => s.stepNumber === stepId)) return 'incorrect';
    return 'neutral';
  };

  const getIncorrectStepInfo = (stepId: number): IncorrectStep | undefined => {
    if (!validationResult) return undefined;
    return validationResult.incorrectSteps.find(s => s.stepNumber === stepId);
  };

  return (
    <Card className="p-6 bg-blue-500/10 border-blue-500/30 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🎓</span>
          <span className="text-lg font-bold">Solution Steps</span>
        </div>
        <span className="text-xs text-muted-foreground">
          Click any step to edit
        </span>
      </div>
      <div className="space-y-4">
        {steps.map((step) => {
          const status = getStepStatus(step.id);
          const incorrectInfo = getIncorrectStepInfo(step.id);

          // Determine step badge color
          const getBadgeColor = () => {
            if (status === 'correct') return 'from-green-500 to-green-600';
            if (status === 'incorrect') return 'from-red-500 to-red-600';
            return 'from-blue-500 to-purple-500';
          };

          // Determine card border color
          const getCardStyle = () => {
            if (editingStepId === step.id) return 'bg-primary/10 border-primary/50';
            if (status === 'correct') return 'bg-green-500/10 border-green-500/30';
            if (status === 'incorrect') return 'bg-red-500/10 border-red-500/30';
            return 'bg-background/50 hover:bg-accent/50';
          };

          return (
            <Card
              key={step.id}
              className={`p-4 ${getCardStyle()} transition-all`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getBadgeColor()} flex items-center justify-center text-white font-bold flex-shrink-0`}>
                  {status === 'correct' ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : status === 'incorrect' ? (
                    <XCircle className="h-5 w-5" />
                  ) : (
                    step.id
                  )}
                </div>
                <div className="flex-1">
                  {editingStepId === step.id ? (
                    <div className="space-y-3">
                      <Input
                        value={editingLatex}
                        onChange={(e) => setEditingLatex(e.target.value)}
                        className="font-mono"
                        autoFocus
                      />
                      <Card className="p-3 bg-muted/50">
                        <p className="text-xs text-muted-foreground mb-2">Preview:</p>
                        <div
                          className="text-xl"
                          dangerouslySetInnerHTML={{
                            __html: katex.renderToString(editingLatex, {
                              displayMode: true,
                              throwOnError: false
                            })
                          }}
                        />
                      </Card>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleStepSave}>
                          Save
                        </Button>
                        <Button size="sm" variant="outline" onClick={handleStepCancel}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2">
                      <div
                        onClick={() => !isSubmitted && handleStepClick(step)}
                        className={`flex-1 p-2 rounded-lg transition-all ${!isSubmitted ? 'cursor-pointer hover:bg-accent/30' : ''}`}
                      >
                        <div
                          className="text-xl"
                          dangerouslySetInnerHTML={{
                            __html: katex.renderToString(step.latex, {
                              displayMode: true,
                              throwOnError: false
                            })
                          }}
                        />
                        {!isSubmitted && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Click to edit
                          </p>
                        )}
                      </div>
                      {!isSubmitted && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 flex-shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteStep(step.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Dropdown for incorrect step - shows explanation and correct answer */}
                  {status === 'incorrect' && incorrectInfo && isSubmitted && (
                    <div className="mt-4 pt-4 border-t border-red-500/30 space-y-3">
                      {incorrectInfo.explanation && (
                        <div className="bg-red-500/10 p-3 rounded-lg">
                          <p className="text-xs font-semibold text-red-400 mb-1">What went wrong:</p>
                          <p className="text-sm">{incorrectInfo.explanation}</p>
                        </div>
                      )}
                      {incorrectInfo.correctAnswer && (
                        <div className="bg-green-500/10 p-3 rounded-lg">
                          <p className="text-xs font-semibold text-green-400 mb-2">Correct solution:</p>
                          <div
                            className="text-lg"
                            dangerouslySetInnerHTML={{
                              __html: katex.renderToString(incorrectInfo.correctAnswer, {
                                displayMode: true,
                                throwOnError: false
                              })
                            }}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
      {/* Loading State */}
      {isSubmitting && (
        <Card className="p-6 bg-purple-500/10 border-purple-500/30 mt-4">
          <div className="flex items-center justify-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-purple-500" />
            <span className="text-lg font-medium">Checking your solution...</span>
          </div>
        </Card>
      )}

      {/* Overall Feedback */}
      {validationResult && !isSubmitting && (
        <Card className={`p-4 mt-4 ${validationResult.isCorrect ? 'bg-green-500/10 border-green-500/30' : 'bg-orange-500/10 border-orange-500/30'}`}>
          <div className="flex items-center gap-3">
            {validationResult.isCorrect ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <XCircle className="h-5 w-5 text-orange-500" />
            )}
            <p className="text-sm font-medium">{validationResult.feedback}</p>
          </div>
        </Card>
      )}

      {/* Correct Solution - shows when there are incorrect steps */}
      {validationResult && !validationResult.isCorrect && validationResult.correctSolution && validationResult.correctSolution.length > 0 && !isSubmitting && (
        <Card className="p-6 bg-green-500/10 border-green-500/30 mt-4">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <span className="text-lg font-bold text-green-400">Correct Solution</span>
          </div>
          <div className="space-y-3">
            {validationResult.correctSolution.map((step) => (
              <div key={step.stepNumber} className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 font-bold flex-shrink-0">
                  {step.stepNumber}
                </div>
                <div className="flex-1 p-3 bg-background/50 rounded-lg">
                  <div
                    className="text-lg"
                    dangerouslySetInnerHTML={{
                      __html: katex.renderToString(step.latex, {
                        displayMode: true,
                        throwOnError: false
                      })
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 mt-4">
        {!isSubmitted ? (
          <>
            <Button
              onClick={handleSubmitSteps}
              disabled={isSubmitting || editingStepId !== null}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Submit Solution
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={onDismiss}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </>
        ) : (
          <Button
            variant="outline"
            onClick={onDismiss}
          >
            Done
          </Button>
        )}
      </div>
    </Card>
  );
};
