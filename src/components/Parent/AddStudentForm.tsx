import { useState, type FormEvent } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, UserPlus, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

interface AddStudentFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function AddStudentForm({ onSuccess, onCancel }: AddStudentFormProps) {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [gradeLevel, setGradeLevel] = useState('9');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdCredentials, setCreatedCredentials] = useState<{ email: string; password: string } | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user) return;

    setError('');
    setLoading(true);

    try {
      // Call edge function to create student account
      const { data, error: functionError } = await supabase.functions.invoke('create-student-account', {
        body: {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          gradeLevel: parseInt(gradeLevel),
        },
      });

      if (functionError) throw functionError;

      if (!data.success) {
        throw new Error(data.error || 'Failed to create student account');
      }

      // Show success with credentials
      setCreatedCredentials({
        email: email.trim().toLowerCase(),
        password,
      });

      toast.success('Student account created successfully!');
    } catch (err: unknown) {
      console.error('Error creating student:', err);
      setError(err instanceof Error ? err.message : 'Failed to create student account');
    } finally {
      setLoading(false);
    }
  }

  // If credentials were created, show them to the parent
  if (createdCredentials) {
    return (
      <div className="space-y-4">
        <Alert className="bg-green-50 border-green-200">
          <AlertDescription className="text-green-800">
            <strong className="block mb-2">Student account created successfully!</strong>
            <p className="text-sm">Save these credentials securely. Your student will use them to log in.</p>
          </AlertDescription>
        </Alert>

        <div className="space-y-3 p-4 bg-muted rounded-lg">
          <div>
            <Label className="text-xs text-muted-foreground">Email / Username</Label>
            <div className="flex items-center gap-2 mt-1">
              <Input
                value={createdCredentials.email}
                readOnly
                className="font-mono bg-background"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(createdCredentials.email);
                  toast.success('Email copied to clipboard');
                }}
              >
                Copy
              </Button>
            </div>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Password</Label>
            <div className="flex items-center gap-2 mt-1">
              <Input
                value={createdCredentials.password}
                readOnly
                type={showPassword ? 'text' : 'password'}
                className="font-mono bg-background"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(createdCredentials.password);
                  toast.success('Password copied to clipboard');
                }}
              >
                Copy
              </Button>
            </div>
          </div>
        </div>

        <Alert className="bg-amber-50 border-amber-200">
          <AlertDescription className="text-amber-800 text-sm">
            <strong>Important:</strong> This is the only time you'll see this password. Make sure to save it securely and share it with your student.
          </AlertDescription>
        </Alert>

        <Button
          onClick={() => {
            setCreatedCredentials(null);
            onSuccess();
          }}
          className="w-full"
        >
          Done
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Alert className="bg-blue-50 border-blue-200">
        <AlertDescription className="text-sm text-blue-800">
          Create a student account with login credentials that your student will use to access the platform.
        </AlertDescription>
      </Alert>

      <div className="space-y-2">
        <Label htmlFor="studentName">Student Name *</Label>
        <Input
          id="studentName"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="Enter student's full name"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="studentEmail">Email / Username *</Label>
        <Input
          id="studentEmail"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="student@example.com"
        />
        <p className="text-xs text-muted-foreground">
          This will be used as the student's login username
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="studentPassword">Password *</Label>
        <div className="relative">
          <Input
            id="studentPassword"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            placeholder="Create a secure password"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Minimum 6 characters. Save this password - you'll need to share it with your student.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="gradeLevel">Grade Level *</Label>
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
          disabled={loading}
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
              Creating Account...
            </>
          ) : (
            <>
              <UserPlus className="mr-2 h-4 w-4" />
              Create Student Account
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
