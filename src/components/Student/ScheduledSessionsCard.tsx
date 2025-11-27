import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Calendar, Clock, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

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
}

export function ScheduledSessionsCard() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<ScheduledSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadScheduledSessions();
    }
  }, [user]);

  async function loadScheduledSessions() {
    try {
      setLoading(true);
      
      // First, get the student record for this user
      const { data: studentData } = await supabase
        .from('students')
        .select('id')
        .eq('linked_profile_id', user!.id)
        .maybeSingle();

      if (!studentData) {
        setSessions([]);
        return;
      }

      // Then get scheduled sessions for this student
      const { data, error } = await supabase
        .from('scheduled_sessions')
        .select('*')
        .eq('student_id', studentData.id)
        .eq('status', 'pending')
        .gte('scheduled_date', new Date().toISOString().split('T')[0])
        .order('scheduled_date', { ascending: true })
        .order('scheduled_time', { ascending: true })
        .limit(5);

      if (error) throw error;
      setSessions(data || []);
    } catch (error) {
      console.error('Error loading scheduled sessions:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (sessions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Upcoming Practice Sessions
          </CardTitle>
          <CardDescription>No sessions scheduled yet</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Your parent hasn't scheduled any practice sessions. Sessions will appear here when scheduled.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          Upcoming Practice Sessions
        </CardTitle>
        <CardDescription>
          {sessions.length} {sessions.length === 1 ? 'session' : 'sessions'} scheduled
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sessions.map((session) => (
            <div
              key={session.id}
              className="p-4 bg-primary/5 rounded-lg border border-primary/20"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-semibold text-foreground">
                    {session.topic || 'Practice Session'}
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(session.scheduled_date), 'EEE, MMM d, yyyy')}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {session.scheduled_time}
                    </span>
                  </div>
                </div>
                <Badge variant="secondary">
                  {session.duration_minutes} min
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
