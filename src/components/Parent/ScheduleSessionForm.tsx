import { useState, type FormEvent } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

interface Student {
  id: string;
  name: string;
  grade_level: number;
}

interface ScheduleSessionFormProps {
  students: Student[];
  selectedStudentId: string | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function ScheduleSessionForm({ students, selectedStudentId, onSuccess, onCancel }: ScheduleSessionFormProps) {
  const { user } = useAuth();
  const [studentId, setStudentId] = useState(selectedStudentId || (students[0]?.id || ''));
  const [scheduleType, setScheduleType] = useState<'one-time' | 'recurring'>('one-time');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('17:00');
  const [durationMinutes, setDurationMinutes] = useState('30');
  const [daysOfWeek, setDaysOfWeek] = useState<string[]>([]);
  const [endType, setEndType] = useState<'ongoing' | 'until'>('ongoing');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const toggleDay = (day: string) => {
    setDaysOfWeek(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user) return;

    if (scheduleType === 'recurring' && daysOfWeek.length === 0) {
      setError('Please select at least one day of the week');
      return;
    }

    setError('');
    setLoading(true);

    try {
      if (scheduleType === 'one-time') {
        const { error: insertError } = await supabase
          .from('scheduled_sessions')
          .insert({
            parent_id: user.id,
            student_id: studentId,
            topic: null,
            scheduled_date: scheduledDate,
            scheduled_time: scheduledTime,
            duration_minutes: parseInt(durationMinutes),
            status: 'pending',
          });

        if (insertError) throw insertError;
      } else {
        // Create recurring schedule - sessions for next 4 weeks
        const sessions = [];
        const startDate = new Date();
        const maxDate = endType === 'until' && endDate
          ? new Date(endDate)
          : new Date(startDate.getTime() + 28 * 24 * 60 * 60 * 1000);

        for (let i = 0; i < 60; i++) {
          const currentDate = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
          if (currentDate > maxDate) break;

          const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'long' });
          if (daysOfWeek.includes(dayName)) {
            sessions.push({
              parent_id: user.id,
              student_id: studentId,
              topic: null,
              scheduled_date: currentDate.toISOString().split('T')[0],
              scheduled_time: scheduledTime,
              duration_minutes: parseInt(durationMinutes),
              status: 'pending',
            });
          }
        }

        if (sessions.length > 0) {
          const { error: insertError } = await supabase
            .from('scheduled_sessions')
            .insert(sessions);

          if (insertError) throw insertError;
        }
      }

      onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to schedule session');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">Schedule Practice Session</h2>
      <p className="text-sm text-gray-500 mb-6">
        Your student will choose what to work on when they start the session.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label>Student</Label>
          <Select value={studentId} onValueChange={setStudentId}>
            <SelectTrigger>
              <SelectValue placeholder="Select student" />
            </SelectTrigger>
            <SelectContent>
              {students.map((student) => (
                <SelectItem key={student.id} value={student.id}>
                  {student.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Schedule Type Toggle */}
        <div className="space-y-2">
          <Label>Schedule Type</Label>
          <div className="flex gap-2">
            <Button
              type="button"
              variant={scheduleType === 'one-time' ? 'default' : 'outline'}
              onClick={() => setScheduleType('one-time')}
              className={`flex-1 ${scheduleType === 'one-time' ? 'bg-purple-600 hover:bg-purple-700' : ''}`}
            >
              One-time
            </Button>
            <Button
              type="button"
              variant={scheduleType === 'recurring' ? 'default' : 'outline'}
              onClick={() => setScheduleType('recurring')}
              className={`flex-1 ${scheduleType === 'recurring' ? 'bg-purple-600 hover:bg-purple-700' : ''}`}
            >
              Recurring
            </Button>
          </div>
        </div>

        {scheduleType === 'one-time' ? (
          <div className="space-y-2">
            <Label>Date</Label>
            <Input
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              required
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <Label>Day(s) of Week</Label>
              <div className="grid grid-cols-4 gap-2">
                {weekDays.map(day => (
                  <Button
                    key={day}
                    type="button"
                    variant={daysOfWeek.includes(day) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => toggleDay(day)}
                    className={daysOfWeek.includes(day) ? 'bg-purple-600 hover:bg-purple-700' : ''}
                  >
                    {day.slice(0, 3)}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Ends</Label>
              <div className="flex gap-2 mb-2">
                <Button
                  type="button"
                  variant={endType === 'ongoing' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setEndType('ongoing')}
                  className={`flex-1 ${endType === 'ongoing' ? 'bg-purple-600 hover:bg-purple-700' : ''}`}
                >
                  Ongoing
                </Button>
                <Button
                  type="button"
                  variant={endType === 'until' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setEndType('until')}
                  className={`flex-1 ${endType === 'until' ? 'bg-purple-600 hover:bg-purple-700' : ''}`}
                >
                  Until Date
                </Button>
              </div>
              {endType === 'until' && (
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required={endType === 'until'}
                  min={new Date().toISOString().split('T')[0]}
                />
              )}
            </div>
          </>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Time</Label>
            <Input
              type="time"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Duration</Label>
            <Select value={durationMinutes} onValueChange={setDurationMinutes}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 min</SelectItem>
                <SelectItem value="30">30 min</SelectItem>
                <SelectItem value="45">45 min</SelectItem>
                <SelectItem value="60">60 min</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="flex-1 bg-purple-600 hover:bg-purple-700"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Scheduling...
              </>
            ) : (
              scheduleType === 'recurring' ? 'Create Schedule' : 'Schedule Session'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
