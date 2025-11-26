import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, BookOpen, Camera, Upload, Loader2, X, Edit2, Check, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import katex from "katex";
import "katex/dist/katex.min.css";
import { toast } from "sonner";
import { Problem, getDifficultyColor } from "@/types/exerciseTypes";

interface ExtractedStep {
  id: number;
  latex: string;
  raw: string;
}

interface ProblemSelectionScreenProps {
  problems: Problem[];
  completedCount: number;
  currentTaskTitle?: string;
  onProblemSelect: (problem: Problem) => void;
}

export const ProblemSelectionScreen = ({
  problems,
  completedCount,
  currentTaskTitle,
  onProblemSelect,
}: ProblemSelectionScreenProps) => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [extractedSteps, setExtractedSteps] = useState<ExtractedStep[]>([]);
  const [webhookResponse, setWebhookResponse] = useState<string | null>(null);
  const [editingStepId, setEditingStepId] = useState<number | null>(null);
  const [editingLatex, setEditingLatex] = useState<string>("");
  const [confirmedProblems, setConfirmedProblems] = useState<Problem[]>([]);

  const easyProblems = problems.filter(p => p.difficulty === 'easy');
  const mediumProblems = problems.filter(p => p.difficulty === 'medium');
  const hardProblems = problems.filter(p => p.difficulty === 'hard');

  // Get an example exercise from the problems list
  const getExampleExercise = () => {
    if (easyProblems.length > 0) return easyProblems[0].question;
    if (mediumProblems.length > 0) return mediumProblems[0].question;
    if (hardProblems.length > 0) return hardProblems[0].question;
    return "";
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setWebhookResponse(null);
    }
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setExtractedSteps([]);
    setWebhookResponse(null);
    setEditingStepId(null);
    setEditingLatex("");
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Edit step handlers
  const handleStartEdit = (step: ExtractedStep) => {
    setEditingStepId(step.id);
    setEditingLatex(step.latex);
  };

  const handleSaveEdit = () => {
    if (editingStepId !== null) {
      setExtractedSteps(prev =>
        prev.map(step =>
          step.id === editingStepId
            ? { ...step, latex: editingLatex }
            : step
        )
      );
      setEditingStepId(null);
      setEditingLatex("");
    }
  };

  const handleCancelEdit = () => {
    setEditingStepId(null);
    setEditingLatex("");
  };

  const handleDeleteStep = (stepId: number) => {
    setExtractedSteps(prev => prev.filter(step => step.id !== stepId));
  };

  // Confirm and add extracted problems to the list
  const handleConfirmProblems = () => {
    const newProblems: Problem[] = extractedSteps.map((step, index) => ({
      id: `uploaded-${Date.now()}-${index}`,
      question: `$${step.latex}$`,
      answer: "",
      hint: "This is a problem you uploaded. Try your best!",
      difficulty: "medium" as const,
      detailedSolution: [
        {
          step: "Solve the problem step by step",
          explanation: "Work through this problem carefully"
        }
      ]
    }));

    setConfirmedProblems(prev => [...prev, ...newProblems]);
    setExtractedSteps([]);
    setUploadedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    toast.success(`Added ${newProblems.length} problem(s) to your list!`);
  };

  const handleUploadProblem = async () => {
    if (!uploadedFile) return;

    setIsUploading(true);
    setExtractedSteps([]);
    setWebhookResponse(null);

    try {
      const formData = new FormData();
      formData.append('file', uploadedFile);
      formData.append('topic', currentTaskTitle || 'Practice');
      formData.append('exampleExercise', getExampleExercise());
      formData.append('timestamp', new Date().toISOString());

      const response = await fetch('https://oopsautomation.app.n8n.cloud/webhook/exerciseproblem3', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const responseText = await response.text();
        try {
          // Parse the response - it comes as an array with output containing JSON string
          const data = JSON.parse(responseText);

          // Handle array format: [{ "output": "{ \"steps\": [...] }" }]
          if (Array.isArray(data) && data.length > 0 && data[0].output) {
            const outputData = JSON.parse(data[0].output);
            if (outputData.steps && Array.isArray(outputData.steps)) {
              setExtractedSteps(outputData.steps);
              toast.success(`Found ${outputData.steps.length} exercise(s)!`);
              return;
            }
          }

          // Handle direct format: { "steps": [...] }
          if (data.steps && Array.isArray(data.steps)) {
            setExtractedSteps(data.steps);
            toast.success(`Found ${data.steps.length} exercise(s)!`);
            return;
          }

          // Handle output as direct JSON string
          if (data.output) {
            try {
              const outputData = JSON.parse(data.output);
              if (outputData.steps && Array.isArray(outputData.steps)) {
                setExtractedSteps(outputData.steps);
                toast.success(`Found ${outputData.steps.length} exercise(s)!`);
                return;
              }
            } catch {
              // output is not JSON, treat as message
            }
          }

          // Fallback to showing as message
          const message = data.message || data.response || data.text || data.output || responseText;
          setWebhookResponse(message);
          toast.success("Problem uploaded successfully!");
        } catch {
          setWebhookResponse(responseText);
          toast.success("Problem uploaded successfully!");
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="flex flex-col gap-6">
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
            <Button variant="outline" onClick={() => navigate('/learn?review=true')}>
              <BookOpen className="h-4 w-4 mr-2" />
              Back to Theory
            </Button>
          </div>

          <Card className="p-6">
            <div className="mb-6">
              <h2 className="text-3xl font-bold mb-2">Choose a Problem</h2>
              <p className="text-muted-foreground">
                Select a problem based on difficulty level
              </p>
              <div className="flex items-center gap-2 mt-4">
                <Badge variant="outline">
                  Completed: {completedCount}/4
                </Badge>
                <Badge variant="secondary">
                  {currentTaskTitle || 'Practice'}
                </Badge>
              </div>
            </div>

            {/* Upload Your Own Problem Section */}
            <div className="mb-6">
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />

              {!uploadedFile ? (
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-12 border-dashed hover:border-primary/50 transition-all gap-2"
                >
                  <Camera className="h-4 w-4" />
                  <span className="text-sm">Upload your own problem</span>
                </Button>
              ) : (
                <Card className="p-4 border-primary/30 bg-primary/5">
                  <div className="flex items-start gap-3">
                    {/* Preview */}
                    <div className="relative w-24 h-24 flex-shrink-0">
                      <img
                        src={previewUrl || ''}
                        alt="Problem preview"
                        className="w-full h-full object-cover rounded-lg border"
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 h-6 w-6"
                        onClick={handleRemoveFile}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>

                    <div className="flex-1 space-y-2">
                      <p className="text-sm font-medium truncate">{uploadedFile.name}</p>
                      <Button
                        onClick={handleUploadProblem}
                        disabled={isUploading}
                        size="sm"
                        className="w-full"
                      >
                        {isUploading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Analyzing...
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-2" />
                            Extract Problems
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </Card>
              )}

              {/* Extracted Exercises */}
              {extractedSteps.length > 0 && (
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-green-400">
                      Extracted {extractedSteps.length} Exercise{extractedSteps.length > 1 ? 's' : ''}:
                    </p>
                    <p className="text-xs text-muted-foreground">Click edit to fix any errors</p>
                  </div>
                  {extractedSteps.map((step) => (
                    <Card
                      key={step.id}
                      className={`p-4 ${editingStepId === step.id ? 'bg-primary/10 border-primary/50' : 'bg-green-500/10 border-green-500/30'}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 font-bold text-sm flex-shrink-0">
                          {step.id}
                        </div>
                        <div className="flex-1">
                          {editingStepId === step.id ? (
                            <div className="space-y-3">
                              <Input
                                value={editingLatex}
                                onChange={(e) => setEditingLatex(e.target.value)}
                                className="font-mono text-sm"
                                placeholder="Enter LaTeX..."
                                autoFocus
                              />
                              <Card className="p-3 bg-muted/50">
                                <p className="text-xs text-muted-foreground mb-2">Preview:</p>
                                <div
                                  className="text-lg"
                                  dangerouslySetInnerHTML={{
                                    __html: katex.renderToString(editingLatex || ' ', {
                                      displayMode: true,
                                      throwOnError: false
                                    })
                                  }}
                                />
                              </Card>
                              <div className="flex gap-2">
                                <Button size="sm" onClick={handleSaveEdit}>
                                  <Check className="h-4 w-4 mr-1" />
                                  Save
                                </Button>
                                <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div
                                className="text-lg"
                                dangerouslySetInnerHTML={{
                                  __html: katex.renderToString(step.latex, {
                                    displayMode: true,
                                    throwOnError: false
                                  })
                                }}
                              />
                              {step.raw && (
                                <p className="text-xs text-muted-foreground mt-2 font-mono">
                                  {step.raw}
                                </p>
                              )}
                              <div className="flex gap-2 mt-3">
                                <Button size="sm" variant="outline" onClick={() => handleStartEdit(step)}>
                                  <Edit2 className="h-3 w-3 mr-1" />
                                  Edit
                                </Button>
                                <Button size="sm" variant="destructive" onClick={() => handleDeleteStep(step.id)}>
                                  <X className="h-3 w-3 mr-1" />
                                  Remove
                                </Button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}

                  {/* Confirm button */}
                  <Button
                    onClick={handleConfirmProblems}
                    className="w-full"
                    size="lg"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add {extractedSteps.length} Problem{extractedSteps.length > 1 ? 's' : ''} to My List
                  </Button>
                </div>
              )}

              {/* Fallback Webhook Response */}
              {webhookResponse && extractedSteps.length === 0 && (
                <Card className="mt-4 p-4 bg-blue-500/10 border-blue-500/30">
                  <p className="text-sm font-semibold text-blue-400 mb-2">AI Response:</p>
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                      {webhookResponse}
                    </ReactMarkdown>
                  </div>
                </Card>
              )}
            </div>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or choose from below</span>
              </div>
            </div>

            {/* Uploaded Problems */}
            {confirmedProblems.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/50">
                    <Upload className="h-3 w-3 mr-1" />
                    Your Uploads
                  </Badge>
                </div>
                <div className="space-y-2">
                  {confirmedProblems.map((problem) => (
                    <Card
                      key={problem.id}
                      className="p-4 cursor-pointer transition-all hover:scale-[1.01] hover:bg-purple-500/10 hover:border-purple-500/30 border-2 border-transparent"
                      onClick={() => onProblemSelect(problem)}
                    >
                      <div className="prose prose-sm max-w-none dark:prose-invert">
                        <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                          {problem.question}
                        </ReactMarkdown>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Easy Problems */}
            {easyProblems.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Badge className={getDifficultyColor('easy').badge}>Easy</Badge>
                </div>
                <div className="space-y-2">
                  {easyProblems.map((problem) => (
                    <Card
                      key={problem.id}
                      className={`p-4 cursor-pointer transition-all hover:scale-[1.01] hover:${getDifficultyColor('easy').bg} hover:${getDifficultyColor('easy').border} border-2 border-transparent`}
                      onClick={() => onProblemSelect(problem)}
                    >
                      <div className="prose prose-sm max-w-none dark:prose-invert">
                        <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                          {problem.question}
                        </ReactMarkdown>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Medium Problems */}
            {mediumProblems.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Badge className={getDifficultyColor('medium').badge}>Medium</Badge>
                </div>
                <div className="space-y-2">
                  {mediumProblems.map((problem) => (
                    <Card
                      key={problem.id}
                      className={`p-4 cursor-pointer transition-all hover:scale-[1.01] hover:${getDifficultyColor('medium').bg} hover:${getDifficultyColor('medium').border} border-2 border-transparent`}
                      onClick={() => onProblemSelect(problem)}
                    >
                      <div className="prose prose-sm max-w-none dark:prose-invert">
                        <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                          {problem.question}
                        </ReactMarkdown>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Hard Problems */}
            {hardProblems.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Badge className={getDifficultyColor('hard').badge}>Hard</Badge>
                </div>
                <div className="space-y-2">
                  {hardProblems.map((problem) => (
                    <Card
                      key={problem.id}
                      className={`p-4 cursor-pointer transition-all hover:scale-[1.01] hover:${getDifficultyColor('hard').bg} hover:${getDifficultyColor('hard').border} border-2 border-transparent`}
                      onClick={() => onProblemSelect(problem)}
                    >
                      <div className="prose prose-sm max-w-none dark:prose-invert">
                        <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                          {problem.question}
                        </ReactMarkdown>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};
