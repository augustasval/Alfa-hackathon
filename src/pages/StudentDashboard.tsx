import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { OnboardingModal } from "@/components/OnboardingModal";
import { Navigation } from "@/components/Navigation";
import { ScheduledSessionsCard } from "@/components/Student/ScheduledSessionsCard";
import { useLearningPlan } from "@/hooks/useLearningPlan";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  CheckCircle2, Circle, Loader2, LogOut, CreditCard, RefreshCw
} from "lucide-react";
import { format, differenceInDays, parseISO, isToday, isPast } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { SessionManager } from "@/lib/sessionManager";
import { toast } from "sonner";

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { profile, signOut } = useAuth();
  const { plan, tasks, loading, refetch } = useLearningPlan();
  const [showOnboarding, setShowOnboarding] = useState(false);

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
                onClick={() => setShowOnboarding(true)}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Change Learning Plan
              </Button>
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

          {/* Navigation */}
          <Navigation />

          {/* Dashboard Content */}
          <div className="space-y-6">
            {/* Scheduled Sessions */}
            <ScheduledSessionsCard />

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
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
