import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { mistakeService, type Mistake } from '@/lib/mistakeService';
import { useAuth } from '@/contexts/AuthContext';
import { AlertCircle, BookOpen, Calculator, Target } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface MistakeWithProfile extends Mistake {
  profiles?: {
    id: string;
    full_name: string;
    email: string;
  };
}

export function StudentMistakesView() {
  const { user } = useAuth();
  const [mistakes, setMistakes] = useState<MistakeWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadMistakes();
    }
  }, [user]);

  async function loadMistakes() {
    try {
      setLoading(true);
      const data = await mistakeService.getLinkedStudentMistakes(user!.id);
      setMistakes(data);
    } catch (err) {
      console.error('Error loading mistakes:', err);
      setError('Failed to load student mistakes');
    } finally {
      setLoading(false);
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'quiz': return <BookOpen className="h-4 w-4" />;
      case 'exercise': return <Calculator className="h-4 w-4" />;
      case 'practice': return <Target className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'quiz': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'exercise': return 'bg-primary/10 text-primary border-primary/20';
      case 'practice': return 'bg-green-500/10 text-green-500 border-green-500/20';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  // Group mistakes by student
  const mistakesByStudent = mistakes.reduce((acc, mistake) => {
    const studentId = mistake.user_id || 'unknown';
    if (!acc[studentId]) {
      acc[studentId] = {
        student: mistake.profiles,
        mistakes: [],
      };
    }
    acc[studentId].mistakes.push(mistake);
    return acc;
  }, {} as Record<string, { student?: any; mistakes: MistakeWithProfile[] }>);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Student Mistakes</CardTitle>
          <CardDescription>Loading student progress...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (mistakes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Student Mistakes</CardTitle>
          <CardDescription>No mistakes recorded yet</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            When your linked students make mistakes, they will appear here for you to review.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Student Mistakes</CardTitle>
        <CardDescription>
          Review mistakes made by your linked students
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {Object.entries(mistakesByStudent).map(([studentId, { student, mistakes }]) => (
          <div key={studentId} className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">{student?.full_name || 'Unknown Student'}</h3>
                <p className="text-sm text-muted-foreground">{student?.email}</p>
              </div>
              <Badge variant="secondary">{mistakes.length} mistakes</Badge>
            </div>

            <Accordion type="single" collapsible className="w-full">
              {mistakes.map((mistake, index) => (
                <AccordionItem key={mistake.id || index} value={`mistake-${index}`}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3 text-left">
                      <Badge className={getTypeColor(mistake.type)}>
                        <span className="flex items-center gap-1">
                          {getTypeIcon(mistake.type)}
                          {mistake.type}
                        </span>
                      </Badge>
                      <div className="flex-1">
                        <p className="font-medium">{mistake.topic}</p>
                        <p className="text-xs text-muted-foreground">
                          {mistake.created_at && new Date(mistake.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3 pt-3">
                      <div>
                        <p className="text-sm font-medium mb-1">Problem:</p>
                        <p className="text-sm text-muted-foreground">{mistake.problem}</p>
                      </div>
                      {mistake.attempts && (
                        <div>
                          <p className="text-sm font-medium">Attempts: {mistake.attempts}</p>
                        </div>
                      )}
                      {mistake.user_answer && (
                        <div>
                          <p className="text-sm font-medium mb-1">Student's Answer:</p>
                          <p className="text-sm text-muted-foreground">{mistake.user_answer}</p>
                        </div>
                      )}
                      {mistake.correct_answer && (
                        <div>
                          <p className="text-sm font-medium mb-1">Correct Answer:</p>
                          <p className="text-sm text-green-600">{mistake.correct_answer}</p>
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
