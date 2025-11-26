import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Lightbulb, RefreshCw } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

interface Problem {
  id: string;
  question: string;
  answer: string;
  hint: string;
  explanation: string;
}

interface PracticeProblemsProps {
  difficulty: "easy" | "medium" | "hard";
}

export const PracticeProblems = ({ difficulty }: PracticeProblemsProps) => {
  const [problems, setProblems] = useState<Problem[]>(generateProblems(difficulty));
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [showHints, setShowHints] = useState<Record<string, boolean>>({});
  const [checkedAnswers, setCheckedAnswers] = useState<Record<string, boolean>>({});

  function generateProblems(level: "easy" | "medium" | "hard"): Problem[] {
    const problemSets = {
      easy: [
        {
          id: "1",
          question: "Solve for $x$: $2x + 5 = 13$",
          answer: "4",
          hint: "First, subtract 5 from both sides, then divide by 2",
          explanation: "Step 1: $2x + 5 - 5 = 13 - 5$ → $2x = 8$\n\nStep 2: $\\frac{2x}{2} = \\frac{8}{2}$ → $x = 4$",
        },
        {
          id: "2",
          question: "What is $\\frac{3}{4} + \\frac{1}{4}$?",
          answer: "1",
          hint: "The denominators are the same, so just add the numerators",
          explanation: "$\\frac{3}{4} + \\frac{1}{4} = \\frac{3+1}{4} = \\frac{4}{4} = 1$",
        },
        {
          id: "3",
          question: "Calculate: $5 \\times (3 + 2)$",
          answer: "25",
          hint: "Remember PEMDAS! Do parentheses first",
          explanation: "Step 1: $(3 + 2) = 5$\n\nStep 2: $5 \\times 5 = 25$",
        },
      ],
      medium: [
        {
          id: "1",
          question: "Solve: $3x^2 - 12 = 0$",
          answer: "2,-2",
          hint: "Factor out 3, then use the difference of squares formula",
          explanation: "Step 1: $3x^2 = 12$ → $x^2 = 4$\n\nStep 2: $x = \\pm\\sqrt{4} = \\pm 2$\n\nSolutions: $x = 2$ or $x = -2$",
        },
        {
          id: "2",
          question: "Find the derivative: $f(x) = 3x^2 + 4x - 1$",
          answer: "6x+4",
          hint: "Use the power rule: bring down the exponent and reduce it by 1",
          explanation: "$f'(x) = 3(2)x^{2-1} + 4(1)x^{1-1} - 0 = 6x + 4$",
        },
        {
          id: "3",
          question: "Simplify: $\\frac{2x + 6}{2}$",
          answer: "x+3",
          hint: "Factor the numerator first, then cancel common terms",
          explanation: "$\\frac{2x + 6}{2} = \\frac{2(x+3)}{2} = x + 3$",
        },
      ],
      hard: [
        {
          id: "1",
          question: "Solve using the quadratic formula: $2x^2 + 7x - 4 = 0$",
          answer: "0.5,-4",
          hint: "Use $x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}$ with $a=2, b=7, c=-4$",
          explanation: "Step 1: $a=2, b=7, c=-4$\n\nStep 2: $x = \\frac{-7 \\pm \\sqrt{49-4(2)(-4)}}{4} = \\frac{-7 \\pm \\sqrt{81}}{4}$\n\nStep 3: $x = \\frac{-7 \\pm 9}{4}$\n\nSolutions: $x = 0.5$ or $x = -4$",
        },
        {
          id: "2",
          question: "Integrate: $\\int (3x^2 + 2x) dx$",
          answer: "x^3+x^2+C",
          hint: "Use the power rule for integration: increase the exponent by 1 and divide",
          explanation: "$\\int 3x^2 dx = \\frac{3x^3}{3} = x^3$\n\n$\\int 2x dx = \\frac{2x^2}{2} = x^2$\n\nResult: $x^3 + x^2 + C$",
        },
        {
          id: "3",
          question: "Find the limit: $\\lim_{x \\to 2} \\frac{x^2-4}{x-2}$",
          answer: "4",
          hint: "Factor the numerator as a difference of squares, then simplify",
          explanation: "Step 1: Factor $x^2-4 = (x+2)(x-2)$\n\nStep 2: $\\frac{(x+2)(x-2)}{x-2} = x+2$ (for $x \\neq 2$)\n\nStep 3: $\\lim_{x \\to 2} (x+2) = 4$",
        },
      ],
    };

    return problemSets[level];
  }

  const handleAnswerChange = (problemId: string, value: string) => {
    setUserAnswers((prev) => ({ ...prev, [problemId]: value }));
  };

  const toggleHint = (problemId: string) => {
    setShowHints((prev) => ({ ...prev, [problemId]: !prev[problemId] }));
  };

  const checkAnswer = (problem: Problem) => {
    const userAnswer = userAnswers[problem.id]?.toLowerCase().replace(/\s/g, "");
    const correctAnswer = problem.answer.toLowerCase().replace(/\s/g, "");

    if (userAnswer === correctAnswer) {
      setCheckedAnswers((prev) => ({ ...prev, [problem.id]: true }));
      toast({
        title: "Correct! 🎉",
        description: "Great job! You got it right.",
      });
    } else {
      setCheckedAnswers((prev) => ({ ...prev, [problem.id]: false }));
      toast({
        title: "Not quite right",
        description: "Review the hint and try again, or check the explanation.",
        variant: "destructive",
      });
    }
  };

  const regenerateProblems = () => {
    setProblems(generateProblems(difficulty));
    setUserAnswers({});
    setShowHints({});
    setCheckedAnswers({});
    toast({
      title: "New problems generated!",
      description: `Generated ${difficulty} level practice problems.`,
    });
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold">Practice Problems</h2>
          <p className="text-sm text-muted-foreground">
            Difficulty: <Badge variant="secondary">{difficulty}</Badge>
          </p>
        </div>
        <Button onClick={regenerateProblems} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          New Problems
        </Button>
      </div>

      <div className="space-y-6">
        {problems.map((problem, index) => (
          <Card key={problem.id} className="p-4 bg-accent/5 border-accent">
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <Badge variant="outline" className="mt-1">
                  {index + 1}
                </Badge>
                <div className="flex-1 prose prose-sm dark:prose-invert">
                  <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                    {problem.question}
                  </ReactMarkdown>
                </div>
              </div>

              <div className="flex gap-2">
                <Input
                  placeholder="Your answer..."
                  value={userAnswers[problem.id] || ""}
                  onChange={(e) => handleAnswerChange(problem.id, e.target.value)}
                  className="flex-1"
                />
                <Button onClick={() => checkAnswer(problem)} variant="default">
                  Check
                </Button>
                <Button onClick={() => toggleHint(problem.id)} variant="outline" size="icon">
                  <Lightbulb className="h-4 w-4" />
                </Button>
              </div>

              {checkedAnswers[problem.id] !== undefined && (
                <div className={`flex items-center gap-2 text-sm ${
                  checkedAnswers[problem.id] ? "text-primary" : "text-destructive"
                }`}>
                  {checkedAnswers[problem.id] ? (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      <span>Correct!</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4" />
                      <span>Incorrect - Try again or check the hint</span>
                    </>
                  )}
                </div>
              )}

              {showHints[problem.id] && (
                <Card className="p-3 bg-primary/5 border-primary/20">
                  <div className="flex items-start gap-2">
                    <Lightbulb className="h-4 w-4 text-primary mt-1" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-primary mb-1">Hint:</p>
                      <p className="text-sm text-foreground">{problem.hint}</p>
                    </div>
                  </div>
                  {checkedAnswers[problem.id] === false && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <p className="text-sm font-semibold mb-2">Explanation:</p>
                      <div className="prose prose-sm dark:prose-invert">
                        <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                          {problem.explanation}
                        </ReactMarkdown>
                      </div>
                    </div>
                  )}
                </Card>
              )}
            </div>
          </Card>
        ))}
      </div>
    </Card>
  );
};
