import { useState, type FormEvent } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Link, UserPlus } from 'lucide-react';

interface AddStudentFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function AddStudentForm({ onSuccess, onCancel }: AddStudentFormProps) {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [gradeLevel, setGradeLevel] = useState('9');
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('invite');

  async function handleInviteSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user) return;

    setError('');
    setLoading(true);

    try {
      // First, find the student profile with this invite code
      const { data: studentProfile, error: findError } = await supabase
        .from('profiles')
        .select('id, email, name, grade_level, invite_code_expires_at')
        .eq('invite_code', inviteCode.trim())
        .eq('role', 'student')
        .maybeSingle();

      if (findError) throw findError;

      if (!studentProfile) {
        throw new Error('Invalid invite code. Please check the code and try again.');
      }

      // Check if code is expired
      if (studentProfile.invite_code_expires_at &&
          new Date(studentProfile.invite_code_expires_at) < new Date()) {
        throw new Error('This invite code has expired. Ask your student for a new code.');
      }

      // Create student entry linked to the profile
      const { error: insertError } = await supabase
        .from('students')
        .insert({
          parent_id: user.id,
          name: studentProfile.name || studentProfile.email.split('@')[0],
          grade_level: studentProfile.grade_level || 9,
          linked_profile_id: studentProfile.id,
        });

      if (insertError) throw insertError;
      onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to link student');
    } finally {
      setLoading(false);
    }
  }

  async function handleManualSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user) return;

    setError('');
    setLoading(true);

    try {
      const { error: insertError } = await supabase
        .from('students')
        .insert({
          parent_id: user.id,
          name,
          grade_level: parseInt(gradeLevel),
        });

      if (insertError) throw insertError;
      onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to add student');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="invite" className="flex items-center gap-2">
            <Link className="h-4 w-4" />
            Link with Code
          </TabsTrigger>
          <TabsTrigger value="manual" className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Add Manually
          </TabsTrigger>
        </TabsList>

        <TabsContent value="invite">
          <form onSubmit={handleInviteSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="inviteCode">Student's Invite Code</Label>
              <Input
                id="inviteCode"
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                required
                placeholder="Enter the invite code from your student"
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                Your student can find their invite code in their Profile page
              </p>
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
                disabled={loading || !inviteCode.trim()}
                className="flex-1 bg-purple-600 hover:bg-purple-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Linking...
                  </>
                ) : (
                  'Link Student'
                )}
              </Button>
            </div>
          </form>
        </TabsContent>

        <TabsContent value="manual">
          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="studentName">Student Name</Label>
              <Input
                id="studentName"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Enter student's name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gradeLevel">Grade Level</Label>
              <Select value={gradeLevel} onValueChange={setGradeLevel}>
                <SelectTrigger>
                  <SelectValue placeholder="Select grade" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((grade) => (
                    <SelectItem key={grade} value={grade.toString()}>
                      Grade {grade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <p className="text-xs text-muted-foreground">
              Note: Adding a student manually will not link to their account.
              Use "Link with Code" to connect to an existing student account.
            </p>

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
                    Adding...
                  </>
                ) : (
                  'Add Student'
                )}
              </Button>
            </div>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  );
}
