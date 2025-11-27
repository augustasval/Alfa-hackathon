import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import AddStudentForm from '@/components/Parent/AddStudentForm';
import ScheduleSessionForm from '@/components/Parent/ScheduleSessionForm';
import SessionReports from '@/components/Parent/SessionReports';
import { StudentMistakesView } from '@/components/Parent/StudentMistakesView';
import { AccountSwitcher } from '@/components/AccountSwitcher';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Users, Plus, Calendar, GraduationCap, Clock, CalendarDays, Link, User, Activity, CheckCircle, BookOpen, TrendingUp, CreditCard, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
interface Student {
  id: string;
  name: string;
  grade_level: number;
  parent_id: string;
  linked_profile_id: string | null;
  created_at: string;
}
interface ScheduledSession {
  id: string;
  student_id: string;
  parent_id: string;
  topic: string | null;
  scheduled_date: string;
  scheduled_time: string;
  duration_minutes: number;
  status: string;
  created_at: string;
  exercises_completed?: number;
  mistakes_count?: number;
}
interface StudentActivity {
  studentId: string;
  linkedProfileId: string | null;
  lastActivity: string | null;
  totalTasksCompleted: number;
  totalTasks: number;
  currentTopic: string | null;
  streakDays: number;
}
export default function ParentDashboard() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const profile = auth?.profile;
  const signOut = auth?.signOut;
  const [students, setStudents] = useState<Student[]>([]);
  const [scheduledSessions, setScheduledSessions] = useState<ScheduledSession[]>([]);
  const [studentActivities, setStudentActivities] = useState<StudentActivity[]>([]);
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [showScheduleSession, setShowScheduleSession] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [sessionToCancel, setSessionToCancel] = useState<string | null>(null);
  useEffect(() => {
    loadStudents();
    loadScheduledSessions();
  }, []);

  // Load student activities when students change
  useEffect(() => {
    if (students.length > 0) {
      loadStudentActivities();
    }
  }, [students]);

  // Handle info messages from redirects (e.g., already_registered)
  useEffect(() => {
    const info = searchParams.get('info');
    if (info === 'already_registered') {
      toast.info('You already have an account! You have been signed in.');
      // Remove the query param to avoid showing the toast again on refresh
      searchParams.delete('info');
      setSearchParams(searchParams, {
        replace: true
      });
    }
  }, [searchParams, setSearchParams]);
  async function loadStudents() {
    const {
      data,
      error
    } = await supabase.from('students').select('*').order('created_at', {
      ascending: false
    });
    if (error) {
      console.error('Error loading students:', error);
    } else {
      setStudents(data || []);
    }
  }
  async function loadScheduledSessions() {
    const {
      data,
      error
    } = await supabase.from('scheduled_sessions').select('*').order('scheduled_date', {
      ascending: true
    }).order('scheduled_time', {
      ascending: true
    });
    if (error) {
      console.error('Error loading sessions:', error);
    } else {
      setScheduledSessions(data || []);
    }
  }
  async function loadStudentActivities() {
    const activities: StudentActivity[] = [];
    for (const student of students) {
      if (!student.linked_profile_id) {
        // Student not linked yet - no activity data available
        activities.push({
          studentId: student.id,
          linkedProfileId: null,
          lastActivity: null,
          totalTasksCompleted: 0,
          totalTasks: 0,
          currentTopic: null,
          streakDays: 0
        });
        continue;
      }

      // Get learning plans for this student (via session_id which matches their profile)
      const {
        data: plans
      } = await supabase.from('learning_plans').select('id, topic_name, updated_at').order('created_at', {
        ascending: false
      }).limit(1);

      // Get tasks for the student's plans
      let totalTasks = 0;
      let completedTasks = 0;
      let currentTopic: string | null = null;
      let lastActivityDate: string | null = null;
      if (plans && plans.length > 0) {
        currentTopic = plans[0].topic_name;
        const {
          data: tasks
        } = await supabase.from('learning_tasks').select('id, is_completed, created_at').eq('plan_id', plans[0].id);
        if (tasks) {
          totalTasks = tasks.length;
          completedTasks = tasks.filter(t => t.is_completed).length;
        }

        // Get latest task progress for last activity
        const {
          data: progress
        } = await supabase.from('task_progress').select('updated_at').order('updated_at', {
          ascending: false
        }).limit(1);
        if (progress && progress.length > 0) {
          lastActivityDate = progress[0].updated_at;
        } else if (plans[0].updated_at) {
          lastActivityDate = plans[0].updated_at;
        }
      }

      // Calculate streak (simplified - days with activity in a row)
      let streakDays = 0;
      if (lastActivityDate) {
        const lastDate = new Date(lastActivityDate);
        const today = new Date();
        const diffDays = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays <= 1) {
          streakDays = 1; // Active today or yesterday
        }
      }
      activities.push({
        studentId: student.id,
        linkedProfileId: student.linked_profile_id,
        lastActivity: lastActivityDate,
        totalTasksCompleted: completedTasks,
        totalTasks: totalTasks,
        currentTopic: currentTopic,
        streakDays: streakDays
      });
    }
    setStudentActivities(activities);
  }
  function handleStudentAdded() {
    setShowAddStudent(false);
    loadStudents();
  }
  function handleSessionScheduled() {
    setShowScheduleSession(false);
    setSelectedStudentId(null);
    loadScheduledSessions();
  }
  async function handleSignOut() {
    if (signOut) {
      await signOut();
      navigate('/');
    }
  }

  async function handleCancelSession() {
    if (!sessionToCancel) return;

    try {
      const { error } = await supabase
        .from('scheduled_sessions')
        .update({ status: 'cancelled' })
        .eq('id', sessionToCancel);

      if (error) throw error;

      toast.success('Session cancelled successfully');
      loadScheduledSessions();
      setSessionToCancel(null);
    } catch (error) {
      console.error('Error cancelling session:', error);
      toast.error('Failed to cancel session');
    }
  }
  return <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      {/* Navigation */}
      <nav className="bg-card border-b border-border px-6 py-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <img src="/logo/logo.svg?v=2" alt="Jolvita Logo" className="h-12 w-12" />
            <img src="/name/brand-name.svg?v=2" alt="Jolvita" className="h-8" />
            <Badge variant="secondary" className="ml-4">Parent Portal</Badge>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={() => navigate('/pricing')}>
              <CreditCard className="w-4 h-4 mr-2" />
              Plans
            </Button>
            <AccountSwitcher />
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* My Students Card */}
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Users className="w-5 h-5 text-primary" />
                My Students
              </CardTitle>
              <Button size="sm" onClick={() => setShowAddStudent(true)} className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-1" />
                Add Student
              </Button>
            </CardHeader>
            <CardContent>
              {students.length === 0 ? <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p>No students yet.</p>
                  <p className="text-sm mt-1">Add your first student to get started.</p>
                </div> : <div className="space-y-3">
                  {students.map(student => {
                const activity = studentActivities.find(a => a.studentId === student.id);
                return <div key={student.id} className="p-4 bg-background rounded-lg border border-border hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-primary/10 rounded-full">
                              <User className="w-4 h-4 text-primary" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-foreground">{student.name}</span>
                                {student.linked_profile_id && <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
                                    <Link className="w-3 h-3 mr-1" />
                                    Linked
                                  </Badge>}
                              </div>
                              <div className="text-sm text-muted-foreground">Grade {student.grade_level}</div>
                            </div>
                          </div>
                          <Button variant="outline" size="sm" onClick={() => {
                      setSelectedStudentId(student.id);
                      setShowScheduleSession(true);
                    }}>
                            <Calendar className="w-4 h-4 mr-1" />
                            Schedule
                          </Button>
                        </div>

                        {/* Activity Section */}
                        {student.linked_profile_id ? <div className="mt-3 pt-3 border-t border-border">
                            <div className="grid grid-cols-3 gap-3">
                              {/* Last Activity */}
                              <div className="flex items-center gap-2">
                                <Activity className="w-4 h-4 text-primary" />
                                <div>
                                  <div className="text-xs text-muted-foreground">Last Active</div>
                                  <div className="text-sm font-medium text-foreground">
                                    {activity?.lastActivity ? new Date(activity.lastActivity).toLocaleDateString() : 'No activity'}
                                  </div>
                                </div>
                              </div>

                              {/* Tasks Completed */}
                              <div className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-primary" />
                                <div>
                                  <div className="text-xs text-muted-foreground">Tasks Done</div>
                                  <div className="text-sm font-medium text-foreground">
                                    {activity?.totalTasksCompleted || 0}/{activity?.totalTasks || 0}
                                  </div>
                                </div>
                              </div>

                              {/* Current Topic */}
                              <div className="flex items-center gap-2">
                                <BookOpen className="w-4 h-4 text-primary" />
                                <div>
                                  <div className="text-xs text-muted-foreground">Current Topic</div>
                                  <div className="text-sm font-medium truncate max-w-[100px] text-foreground">
                                    {activity?.currentTopic || 'None'}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Progress Bar */}
                            {activity && activity.totalTasks > 0 && <div className="mt-3">
                                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                  <span>Progress</span>
                                  <span>{Math.round(activity.totalTasksCompleted / activity.totalTasks * 100)}%</span>
                                </div>
                                <div className="w-full bg-secondary rounded-full h-2">
                                  <div className="bg-primary h-2 rounded-full transition-all" style={{
                          width: `${activity.totalTasksCompleted / activity.totalTasks * 100}%`
                        }} />
                                </div>
                              </div>}
                          </div> : <div className="mt-3 pt-3 border-t border-border">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Activity className="w-4 h-4" />
                              <span>Activity will appear once student links their account</span>
                            </div>
                          </div>}
                      </div>;
              })}
                </div>}
            </CardContent>
          </Card>

          {/* Upcoming Sessions Card */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <CalendarDays className="w-5 h-5 text-primary" />
                Upcoming Sessions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {scheduledSessions.filter(s => s.status === 'scheduled').length === 0 ? <div className="text-center py-8 text-muted-foreground">
                  <CalendarDays className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p>No upcoming sessions scheduled.</p>
                  <p className="text-sm mt-1">Schedule a session for your student.</p>
                </div> : <div className="space-y-3">
                  {scheduledSessions.filter(s => s.status === 'scheduled').slice(0, 5).map(session => {
                const student = students.find(s => s.id === session.student_id);
                return <div key={session.id} className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <div className="font-semibold text-foreground">{student?.name}</div>
                              <div className="text-sm text-muted-foreground mt-1">
                                {session.topic || 'Practice Session'}
                              </div>
                              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <CalendarDays className="w-3 h-3" />
                                  {new Date(session.scheduled_date).toLocaleDateString()}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {session.scheduled_time}
                                </span>
                                <Badge variant="secondary">
                                  {session.duration_minutes} min
                                </Badge>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSessionToCancel(session.id)}
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>;
              })}
                </div>}
            </CardContent>
          </Card>
        </div>

        {/* Completed Sessions Card */}
        <Card className="bg-card border-border mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <CheckCircle className="w-5 h-5 text-primary" />
              Completed Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {scheduledSessions.filter(s => s.status === 'completed').length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                <p>No completed sessions yet.</p>
                <p className="text-sm mt-1">Session statistics will appear here after completion.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {scheduledSessions
                  .filter(s => s.status === 'completed')
                  .slice(0, 10)
                  .map(session => {
                    const student = students.find(s => s.id === session.student_id);
                    const exercisesCompleted = session.exercises_completed || 0;
                    const mistakesCount = session.mistakes_count || 0;
                    const accuracy = exercisesCompleted > 0 
                      ? Math.round(((exercisesCompleted - mistakesCount) / exercisesCompleted) * 100)
                      : 0;
                    
                    return (
                      <div key={session.id} className="p-4 bg-green-500/5 rounded-lg border border-green-500/20">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-foreground">{student?.name}</span>
                              <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                                Completed
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {session.topic || 'Practice Session'}
                            </div>
                            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <CalendarDays className="w-3 h-3" />
                                {new Date(session.scheduled_date).toLocaleDateString()}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {session.scheduled_time}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="grid grid-cols-3 gap-4 text-sm">
                              <div>
                                <div className="text-xs text-muted-foreground">Exercises</div>
                                <div className="font-semibold text-foreground">{exercisesCompleted}</div>
                              </div>
                              <div>
                                <div className="text-xs text-muted-foreground">Mistakes</div>
                                <div className="font-semibold text-destructive">{mistakesCount}</div>
                              </div>
                              <div>
                                <div className="text-xs text-muted-foreground">Accuracy</div>
                                <div className={`font-semibold ${accuracy >= 75 ? 'text-green-600' : accuracy >= 50 ? 'text-yellow-600' : 'text-destructive'}`}>
                                  {accuracy}%
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Session Reports */}
        <SessionReports students={students} />

        {/* Student Mistakes View */}
        <StudentMistakesView />
      </div>

      {/* Add Student Dialog */}
      <Dialog open={showAddStudent} onOpenChange={setShowAddStudent}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Student</DialogTitle>
          </DialogHeader>
          <AddStudentForm onSuccess={handleStudentAdded} onCancel={() => setShowAddStudent(false)} />
        </DialogContent>
      </Dialog>

      {/* Schedule Session Dialog */}
      <Dialog open={showScheduleSession} onOpenChange={setShowScheduleSession}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Schedule Practice Session</DialogTitle>
          </DialogHeader>
          <ScheduleSessionForm students={students} selectedStudentId={selectedStudentId} onSuccess={handleSessionScheduled} onCancel={() => {
          setShowScheduleSession(false);
          setSelectedStudentId(null);
        }} />
        </DialogContent>
      </Dialog>

      {/* Cancel Session Confirmation Dialog */}
      <AlertDialog open={!!sessionToCancel} onOpenChange={(open) => !open && setSessionToCancel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Session?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this scheduled session? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Session</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancelSession} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Cancel Session
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>;
}