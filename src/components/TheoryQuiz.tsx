import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CheckCircle2, XCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { mistakeStorage } from "@/lib/mistakeStorage";
import { useLearningPlan } from "@/hooks/useLearningPlan";

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

interface TheoryQuizProps {
  questions: QuizQuestion[];
  onComplete: (score: number) => void;
  onReadTheory: () => void;
  onRetry: () => void;
}

export const TheoryQuiz = ({ questions, onComplete, onReadTheory, onRetry }: TheoryQuizProps) => {
  const navigate = useNavigate();
  const { tasks } = useLearningPlan();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [userAnswers, setUserAnswers] = useState<(number | null)[]>(Array(questions.length).fill(null));
  const [showResults, setShowResults] = useState(false);

  const handleNextQuestion = () => {
    if (selectedAnswer === null) return;
    
    // Save the answer
    const newAnswers = [...userAnswers];
    newAnswers[currentQuestion] = selectedAnswer;
    setUserAnswers(newAnswers);

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      // Always start with no selection on a new question
      setSelectedAnswer(null);
    } else {
      // Quiz complete - show results
      const finalScore = newAnswers.reduce((score, answer, index) => {
        return score + (answer === questions[index].correctAnswer ? 1 : 0);
      }, 0);
      
      // Save incorrect answers as mistakes
      const currentTask = tasks.find(t => {
        const taskDate = new Date(t.scheduled_date);
        const today = new Date();
        return taskDate.toDateString() === today.toDateString() && !t.is_completed;
      });
      
      const topic = currentTask?.title || 'Quiz';
      
      newAnswers.forEach((answer, index) => {
        if (answer !== questions[index].correctAnswer) {
          mistakeStorage.add({
            type: 'quiz',
            problem: questions[index].question,
            topic,
            userAnswer: answer !== null ? questions[index].options[answer] : 'No answer',
            correctAnswer: questions[index].options[questions[index].correctAnswer],
          });
        }
      });
      
      setShowResults(true);
      onComplete(finalScore);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      setSelectedAnswer(userAnswers[currentQuestion - 1]);
    }
  };

  if (showResults) {
    const score = userAnswers.reduce((total, answer, index) => {
      return total + (answer === questions[index].correctAnswer ? 1 : 0);
    }, 0);
    const mistakes = questions.length - score;
    const showPracticeButton = mistakes <= 2;

    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            Quiz Results
            <span className="text-base text-muted-foreground font-normal">
              {score}/{questions.length}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex gap-3 justify-center flex-wrap">
            <Button 
              variant="outline" 
              onClick={onReadTheory} 
              size="sm"
              className="rounded-full hover:scale-105 transition-transform"
            >
              Read Theory Again
            </Button>
            <Button 
              onClick={onRetry}
              size="sm"
              className="rounded-full hover:scale-105 transition-transform"
            >
              Retry Quiz
            </Button>
            {showPracticeButton && (
              <Button 
                onClick={() => navigate("/exercice")}
                size="sm"
                className="rounded-full hover:scale-105 transition-transform bg-primary"
              >
                Start Exercise
              </Button>
            )}
          </div>

          <div className="space-y-6">
            {questions.map((q, index) => {
              const userAnswer = userAnswers[index];
              const isCorrect = userAnswer === q.correctAnswer;

              return (
                <Card key={index} className={`p-4 ${isCorrect ? 'border-green-500/50' : 'border-destructive/50'}`}>
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      {isCorrect ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600 mt-1 flex-shrink-0" />
                      ) : (
                        <XCircle className="h-5 w-5 text-destructive mt-1 flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <p className="font-medium mb-2">Question {index + 1}:</p>
                        <div className="prose prose-sm dark:prose-invert mb-3">
                          <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                            {q.question}
                          </ReactMarkdown>
                        </div>
                      </div>
                    </div>

                    <div className="ml-7 space-y-2">
                      <div className="text-sm">
                        <span className="font-medium">Your answer: </span>
                        <span className={!isCorrect ? 'text-destructive' : ''}>
                          {userAnswer !== null ? q.options[userAnswer] : 'Not answered'}
                        </span>
                      </div>
                      {!isCorrect && (
                        <div className="text-sm">
                          <span className="font-medium text-green-600">Correct answer: </span>
                          <span>{q.options[q.correctAnswer]}</span>
                        </div>
                      )}
                      <div className="p-3 bg-muted rounded-lg text-sm">
                        <p className="font-medium mb-1">Explanation:</p>
                        <div className="prose prose-sm dark:prose-invert">
                          <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                            {q.explanation}
                          </ReactMarkdown>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentQ = questions[currentQuestion];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Theory Quiz</span>
          <span className="text-sm text-muted-foreground">
            Question {currentQuestion + 1} of {questions.length}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-lg font-medium prose dark:prose-invert">
          <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
            {currentQ.question}
          </ReactMarkdown>
        </div>
        
        <RadioGroup
          key={currentQuestion}
          value={selectedAnswer !== null ? selectedAnswer.toString() : undefined}
          onValueChange={(value) => setSelectedAnswer(parseInt(value))}
        >
          {currentQ.options.map((option, index) => (
            <div key={`q${currentQuestion}-opt${index}`} className="flex items-center space-x-2">
              <RadioGroupItem value={index.toString()} id={`q${currentQuestion}-option-${index}`} />
              <Label htmlFor={`q${currentQuestion}-option-${index}`} className="flex-1 cursor-pointer">
                <div className="prose prose-sm dark:prose-invert">
                  <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                    {option}
                  </ReactMarkdown>
                </div>
              </Label>
            </div>
          ))}
        </RadioGroup>

        <div className="flex justify-between items-center pt-4">
          <Button
            variant="outline"
            onClick={handlePreviousQuestion}
            disabled={currentQuestion === 0}
          >
            Previous
          </Button>
          <Button
            onClick={handleNextQuestion}
            disabled={selectedAnswer === null}
          >
            {currentQuestion < questions.length - 1 ? "Next Question" : "Submit Quiz"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
