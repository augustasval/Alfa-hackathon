import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OnboardingModal } from "@/components/OnboardingModal";
import { useLearningPlan } from "@/hooks/useLearningPlan";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  CheckCircle2, Circle, Calendar, BookOpen, Target, Loader2, AlertCircle,
  User, Mail, GraduationCap, Copy, Check, RefreshCw, Clock, BarChart3, TrendingUp,
  TrendingDown, Lightbulb, XCircle, LogOut, ChevronDown, ChevronRight, CreditCard
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { format, differenceInDays, parseISO, isToday, isPast, differenceInHours } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { SessionManager } from "@/lib/sessionManager";
import { toast } from "sonner";
import { mistakeStorage, MistakeRecord } from "@/lib/mistakeStorage";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

const Home = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { profile, signOut } = useAuth();
  const { plan, tasks, loading, markTaskComplete, refetch } = useLearningPlan();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");

  // Profile state
  const [copied, setCopied] = useState(false);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Mistakes state
  const [mistakes, setMistakes] = useState<MistakeRecord[]>([]);
  const [topicStats, setTopicStats] = useState<Record<string, number>>({});

  useEffect(() => {
    // Show onboarding if no plan exists
    if (!loading && !plan) {
      setShowOnboarding(true);
    }
  }, [loading, plan]);

  // Handle info messages from redirects (e.g., already_registered)
  useEffect(() => {
    const info = searchParams.get('info');
    if (info === 'already_registered') {
      toast.info('You already have an account! You have been signed in.');
      // Remove the query param to avoid showing the toast again on refresh
      searchParams.delete('info');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    if (profile) {
      fetchFreshInviteCode();
    }
  }, [profile]);

  useEffect(() => {
    loadMistakes();
  }, []);

  // Profile functions
  async function fetchFreshInviteCode() {
    if (!profile?.id) return;

    try {
      const { data, error } = await supabase
        .rpc('get_fresh_invite_code', { user_id: profile.id });

      if (error) throw error;

      if (data && data.length > 0) {
        setInviteCode(data[0].invite_code);
        setExpiresAt(data[0].expires_at);
      }
    } catch (error) {
      console.error('Error fetching invite code:', error);
      setInviteCode(profile.invite_code);
      setExpiresAt(profile.invite_code_expires_at);
    }
  }

  async function handleRefreshCode() {
    if (!profile?.id) return;

    setRefreshing(true);
    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ invite_code_expires_at: new Date(0).toISOString() })
        .eq('id', profile.id);

      if (updateError) throw updateError;

      await fetchFreshInviteCode();
      toast.success('Invite code refreshed!');
    } catch (error) {
      console.error('Error refreshing invite code:', error);
      toast.error('Failed to refresh invite code');
    } finally {
      setRefreshing(false);
    }
  }

  function copyToClipboard() {
    if (!inviteCode) return;

    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    toast.success('Invite code copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  }

  function getTimeUntilExpiration() {
    if (!expiresAt) return null;

    const expDate = parseISO(expiresAt);
    const now = new Date();
    const daysLeft = differenceInDays(expDate, now);
    const hoursLeft = differenceInHours(expDate, now) % 24;

    if (daysLeft > 0) {
      return `${daysLeft} day${daysLeft !== 1 ? 's' : ''} ${hoursLeft}h`;
    } else if (hoursLeft > 0) {
      return `${hoursLeft} hour${hoursLeft !== 1 ? 's' : ''}`;
    } else {
      return 'Expiring soon';
    }
  }

  // Mistakes functions
  const loadMistakes = () => {
    const loadedMistakes = mistakeStorage.getAll();
    setMistakes(loadedMistakes);

    const stats: Record<string, number> = {};
    loadedMistakes.forEach((mistake) => {
      stats[mistake.topic] = (stats[mistake.topic] || 0) + 1;
    });
    setTopicStats(stats);
  };

  const handleDeleteMistake = (id: string) => {
    mistakeStorage.delete(id);
    loadMistakes();
  };

  const handleOnboardingComplete = async () => {
    setShowOnboarding(false);
    await new Promise(resolve => setTimeout(resolve, 2000));
    await refetch();
  };

  async function handleSignOut() {
    await signOut();
    navigate('/');
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!plan || showOnboarding) {
    return (
      <OnboardingModal
        open={showOnboarding || !plan}
        onComplete={handleOnboardingComplete}
        existingPlan={plan ? {
          grade: plan.grade,
          topicId: plan.topic_id,
          topicName: plan.topic_name
        } : null}
        onClose={() => setShowOnboarding(false)}
      />
    );
  }

  // Calculate progress
  const completedTasks = tasks.filter(t => t.is_completed);
  const progressPercentage = tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 0;

  // Categorize tasks
  const today = new Date();
  const todayTasks = tasks.filter(t => isToday(parseISO(t.scheduled_date)) && !t.is_completed);
  const pastTasks = tasks.filter(t => isPast(parseISO(t.scheduled_date)) && !isToday(parseISO(t.scheduled_date)));
  const upcomingTasks = tasks.filter(t => !isPast(parseISO(t.scheduled_date)) && !isToday(parseISO(t.scheduled_date)));

  // Days until exam
  const daysUntilExam = differenceInDays(parseISO(plan.test_date), today);

  const navigateToTask = async (task: any) => {
    try {
      const sessionId = SessionManager.getSession();
      if (!sessionId) return;

      const { data: progressData } = await supabase
        .from('task_progress')
        .select('*')
        .eq('task_id', task.id)
        .eq('session_id', sessionId)
        .maybeSingle();

      if (!progressData || !progressData.quiz_passed) {
        navigate('/learn');
      } else if (progressData.exercises_completed < 4) {
        navigate('/exercice');
      } else {
        toast.info("This task is already completed!");
      }
    } catch (error) {
      console.error('Error checking task progress:', error);
      navigate('/learn');
    }
  };

  // Mistakes statistics
  const thisWeekMistakes = mistakeStorage.getFromLastDays(7).length;
  const improvementRate = mistakeStorage.getImprovementRate();
  const daysSinceLastMistake = mistakeStorage.getDaysSinceLastMistake();
  const patterns = mistakeStorage.analyzeExercisePatterns();
  const chartData = mistakeStorage.getDailyMistakeCounts(14);
  const mostChallengingTopic = Object.entries(topicStats).sort((a, b) => b[1] - a[1])[0];
  const mostCommonErrorType = patterns.commonStepKeywords[0]?.keyword || "None detected";

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="flex flex-col gap-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src="/logo/logocorepus (1).svg" alt="CorePus Logo" className="h-12 w-12" />
              <img src="/name/solvesasdasd (1).svg" alt="CorePus" className="h-14" />
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/pricing')}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Plans
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>

          {/* Main Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="dashboard" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </TabsTrigger>
              <TabsTrigger value="plan" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span className="hidden sm:inline">Plan</span>
              </TabsTrigger>
              <TabsTrigger value="mistakes" className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                <span className="hidden sm:inline">Mistakes</span>
              </TabsTrigger>
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">Profile</span>
              </TabsTrigger>
            </TabsList>

            {/* Dashboard Tab */}
            <TabsContent value="dashboard" className="space-y-6 mt-6">
              {/* Progress Summary */}
              <Card className="p-6 border-primary/20">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold">{plan.topic_name}</h2>
                    <p className="text-sm text-muted-foreground">Grade {plan.grade}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold">{Math.round(progressPercentage)}%</p>
                  </div>
                </div>

                <Progress value={progressPercentage} className="h-2 mb-4" />

                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{completedTasks.length} of {tasks.length} tasks completed</span>
                  <span>
                    Test in {daysUntilExam > 0 ? `${daysUntilExam} days` : "today"} • {format(parseISO(plan.test_date), "MMM d, yyyy")}
                  </span>
                </div>
              </Card>

              {/* Today's Tasks */}
              {todayTasks.length > 0 && (
                <Card className="border-primary">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-xl">Today</CardTitle>
                        <CardDescription className="mt-1">
                          {todayTasks.length} {todayTasks.length === 1 ? 'task' : 'tasks'} scheduled
                        </CardDescription>
                      </div>
                      <Button onClick={() => todayTasks.length > 0 && navigateToTask(todayTasks[0])} size="lg">
                        Start
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {todayTasks.map((task) => (
                        <div key={task.id} className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5">
                              <Circle className="h-4 w-4 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-foreground">{task.title}</p>
                              <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                            </div>
                            <Badge variant="outline" className="shrink-0">{task.task_type}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Past Tasks */}
              {pastTasks.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl">Past</CardTitle>
                    <CardDescription>{completedTasks.length} of {pastTasks.length} completed</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {pastTasks.map((task) => (
                        <div key={task.id} className="p-4 rounded-lg border bg-card">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3 flex-1 min-w-0">
                              {task.is_completed ? (
                                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 shrink-0" />
                              ) : (
                                <Circle className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className={`font-medium ${task.is_completed ? 'text-foreground' : 'text-muted-foreground'}`}>
                                  {task.title}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {format(parseISO(task.scheduled_date), 'MMM d')}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <Badge variant="outline" className="text-xs">{task.task_type}</Badge>
                              {task.is_completed ? (
                                <Badge variant="outline" className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/30 text-xs">Done</Badge>
                              ) : (
                                <Badge variant="outline" className="bg-muted text-muted-foreground border-muted text-xs">Missed</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Upcoming Tasks */}
              {upcomingTasks.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl">Upcoming</CardTitle>
                    <CardDescription>{upcomingTasks.length} {upcomingTasks.length === 1 ? 'task' : 'tasks'} scheduled</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {upcomingTasks.map((task) => (
                        <div key={task.id} className="p-4 rounded-lg border bg-card">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3 flex-1 min-w-0">
                              <Circle className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-muted-foreground">{task.title}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {format(parseISO(task.scheduled_date), 'EEE, MMM d')}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <Badge variant="outline" className="text-xs">{task.task_type}</Badge>
                              <Button size="sm" variant="outline" onClick={() => navigateToTask(task)}>Start</Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Plan Tab */}
            <TabsContent value="plan" className="space-y-6 mt-6">
              <Card className="p-6 border-primary/20">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold">{plan.topic_name}</h2>
                    <p className="text-sm text-muted-foreground">Grade {plan.grade}</p>
                  </div>
                  <Button variant="outline" onClick={() => setShowOnboarding(true)}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Change Plan
                  </Button>
                </div>

                <Progress value={progressPercentage} className="h-2 mb-4" />

                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{completedTasks.length} of {tasks.length} tasks completed</span>
                  <span>Test: {format(parseISO(plan.test_date), "MMMM d, yyyy")}</span>
                </div>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Study Schedule</CardTitle>
                  <CardDescription>Your personalized learning plan</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {tasks.map((task, index) => (
                      <div
                        key={task.id}
                        className={`p-4 rounded-lg border transition-all ${
                          task.is_completed ? 'bg-primary/5 border-primary/20' : 'bg-card'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center mt-1 ${
                            task.is_completed ? 'bg-primary border-primary' : 'border-muted-foreground'
                          }`}>
                            {task.is_completed && <Check className="h-4 w-4 text-primary-foreground" />}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <h3 className={`font-semibold ${task.is_completed && 'line-through text-muted-foreground'}`}>
                                {task.title}
                              </h3>
                              <Badge variant="outline">{format(parseISO(task.scheduled_date), 'MMM d')}</Badge>
                            </div>
                            <p className={`text-sm ${task.is_completed ? 'text-muted-foreground' : 'text-foreground'}`}>
                              {task.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="p-6 bg-accent/5 border-accent">
                <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Study Tips
                </h2>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <BookOpen className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Spend 30-45 minutes per study session for best retention</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <BookOpen className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Take short breaks between study sessions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <BookOpen className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Practice without looking at solutions first</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <BookOpen className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Review your mistakes regularly</span>
                  </li>
                </ul>
              </Card>
            </TabsContent>

            {/* Mistakes Tab */}
            <TabsContent value="mistakes" className="space-y-6 mt-6">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium">Total</CardTitle>
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
                    <div className="text-xl font-bold capitalize truncate">{mostCommonErrorType}</div>
                    <p className="text-xs text-muted-foreground mt-1">Pattern</p>
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
                    <div className="text-xl font-bold truncate">
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
                    <p className="text-xs text-muted-foreground mt-1">Days clean</p>
                  </CardContent>
                </Card>
              </div>

              {/* Progress Over Time Chart */}
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
                          color: "hsl(var(--muted-foreground))",
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
                          <Line type="monotone" dataKey="quiz" stroke="var(--color-quiz)" strokeWidth={2} dot={false} />
                          <Line type="monotone" dataKey="exercise" stroke="var(--color-exercise)" strokeWidth={2} dot={false} />
                          <Line type="monotone" dataKey="practice" stroke="var(--color-practice)" strokeWidth={2} dot={false} />
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

              {mistakes.length === 0 ? (
                <Card className="p-6">
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No mistakes tracked yet!</p>
                    <p className="text-sm">Keep practicing and you'll see your progress here.</p>
                  </div>
                </Card>
              ) : (
                <MistakesCollapsible mistakes={mistakes} onDelete={handleDeleteMistake} />
              )}
            </TabsContent>

            {/* Profile Tab */}
            <TabsContent value="profile" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Account Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{profile?.email}</p>
                    </div>
                  </div>

                  {profile?.name && (
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <User className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Name</p>
                        <p className="font-medium">{profile.name}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <GraduationCap className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Role</p>
                      <Badge variant="secondary" className="mt-1 capitalize">{profile?.role}</Badge>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Member since</p>
                      <p className="font-medium">
                        {profile?.created_at && format(parseISO(profile.created_at), 'MMMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Copy className="h-5 w-5" />
                    Your Invite Code
                  </CardTitle>
                  <CardDescription>
                    Share this code with your parent to link your accounts.
                    The code changes every 2 weeks for security.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative">
                    <div className="flex items-center justify-between p-4 bg-primary/5 border-2 border-primary/20 rounded-lg">
                      <code className="text-lg font-mono font-bold tracking-wider text-primary">
                        {inviteCode || profile?.invite_code}
                      </code>
                      <Button variant="ghost" size="icon" onClick={copyToClipboard} className="shrink-0">
                        {copied ? <Check className="h-5 w-5 text-green-500" /> : <Copy className="h-5 w-5" />}
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>
                        Expires in: <span className="font-medium text-foreground">{getTimeUntilExpiration()}</span>
                      </span>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleRefreshCode} disabled={refreshing}>
                      <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                      Refresh Code
                    </Button>
                  </div>

                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-medium mb-2">How to use your invite code:</h4>
                    <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                      <li>Share this code with your parent</li>
                      <li>They can enter it in their parent dashboard</li>
                      <li>Once linked, they can view your progress</li>
                    </ol>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Subscription</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={profile?.subscription_status === 'active' ? 'default' : 'secondary'}
                      className="capitalize"
                    >
                      {profile?.subscription_status}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {profile?.subscription_status === 'trial' && 'You are currently on a free trial'}
                      {profile?.subscription_status === 'active' && 'Your subscription is active'}
                      {profile?.subscription_status === 'cancelled' && 'Your subscription has been cancelled'}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

// Collapsible Mistakes List Component
const MistakesCollapsible = ({ mistakes, onDelete }: { mistakes: MistakeRecord[]; onDelete: (id: string) => void }) => {
  const [isOpen, setIsOpen] = useState(false);

  const getBadgeVariant = (type: MistakeRecord['type']) => {
    switch (type) {
      case 'quiz': return 'destructive' as const;
      case 'exercise': return 'default' as const;
      case 'practice': return 'secondary' as const;
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
    <Card>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                View All Mistakes
                <Badge variant="secondary" className="ml-2">{mistakes.length}</Badge>
              </CardTitle>
              {isOpen ? (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            <CardDescription>
              {isOpen ? 'Click to collapse' : 'Click to expand and view your mistakes'}
            </CardDescription>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="space-y-3 pt-0">
            {mistakes.map((mistake) => (
              <Card key={mistake.id} className="p-4 bg-accent/5 border-accent">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex gap-2 flex-wrap">
                    <Badge variant={getBadgeVariant(mistake.type)}>{mistake.type}</Badge>
                    <Badge variant="outline">{mistake.topic}</Badge>
                    <Badge variant="secondary" className="text-xs">{getTimeAgo(mistake.date)}</Badge>
                  </div>
                  <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => onDelete(mistake.id)}>
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
            ))}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

export default Home;
