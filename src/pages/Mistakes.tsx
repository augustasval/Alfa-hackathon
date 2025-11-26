import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, TrendingUp, Target, XCircle, ArrowLeft, BarChart3, Calendar, Lightbulb, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { mistakeStorage, MistakeRecord } from "@/lib/mistakeStorage";

const Mistakes = () => {
  const navigate = useNavigate();
  const [mistakes, setMistakes] = useState<MistakeRecord[]>([]);
  const [topicStats, setTopicStats] = useState<Record<string, number>>({});

  const loadMistakes = () => {
    const loadedMistakes = mistakeStorage.getAll();
    setMistakes(loadedMistakes);

    // Calculate topic statistics
    const stats: Record<string, number> = {};
    loadedMistakes.forEach((mistake) => {
      stats[mistake.topic] = (stats[mistake.topic] || 0) + 1;
    });
    setTopicStats(stats);
  };

  useEffect(() => {
    loadMistakes();
  }, []);

  const handleDeleteMistake = (id: string) => {
    mistakeStorage.delete(id);
    loadMistakes();
  };

  // Calculate enhanced statistics
  const thisWeekMistakes = mistakeStorage.getFromLastDays(7).length;
  const improvementRate = mistakeStorage.getImprovementRate();
  const daysSinceLastMistake = mistakeStorage.getDaysSinceLastMistake();
  const patterns = mistakeStorage.analyzeExercisePatterns();
  const chartData = mistakeStorage.getDailyMistakeCounts(14);
  
  const mostChallengingTopic = Object.entries(topicStats).sort((a, b) => b[1] - a[1])[0];
  const mostCommonErrorType = patterns.commonStepKeywords[0]?.keyword || "None detected";
  
  const quizMistakes = mistakes.filter(m => m.type === 'quiz');
  const exerciseMistakes = mistakes.filter(m => m.type === 'exercise');
  const practiceMistakes = mistakes.filter(m => m.type === 'practice');

  // Generate recommendations
  const recommendations = [];
  if (patterns.commonStepKeywords.length > 0) {
    const topPattern = patterns.commonStepKeywords[0];
    recommendations.push({
      text: `Focus on ${topPattern.keyword} techniques - you've struggled with this ${topPattern.count} times`,
      icon: Target,
    });
  }
  if (mostChallengingTopic) {
    recommendations.push({
      text: `Practice more ${mostChallengingTopic[0]} problems - this is your most challenging area`,
      icon: TrendingUp,
    });
  }
  if (improvementRate.percentChange > 0) {
    recommendations.push({
      text: `Great progress! You've reduced mistakes by ${improvementRate.percentChange.toFixed(0)}% this week`,
      icon: TrendingDown,
    });
  }
  if (daysSinceLastMistake >= 3) {
    recommendations.push({
      text: `${daysSinceLastMistake} days mistake-free! Keep up the excellent work!`,
      icon: Target,
    });
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-4xl font-bold text-center">CorePus</h1>
            <div className="w-[88px]" />
          </div>

          <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">Total Mistakes</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{mistakes.length}</div>
                <p className="text-xs text-muted-foreground mt-1">All time</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">This Week</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{thisWeekMistakes}</div>
                <p className="text-xs text-muted-foreground mt-1">Last 7 days</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">Improvement</CardTitle>
                  <TrendingDown className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {improvementRate.percentChange > 0 ? '+' : ''}{improvementRate.percentChange.toFixed(0)}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">vs last week</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">Common Error</CardTitle>
                  <AlertCircle className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold capitalize">{mostCommonErrorType}</div>
                <p className="text-xs text-muted-foreground mt-1">Pattern detected</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">Focus Area</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {mostChallengingTopic ? mostChallengingTopic[0] : "None"}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Needs practice</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">Streak</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{daysSinceLastMistake}</div>
                <p className="text-xs text-muted-foreground mt-1">Days mistake-free</p>
              </CardContent>
            </Card>
          </div>

          {patterns.commonStepKeywords.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Patterns Detected
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {patterns.commonStepKeywords.map((pattern, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <Badge variant="destructive" className="mt-0.5">
                      {pattern.count}
                    </Badge>
                    <div>
                      <p className="font-medium capitalize">{pattern.keyword} Steps</p>
                      <p className="text-sm text-muted-foreground">
                        {((pattern.count / exerciseMistakes.length) * 100).toFixed(0)}% of exercise mistakes
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {chartData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Progress Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    quiz: {
                      label: "Quiz",
                      color: "hsl(var(--destructive))",
                    },
                    exercise: {
                      label: "Exercise",
                      color: "hsl(var(--primary))",
                    },
                    practice: {
                      label: "Practice",
                      color: "hsl(var(--secondary))",
                    },
                  }}
                  className="h-[200px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis
                        dataKey="date"
                        tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        className="text-xs"
                      />
                      <YAxis className="text-xs" />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line type="monotone" dataKey="quiz" stroke="var(--color-quiz)" strokeWidth={2} />
                      <Line type="monotone" dataKey="exercise" stroke="var(--color-exercise)" strokeWidth={2} />
                      <Line type="monotone" dataKey="practice" stroke="var(--color-practice)" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          )}

          {Object.keys(topicStats).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Mistakes by Topic
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(topicStats)
                  .sort((a, b) => b[1] - a[1])
                  .map(([topic, count]) => (
                    <div key={topic} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{topic}</span>
                        <span className="text-muted-foreground">
                          {count} mistakes ({((count / mistakes.length) * 100).toFixed(0)}%)
                        </span>
                      </div>
                      <Progress value={(count / mistakes.length) * 100} className="h-2" />
                    </div>
                  ))}
              </CardContent>
            </Card>
          )}

          {recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Lightbulb className="h-5 w-5" />
                  Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {recommendations.map((rec, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <rec.icon className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <p className="text-sm">{rec.text}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <Card className="p-6">
            {mistakes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No mistakes tracked yet!</p>
                <p className="text-sm">Keep practicing and you'll see your progress here.</p>
              </div>
            ) : (
              <Tabs defaultValue="all" className="w-full">
...
              </Tabs>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

const MistakeCard = ({ mistake, onDelete }: { mistake: MistakeRecord; onDelete: (id: string) => void }) => {
  const getBadgeVariant = (type: MistakeRecord['type']) => {
    switch (type) {
      case 'quiz': return 'destructive';
      case 'exercise': return 'default';
      case 'practice': return 'secondary';
    }
  };

  const getTimeAgo = (date: string) => {
    const now = new Date();
    const mistakeDate = new Date(date);
    const diffDays = Math.floor((now.getTime() - mistakeDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return mistakeDate.toLocaleDateString();
  };

  return (
    <Card className="p-4 bg-accent/5 border-accent">
      <div className="flex justify-between items-start mb-3">
        <div className="flex gap-2 flex-wrap">
          <Badge variant={getBadgeVariant(mistake.type)}>{mistake.type}</Badge>
          <Badge variant="outline">{mistake.topic}</Badge>
          <Badge variant="secondary" className="text-xs">{getTimeAgo(mistake.date)}</Badge>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0"
          onClick={() => onDelete(mistake.id)}
        >
          <XCircle className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="prose prose-sm dark:prose-invert mb-3">
        <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
          {mistake.problem}
        </ReactMarkdown>
      </div>

      {mistake.type === 'quiz' && (
        <div className="space-y-2 mt-3">
          <div className="p-2 bg-destructive/10 border border-destructive/20 rounded">
            <p className="text-sm">
              <span className="font-medium">Your answer:</span>{' '}
              <span className="text-destructive">{mistake.userAnswer}</span>
            </p>
          </div>
          <div className="p-2 bg-green-500/10 border border-green-500/20 rounded">
            <p className="text-sm">
              <span className="font-medium">Correct answer:</span>{' '}
              <span className="text-green-600 dark:text-green-500">{mistake.correctAnswer}</span>
            </p>
          </div>
        </div>
      )}

      {mistake.type === 'exercise' && mistake.stepDetails && mistake.stepDetails.length > 0 && (
        <div className="mt-3 space-y-2">
          <p className="text-sm font-medium">Steps where you struggled:</p>
          <div className="space-y-2">
            {mistake.stepDetails.map((detail, idx) => {
              const stepNum = mistake.incorrectSteps?.[idx] ?? idx;
              return (
                <div key={idx} className="p-2 bg-muted rounded text-sm">
                  <p className="font-medium text-destructive mb-1">Step {stepNum + 1}</p>
                  <div className="prose prose-sm dark:prose-invert mb-1">
                    <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                      {detail.step}
                    </ReactMarkdown>
                  </div>
                  <p className="text-xs text-muted-foreground italic">{detail.explanation}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {mistake.type === 'practice' && mistake.attempts && (
        <div className="mt-3 flex items-center gap-2">
          <Badge variant="outline">{mistake.attempts} attempts</Badge>
          <span className="text-xs text-muted-foreground">before solving correctly</span>
        </div>
      )}
    </Card>
  );
};

export default Mistakes;
