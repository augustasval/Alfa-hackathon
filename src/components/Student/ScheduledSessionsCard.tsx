import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Calendar, Clock, Loader2, Video } from 'lucide-react';
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
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<ScheduledSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    if (user) {
      loadScheduledSessions();
    }
  }, [user]);

  // Update current time every minute to refresh joinable status
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  // Check if a session is joinable (15 min before to 30 min after start)
  const isWithin15Minutes = (scheduledDate: string, scheduledTime: string): boolean => {
    // Parse time components (handles "HH:MM" or "HH:MM:SS" format)
    const timeParts = scheduledTime.split(':');
    const hours = parseInt(timeParts[0], 10);
    const minutes = parseInt(timeParts[1], 10);
    
    // Create date from parts to avoid UTC/local timezone confusion
    const [year, month, day] = scheduledDate.split('-').map(Number);
    const sessionDateTime = new Date(year, month - 1, day, hours, minutes, 0, 0);
    
    const now = new Date(); // Use fresh current time
    const diffMs = sessionDateTime.getTime() - now.getTime();
    const diffMinutes = diffMs / (1000 * 60);
    
    // Allow joining from 15 minutes before until 30 minutes after start
    return diffMinutes >= -30 && diffMinutes <= 15;
  };

  const handleJoinSession = (session: ScheduledSession) => {
    // Store session info for context
    if (session.topic) {
      localStorage.setItem('sessionTopic', session.topic);
    }
    navigate('/exercice');
  };

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
        .eq('status', 'scheduled')
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
          {sessions.map((session) => {
            const canJoin = isWithin15Minutes(session.scheduled_date, session.scheduled_time);
            return (
              <div
                key={session.id}
                className={`p-4 rounded-lg border transition-all ${
                  canJoin 
                    ? 'bg-primary/10 border-primary/50 shadow-md' 
                    : 'bg-primary/5 border-primary/20'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-foreground">
                        {session.topic || 'Practice Session'}
                      </p>
                      {canJoin && (
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/50 animate-pulse">
                          Starting Soon
                        </Badge>
                      )}
                    </div>
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
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant="secondary">
                      {session.duration_minutes} min
                    </Badge>
                    {canJoin && (
                      <Button
                        size="sm"
                        onClick={() => handleJoinSession(session)}
                        className="animate-pulse"
                      >
                        <Video className="w-4 h-4 mr-1" />
                        Join Session
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
