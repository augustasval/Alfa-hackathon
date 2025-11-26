import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronRight, Lightbulb, BookOpen, Camera, Eye, MessageCircle, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { toast } from "sonner";
import { useLearningPlan } from "@/hooks/useLearningPlan";
import { useTaskProgress } from "@/hooks/useTaskProgress";
import { SessionManager } from "@/lib/sessionManager";
import { mistakeStorage } from "@/lib/mistakeStorage";
import { Problem, WebhookStep, getDifficultyColor } from "@/types/exerciseTypes";
import { problemsByTopic, defaultProblems } from "@/data/exerciseProblems";
import {
  ProblemSelectionScreen,
  ExerciseCompletionScreen,
  ExerciseAIChatPanel,
  WebhookStepsDisplay,
  SolutionStepsDisplay,
} from "@/components/exercise";

const Exercise = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // View states
  const [showProblemSelection, setShowProblemSelection] = useState(true);
  const [selectedProblem, setSelectedProblem] = useState<Problem | null>(null);

  // Problem solving states
  const [showHint, setShowHint] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [visibleStepCount, setVisibleStepCount] = useState(0);

  // Upload states
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [webhookResponse, setWebhookResponse] = useState<string | null>(null);
  const [webhookSteps, setWebhookSteps] = useState<WebhookStep[] | null>(null);

  // Progress states
  const [completedCount, setCompletedCount] = useState(0);
  const [selectedIncorrectSteps, setSelectedIncorrectSteps] = useState<number[]>([]);
  const [isCompleting, setIsCompleting] = useState(false);

  // AI Chat states
  const [showAIChat, setShowAIChat] = useState(false);

  const { tasks, markTaskComplete } = useLearningPlan();
  const { incrementExercise } = useTaskProgress();

  // Get current task to determine topic
  const currentTask = tasks.find(t => {
    const taskDate = new Date(t.scheduled_date);
    const today = new Date();
    return taskDate.toDateString() === today.toDateString() && !t.is_completed;
  });

  // Determine which problem set to use based on task topic
  const getTopicId = () => {
    if (!currentTask) return '9-quadratics';
    const title = currentTask.title.toLowerCase();
    if (title.includes('polynomial')) return '9-polynomials';
    if (title.includes('linear')) return '9-linear';
    if (title.includes('trig')) return '9-trigonometry';
    return '9-quadratics';
  };

  const topicId = getTopicId();
  const problems = problemsByTopic[topicId] || defaultProblems;
  const isAllComplete = completedCount >= 4;

  const handleProblemSelect = (problem: Problem) => {
    setSelectedProblem(problem);
    setShowProblemSelection(false);
    setShowHint(false);
    setShowSolution(false);
    setVisibleStepCount(0);
    setWebhookResponse(null);
    setWebhookSteps(null);
    setUploadedFiles([]);
    setSelectedIncorrectSteps([]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const limitedFiles = Array.from(files).slice(0, 5);
      setUploadedFiles(limitedFiles);
    }
  };

  const handleUploadWork = async () => {
    if (uploadedFiles.length === 0) return;

    setIsUploading(true);
    setWebhookResponse(null);
    setWebhookSteps(null);

    try {
      const formData = new FormData();
      uploadedFiles.forEach((file) => {
        formData.append('files', file);
      });
      formData.append('imageCount', String(uploadedFiles.length));
      formData.append('timestamp', new Date().toISOString());
      formData.append('problem', selectedProblem?.question || '');

      const response = await fetch('https://oopsautomation.app.n8n.cloud/webhook/siunciammatke1', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const responseText = await response.text();
        try {
          const data = JSON.parse(responseText);

          if (data.steps && Array.isArray(data.steps)) {
            setWebhookSteps(data.steps);
            setWebhookResponse(null);
          } else {
            const message = data.message || data.response || data.text || data.output || responseText;
            setWebhookResponse(message);
            setWebhookSteps(null);
          }
        } catch {
          setWebhookResponse(responseText);
          setWebhookSteps(null);
        }
        toast.success("Work uploaded successfully!");
        setUploadedFiles([]);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        toast.error("Upload failed. Please try again.");
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error("Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSelfCheck = () => {
    setShowSolution(true);
    if (visibleStepCount === 0) {
      setVisibleStepCount(1);
    }
  };

  const showNextStep = () => {
    if (selectedProblem && visibleStepCount < selectedProblem.detailedSolution.length) {
      setVisibleStepCount(visibleStepCount + 1);
    }
  };

  const handleToggleIncorrectStep = (idx: number) => {
    if (selectedIncorrectSteps.includes(idx)) {
      setSelectedIncorrectSteps(selectedIncorrectSteps.filter(i => i !== idx));
    } else {
      setSelectedIncorrectSteps([...selectedIncorrectSteps, idx]);
    }
  };

  const goToNextQuestion = async () => {
    if (completedCount >= 4) return;

    // Save mistake if any steps were marked incorrect
    if (selectedIncorrectSteps.length > 0 && selectedProblem) {
      mistakeStorage.add({
        type: 'exercise',
        problem: selectedProblem.question,
        topic: currentTask?.title || topicId,
        incorrectSteps: selectedIncorrectSteps,
        stepDetails: selectedProblem.detailedSolution,
      });
    }

    const newCount = completedCount + 1;
    setCompletedCount(newCount);

    // Save progress to database
    const sessionId = SessionManager.getSession();
    if (sessionId && currentTask) {
      try {
        await incrementExercise(currentTask.id);

        if (newCount >= 4) {
          setIsCompleting(true);
          await markTaskComplete(currentTask.id);
          toast.success("Task completed! Great work!");
          return;
        }
      } catch (error) {
        console.error('Error saving exercise progress:', error);
      }
    }

    // Go back to problem selection
    setShowProblemSelection(true);
    setSelectedProblem(null);
    setShowHint(false);
    setShowSolution(false);
    setVisibleStepCount(0);
    setWebhookResponse(null);
    setWebhookSteps(null);
    setSelectedIncorrectSteps([]);
  };

  const getNextTask = () => {
    const incompleteTasks = tasks
      .filter(t => !t.is_completed)
      .sort((a, b) => a.day_number - b.day_number);
    return incompleteTasks[0] || null;
  };

  const handleKeepLearning = () => {
    const nextTask = getNextTask();
    if (nextTask) {
      localStorage.setItem('currentTaskId', nextTask.id);
      navigate('/learn');
    }
  };

  // Problem Selection Screen
  if (showProblemSelection && !isAllComplete && !isCompleting) {
    return (
      <ProblemSelectionScreen
        problems={problems}
        completedCount={completedCount}
        currentTaskTitle={currentTask?.title}
        onProblemSelect={handleProblemSelect}
      />
    );
  }

  // Completion Screen
  if (isCompleting || isAllComplete) {
    return (
      <ExerciseCompletionScreen
        completedCount={completedCount}
        hasNextTask={!!getNextTask()}
        onKeepLearning={handleKeepLearning}
      />
    );
  }

  // Problem Solving Screen
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <div className="flex">
        <div className="container mx-auto px-4 py-6 max-w-4xl flex-1">
          <div className="flex flex-col gap-6">
            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => setShowProblemSelection(true)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Problems
              </Button>
              <Button variant="outline" onClick={() => navigate('/learn?review=true')}>
                <BookOpen className="h-4 w-4 mr-2" />
                Review Theory
              </Button>
            </div>

            <Card className="p-6">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold">Solve the Problem</h2>
                  <Badge className={getDifficultyColor(selectedProblem?.difficulty || 'easy').badge}>
                    {selectedProblem?.difficulty}
                  </Badge>
                </div>
                <Badge variant="outline">Completed: {completedCount}/4</Badge>
              </div>

              {/* Problem Display */}
              <Card className="p-6 bg-accent/5 border-accent mb-6">
                <div className="prose prose-lg max-w-none dark:prose-invert">
                  <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                    {selectedProblem?.question || ''}
                  </ReactMarkdown>
                </div>
              </Card>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />

              {/* Top Action Buttons - Self-Check & Upload Work */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <Button
                  variant={showSolution ? "default" : "outline"}
                  className="h-16 flex-col gap-1"
                  onClick={handleSelfCheck}
                >
                  <Eye className="h-5 w-5" />
                  <span className="text-sm">Self-Check</span>
                </Button>
                <Button
                  variant={uploadedFiles.length > 0 ? "default" : "outline"}
                  className="h-16 flex-col gap-1"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Camera className="h-5 w-5" />
                  <span className="text-sm">Upload Work</span>
                </Button>
              </div>

              {/* Bottom Action Buttons - Hint & Chat with AI */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <Button
                  variant={showHint ? "default" : "outline"}
                  className="h-12 gap-2"
                  onClick={() => setShowHint(!showHint)}
                >
                  <Lightbulb className="h-4 w-4" />
                  <span className="text-sm">{showHint ? "Hide Hint" : "Hint"}</span>
                </Button>
                <Button
                  variant={showAIChat ? "default" : "outline"}
                  className="h-12 gap-2"
                  onClick={() => setShowAIChat(!showAIChat)}
                >
                  <MessageCircle className="h-4 w-4" />
                  <span className="text-sm">Chat with AI</span>
                </Button>
              </div>

              {/* Upload Preview & Submit */}
              {uploadedFiles.length > 0 && (
                <Card className="p-4 bg-accent/5 mb-6">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Selected: {uploadedFiles.map(f => f.name).join(', ')}
                    </p>
                    <Button
                      size="sm"
                      onClick={handleUploadWork}
                      disabled={isUploading}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {isUploading ? 'Uploading...' : 'Submit'}
                    </Button>
                  </div>
                </Card>
              )}

              {/* Solution Steps from Webhook */}
              {webhookSteps && webhookSteps.length > 0 && (
                <WebhookStepsDisplay
                  steps={webhookSteps}
                  onStepsChange={setWebhookSteps}
                  onDismiss={() => setWebhookSteps(null)}
                  problemQuestion={selectedProblem?.question}
                />
              )}

              {/* Fallback Webhook Response (for non-steps responses) */}
              {webhookResponse && (
                <Card className="p-4 bg-blue-500/10 border-blue-500/30 mb-6">
                  <p className="text-sm font-semibold text-blue-400 mb-2">AI Feedback:</p>
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                      {webhookResponse}
                    </ReactMarkdown>
                  </div>
                </Card>
              )}

              {/* Hint */}
              {showHint && (
                <Card className="p-4 bg-yellow-500/10 border-yellow-500/30 mb-4">
                  <p className="text-sm font-semibold text-yellow-400 mb-2">💡 Hint:</p>
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                      {selectedProblem?.hint || ''}
                    </ReactMarkdown>
                  </div>
                </Card>
              )}

              {/* Solution - Progressive Step Reveal */}
              {showSolution && selectedProblem && (
                <SolutionStepsDisplay
                  problem={selectedProblem}
                  visibleStepCount={visibleStepCount}
                  selectedIncorrectSteps={selectedIncorrectSteps}
                  onToggleIncorrectStep={handleToggleIncorrectStep}
                  onShowNextStep={showNextStep}
                  onGoToNextQuestion={goToNextQuestion}
                />
              )}
            </Card>
          </div>
        </div>
      </div>

      {/* AI Chat Side Panel */}
      <ExerciseAIChatPanel
        selectedProblem={selectedProblem}
        topic={currentTask?.title || topicId}
        onClose={() => setShowAIChat(false)}
        isOpen={showAIChat}
      />
    </div>
  );
};

export default Exercise;
