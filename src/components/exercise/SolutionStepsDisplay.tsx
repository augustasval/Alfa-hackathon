import { ChevronRight, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { Problem } from "@/types/exerciseTypes";
import { ExerciseSolutionQuestion } from "@/components/ExerciseSolutionQuestion";

interface SolutionStepsDisplayProps {
  problem: Problem;
  visibleStepCount: number;
  selectedIncorrectSteps: number[];
  onToggleIncorrectStep: (idx: number) => void;
  onShowNextStep: () => void;
  onGoToNextQuestion: () => void;
}

export const SolutionStepsDisplay = ({
  problem,
  visibleStepCount,
  selectedIncorrectSteps,
  onToggleIncorrectStep,
  onShowNextStep,
  onGoToNextQuestion,
}: SolutionStepsDisplayProps) => {
  const allStepsVisible = visibleStepCount >= problem.detailedSolution.length;

  return (
    <>
      <Card className="p-4 bg-secondary/10 border-secondary/20 mb-4">
        <p className="text-sm font-semibold mb-3">📝 Solution Steps:</p>
        <p className="text-xs text-muted-foreground mb-4">Click any steps you got wrong to mark them as mistakes</p>
        <div className="space-y-3">
          {problem.detailedSolution.slice(0, visibleStepCount).map((step, idx) => {
            const isSelected = selectedIncorrectSteps.includes(idx);
            return (
              <div
                key={idx}
                onClick={() => onToggleIncorrectStep(idx)}
                className={`p-3 rounded-lg cursor-pointer transition-all border-2 ${
                  isSelected
                    ? "border-destructive bg-destructive/5"
                    : "border-transparent hover:bg-accent/50"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 flex-1">
                    <Badge variant="outline" className="mt-0.5">{idx + 1}</Badge>
                    {isSelected && (
                      <XCircle className="h-4 w-4 text-destructive shrink-0 mt-1" />
                    )}
                    <div className="flex-1 prose prose-sm dark:prose-invert">
                      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                        {step.step}
                      </ReactMarkdown>
                    </div>
                  </div>
                  <ExerciseSolutionQuestion
                    problemQuestion={problem.question}
                    stepContent={step.step}
                    stepExplanation={step.explanation}
                  />
                </div>
                <p className="text-xs text-muted-foreground italic ml-10">{step.explanation}</p>
              </div>
            );
          })}
        </div>

        {/* Show Next Step Button */}
        {!allStepsVisible && (
          <Button
            onClick={onShowNextStep}
            variant="outline"
            className="w-full mt-4"
          >
            Show Next Step
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        )}

        {/* Show Answer when all steps are visible */}
        {allStepsVisible && (
          <div className="mt-4 p-3 bg-green-500/10 rounded-lg border border-green-500/30">
            <p className="text-sm font-semibold text-green-400">Answer: </p>
            <div className="prose prose-sm dark:prose-invert">
              <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                {`$${problem.answer}$`}
              </ReactMarkdown>
            </div>
          </div>
        )}
      </Card>

      {/* Go to Next Question - only when all steps shown */}
      {allStepsVisible && (
        <Button onClick={onGoToNextQuestion} className="w-full" size="lg">
          Go to Next Question
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      )}
    </>
  );
};
