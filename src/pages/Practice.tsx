import { useState } from "react";
import { Target, CheckCircle, XCircle, Lightbulb } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Navigation } from "@/components/Navigation";
import { GradeTopicSelector } from "@/components/GradeTopicSelector";
import { DifficultySelector } from "@/components/DifficultySelector";
import { toast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

interface DetailedStep {
  step: string;
  explanation: string;
}

interface Problem {
  id: string;
  question: string;
  answer: string;
  hint: string;
  detailedSolution: DetailedStep[];
}

const Practice = () => {
  const [selectedGrade, setSelectedGrade] = useState("9");
  const [selectedTopic, setSelectedTopic] = useState("9-quadratics");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [currentProblem, setCurrentProblem] = useState<Problem>(generateProblem("9-quadratics", difficulty));
  const [userAnswer, setUserAnswer] = useState("");
  const [showHint, setShowHint] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);

  function generateProblem(topicId: string, level: string): Problem {
    const problems: Record<string, Problem[]> = {
      "9-polynomials": [
        {
          id: "poly-p1",
          question: "What is the degree of the polynomial $7x^4 - 3x^2 + 2x - 9$?",
          answer: "4",
          hint: "The degree is the highest exponent on the variable.",
          detailedSolution: [
            { step: "$7x^4 - 3x^2 + 2x - 9$", explanation: "Look at each term in the polynomial" },
            { step: "Exponents: 4, 2, 1, 0", explanation: "The exponents are 4 (from $x^4$), 2 (from $x^2$), 1 (from $x$), and 0 (constant)" },
            { step: "Highest exponent: 4", explanation: "The degree is the highest exponent, which is 4" },
          ],
        },
        {
          id: "poly-p2",
          question: "Simplify: $(4x^2 + 2x - 1) + (3x^2 - 5x + 4)$",
          answer: "7x^2 - 3x + 3",
          hint: "Combine like terms with matching powers of x.",
          detailedSolution: [
            { step: "$(4x^2 + 2x - 1) + (3x^2 - 5x + 4)$", explanation: "Remove parentheses since we're adding" },
            { step: "$4x^2 + 3x^2 + 2x - 5x - 1 + 4$", explanation: "Group terms by degree" },
            { step: "$7x^2 - 3x + 3$", explanation: "Add coefficients: $4+3=7$, $2-5=-3$, $-1+4=3$" },
          ],
        },
        {
          id: "poly-p3",
          question: "Subtract: $(6x^3 + x^2 - 2) - (2x^3 - 3x^2 + 5)$",
          answer: "4x^3 + 4x^2 - 7",
          hint: "Distribute the negative sign to all terms in the second polynomial.",
          detailedSolution: [
            { step: "$(6x^3 + x^2 - 2) - (2x^3 - 3x^2 + 5)$", explanation: "Original subtraction problem" },
            { step: "$6x^3 + x^2 - 2 - 2x^3 + 3x^2 - 5$", explanation: "Distribute negative: change signs of all terms in second polynomial" },
            { step: "$(6x^3 - 2x^3) + (x^2 + 3x^2) + (-2 - 5)$", explanation: "Group like terms" },
            { step: "$4x^3 + 4x^2 - 7$", explanation: "Combine: $6-2=4$, $1+3=4$, $-2-5=-7$" },
          ],
        },
        {
          id: "poly-p4",
          question: "Expand: $(x + 5)(x - 2)$",
          answer: "x^2 + 3x - 10",
          hint: "Use FOIL method or distributive property.",
          detailedSolution: [
            { step: "$(x + 5)(x - 2)$", explanation: "Multiply two binomials" },
            { step: "$x \\cdot x + x \\cdot (-2) + 5 \\cdot x + 5 \\cdot (-2)$", explanation: "FOIL: First, Outer, Inner, Last" },
            { step: "$x^2 - 2x + 5x - 10$", explanation: "Perform multiplications" },
            { step: "$x^2 + 3x - 10$", explanation: "Combine like terms: $-2x + 5x = 3x$" },
          ],
        },
        {
          id: "poly-p5",
          question: "Calculate $(x + 6)^2$",
          answer: "x^2 + 12x + 36",
          hint: "Use the formula $(a + b)^2 = a^2 + 2ab + b^2$",
          detailedSolution: [
            { step: "$(x + 6)^2$", explanation: "Square of a binomial" },
            { step: "$(a + b)^2 = a^2 + 2ab + b^2$ where $a=x, b=6$", explanation: "Apply special product formula" },
            { step: "$x^2 + 2(x)(6) + 6^2$", explanation: "Substitute and calculate each part" },
            { step: "$x^2 + 12x + 36$", explanation: "Simplify: $2 \\cdot 6 = 12$, $6^2 = 36$" },
          ],
        },
        {
          id: "poly-p6",
          question: "Multiply: $3x(2x^2 - 5x + 1)$",
          answer: "6x^3 - 15x^2 + 3x",
          hint: "Distribute 3x to each term.",
          detailedSolution: [
            { step: "$3x(2x^2 - 5x + 1)$", explanation: "Monomial times polynomial" },
            { step: "$3x \\cdot 2x^2 + 3x \\cdot (-5x) + 3x \\cdot 1$", explanation: "Distribute $3x$ to each term" },
            { step: "$6x^3 - 15x^2 + 3x$", explanation: "Multiply: $3 \\cdot 2 = 6$ with $x \\cdot x^2 = x^3$, etc." },
          ],
        },
      ],
      "9-quadratics": [
        {
          id: "q1",
          question: "Solve: $x^2 - 5x + 6 = 0$",
          answer: "2,3",
          hint: "Try factoring first! Look for two numbers that multiply to 6 and add to -5",
          detailedSolution: [
            {
              step: "$x^2 - 5x + 6 = 0$",
              explanation: "We start with our quadratic equation in standard form, where a=1, b=-5, and c=6.",
            },
            {
              step: "$(x - 2)(x - 3) = 0$",
              explanation: "We factor the quadratic by finding two numbers that multiply to give us 6 and add to give us -5. Those numbers are -2 and -3, so we write the factored form.",
            },
            {
              step: "$x - 2 = 0$ or $x - 3 = 0$",
              explanation: "Using the zero product property, if two things multiply to give zero, at least one of them must be zero. So we set each factor equal to zero.",
            },
            {
              step: "$x = 2$ or $x = 3$",
              explanation: "Solving each simple equation gives us our two solutions. We can verify by substituting back: when x=2, we get 4-10+6=0 ✓, and when x=3, we get 9-15+6=0 ✓",
            },
          ],
        },
        {
          id: "q2",
          question: "Solve using the quadratic formula: $2x^2 + 3x - 5 = 0$",
          answer: "1,-2.5",
          hint: "Use the formula: $x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}$ with a=2, b=3, c=-5",
          detailedSolution: [
            {
              step: "Identify: $a=2, b=3, c=-5$",
              explanation: "First, we identify the coefficients from our equation in standard form ax²+bx+c=0.",
            },
            {
              step: "$\\Delta = b^2 - 4ac = 3^2 - 4(2)(-5) = 9 + 40 = 49$",
              explanation: "We calculate the discriminant (Δ) to understand what kind of solutions we'll get. Since 49 is positive, we'll have two real solutions.",
            },
            {
              step: "$x = \\frac{-3 \\pm \\sqrt{49}}{2(2)} = \\frac{-3 \\pm 7}{4}$",
              explanation: "We substitute all our values into the quadratic formula. The square root of 49 is 7, which makes our calculation simpler.",
            },
            {
              step: "$x = \\frac{-3 + 7}{4} = 1$ or $x = \\frac{-3 - 7}{4} = -2.5$",
              explanation: "We solve for both cases: when we add 7 to -3, we get 4/4 = 1. When we subtract 7 from -3, we get -10/4 = -2.5. These are our two solutions.",
            },
          ],
        },
        {
          id: "q3",
          question: "Factor: $x^2 + 8x + 15$",
          answer: "(x + 3)(x + 5)",
          hint: "Find two numbers that multiply to 15 and add to 8.",
          detailedSolution: [
            { step: "$x^2 + 8x + 15$", explanation: "Quadratic expression to factor" },
            { step: "Find factors of 15 that add to 8: 3 and 5", explanation: "Need two numbers with product 15 and sum 8" },
            { step: "$(x + 3)(x + 5)$", explanation: "Write as product of two binomials using those numbers" },
            { step: "Check: $(x+3)(x+5) = x^2 + 5x + 3x + 15 = x^2 + 8x + 15$ ✓", explanation: "Verify by expanding" },
          ],
        },
        {
          id: "q4",
          question: "Solve: $x^2 = 9$",
          answer: "3,-3",
          hint: "Take the square root of both sides (don't forget ±).",
          detailedSolution: [
            { step: "$x^2 = 9$", explanation: "Simple quadratic equation" },
            { step: "$x = \\pm \\sqrt{9}$", explanation: "Take square root of both sides. The ± is crucial!" },
            { step: "$x = \\pm 3$", explanation: "Square root of 9 is 3" },
            { step: "$x = 3$ or $x = -3$", explanation: "Two solutions because both $3^2 = 9$ and $(-3)^2 = 9$" },
          ],
        },
        {
          id: "q5",
          question: "Find the discriminant of $x^2 - 6x + 9 = 0$ and describe the solutions",
          answer: "0",
          hint: "Calculate $b^2 - 4ac$. What does it tell you?",
          detailedSolution: [
            { step: "Identify: $a=1, b=-6, c=9$", explanation: "Coefficients from standard form" },
            { step: "$\\Delta = b^2 - 4ac = (-6)^2 - 4(1)(9)$", explanation: "Substitute into discriminant formula" },
            { step: "$\\Delta = 36 - 36 = 0$", explanation: "Calculate: $36 - 36 = 0$" },
            { step: "One repeated real solution", explanation: "When discriminant is 0, there is exactly one solution (repeated root)" },
          ],
        },
        {
          id: "q6",
          question: "Solve by completing the square: $x^2 + 4x - 5 = 0$",
          answer: "1,-5",
          hint: "Move constant to right side, then add $(\\frac{4}{2})^2$ to both sides.",
          detailedSolution: [
            { step: "$x^2 + 4x - 5 = 0$", explanation: "Original equation" },
            { step: "$x^2 + 4x = 5$", explanation: "Move constant to right side" },
            { step: "$x^2 + 4x + 4 = 5 + 4$", explanation: "Add $(\\frac{b}{2})^2 = (\\frac{4}{2})^2 = 4$ to both sides" },
            { step: "$(x + 2)^2 = 9$", explanation: "Left side is perfect square: $(x + 2)^2$" },
            { step: "$x + 2 = \\pm 3$", explanation: "Take square root: $\\sqrt{9} = 3$" },
            { step: "$x = -2 + 3 = 1$ or $x = -2 - 3 = -5$", explanation: "Solve: subtract 2 from both results" },
          ],
        },
      ],
    };

    const topicProblems = problems[topicId] || problems["9-quadratics"];
    return topicProblems[Math.floor(Math.random() * topicProblems.length)];
  }

  const checkAnswer = () => {
    const userAns = userAnswer.toLowerCase().replace(/\s/g, "");
    const correctAns = currentProblem.answer.toLowerCase().replace(/\s/g, "");

    setAttempts(attempts + 1);

    if (userAns === correctAns) {
      setIsCorrect(true);
      setCorrectCount(correctCount + 1);
      toast({
        title: "Correct!",
        description: "Excellent work! You got it right.",
      });

      // Save to mistakes tracking if there were attempts
      if (attempts > 0) {
        const mistakes = JSON.parse(localStorage.getItem("mathMistakes") || "[]");
        mistakes.push({
          problem: currentProblem.question,
          attempts: attempts + 1,
          date: new Date().toISOString(),
          topic: selectedTopic,
        });
        localStorage.setItem("mathMistakes", JSON.stringify(mistakes));
      }
    } else {
      setIsCorrect(false);
      toast({
        title: "Not quite right",
        description: "Try again or check the hint!",
        variant: "destructive",
      });
    }
  };

  const nextProblem = () => {
    setCurrentProblem(generateProblem(selectedTopic, difficulty));
    setUserAnswer("");
    setShowHint(false);
    setShowSolution(false);
    setIsCorrect(null);
    setAttempts(0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="flex flex-col gap-6">
          <Navigation />
          
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold">Practice Mode</h1>
              <p className="text-muted-foreground">
                Score: {correctCount}/{correctCount + (isCorrect === false ? 1 : 0)}
              </p>
            </div>
            <DifficultySelector value={difficulty} onChange={setDifficulty} />
          </div>

        <div className="space-y-6">
          <GradeTopicSelector
            selectedGrade={selectedGrade}
            selectedTopic={selectedTopic}
            onGradeChange={setSelectedGrade}
            onTopicChange={(topic) => {
              setSelectedTopic(topic);
              nextProblem();
            }}
          />

          <Card className="p-6">
            <div className="mb-6">
              <Badge variant="secondary" className="mb-4">
                Problem #{attempts + 1}
              </Badge>
              <div className="prose prose-lg dark:prose-invert">
                <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                  {currentProblem.question}
                </ReactMarkdown>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter your answer..."
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && checkAnswer()}
                  className="text-lg"
                  disabled={isCorrect === true}
                />
                <Button onClick={checkAnswer} disabled={isCorrect === true || !userAnswer}>
                  Check Answer
                </Button>
              </div>

              {isCorrect !== null && (
                <div
                  className={`flex items-center gap-2 p-3 rounded-lg ${
                    isCorrect ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"
                  }`}
                >
                  {isCorrect ? (
                    <>
                      <CheckCircle className="h-5 w-5" />
                      <span className="font-semibold">Correct! Well done.</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-5 w-5" />
                      <span className="font-semibold">Incorrect. Try again!</span>
                    </>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowHint(!showHint)} className="flex-1">
                  <Lightbulb className="h-4 w-4 mr-2" />
                  {showHint ? "Hide" : "Show"} Hint
                </Button>
                <Button variant="outline" onClick={() => setShowSolution(!showSolution)} className="flex-1">
                  {showSolution ? "Hide" : "Show"} Solution
                </Button>
              </div>

              {showHint && (
                <Card className="p-4 bg-primary/5 border-primary/20">
                  <div className="flex items-start gap-2">
                    <Lightbulb className="h-5 w-5 text-primary mt-1" />
                    <div>
                      <p className="font-semibold text-primary mb-1">Hint:</p>
                      <p className="text-sm">{currentProblem.hint}</p>
                    </div>
                  </div>
                </Card>
              )}

              {showSolution && (
                <Card className="p-4 bg-accent/5 border-accent">
                  <h3 className="font-semibold mb-4">Step-by-Step Solution:</h3>
                  <div className="space-y-4">
                    {currentProblem.detailedSolution.map((step, index) => (
                      <div key={index} className="border-l-2 border-primary pl-4">
                        <Badge variant="outline" className="mb-2">
                          Step {index + 1}
                        </Badge>
                        <div className="prose prose-sm dark:prose-invert mb-2">
                          <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                            {step.step}
                          </ReactMarkdown>
                        </div>
                        <p className="text-sm text-muted-foreground">{step.explanation}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {isCorrect && (
                <Button onClick={nextProblem} className="w-full" size="lg">
                  Next Problem
                </Button>
              )}
            </div>
          </Card>
        </div>
        </div>
      </div>
    </div>
  );
};

export default Practice;
