import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { mistakeService, type Mistake } from '@/lib/mistakeService';
import { useAuth } from '@/contexts/AuthContext';
import { AlertCircle, BookOpen, Calculator, Target, TrendingUp, TrendingDown, Minus, Filter } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface MistakeWithProfile extends Mistake {
  profiles?: {
    id: string;
    full_name: string;
    email: string;
  };
}

type FilterType = 'all' | 'quiz' | 'exercise' | 'practice';
type SortType = 'date' | 'topic' | 'type';

export function StudentMistakesView() {
  const { user } = useAuth();
  const [mistakes, setMistakes] = useState<MistakeWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<SortType>('date');

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

  // Calculate statistics
  const getStatistics = (studentMistakes: MistakeWithProfile[]) => {
    const total = studentMistakes.length;
    const byType = {
      quiz: studentMistakes.filter(m => m.type === 'quiz').length,
      exercise: studentMistakes.filter(m => m.type === 'exercise').length,
      practice: studentMistakes.filter(m => m.type === 'practice').length,
    };

    // Topic analysis
    const topicCounts: Record<string, number> = {};
    studentMistakes.forEach(m => {
      topicCounts[m.topic] = (topicCounts[m.topic] || 0) + 1;
    });
    const topicArray = Object.entries(topicCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    // Trend analysis (last 7 days vs previous 7 days)
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    
    const lastWeek = studentMistakes.filter(m => 
      new Date(m.created_at) >= sevenDaysAgo
    ).length;
    const previousWeek = studentMistakes.filter(m => 
      new Date(m.created_at) >= fourteenDaysAgo && new Date(m.created_at) < sevenDaysAgo
    ).length;

    const trend = previousWeek === 0 ? 0 : ((lastWeek - previousWeek) / previousWeek) * 100;

    // Accuracy calculation (if attempts data available)
    const totalAttempts = studentMistakes.reduce((sum, m) => sum + (m.attempts || 1), 0);
    const accuracyPercentage = total > 0 ? Math.max(0, 100 - (total / totalAttempts * 100)) : 100;

    return {
      total,
      byType,
      topTopics: topicArray,
      trend,
      lastWeek,
      previousWeek,
      accuracyPercentage,
    };
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

  // Apply filters and sorting
  const filterAndSortMistakes = (studentMistakes: MistakeWithProfile[]) => {
    let filtered = studentMistakes;
    
    // Apply type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(m => m.type === filterType);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'topic':
          return a.topic.localeCompare(b.topic);
        case 'type':
          return a.type.localeCompare(b.type);
        default:
          return 0;
      }
    });

    return filtered;
  };

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
        <CardTitle>Student Mistakes & Analytics</CardTitle>
        <CardDescription>
          Comprehensive review of mistakes made by your linked students
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {Object.entries(mistakesByStudent).map(([studentId, { student, mistakes: studentMistakes }]) => {
          const stats = getStatistics(studentMistakes);
          const filteredMistakes = filterAndSortMistakes(studentMistakes);

          return (
            <div key={studentId} className="space-y-4">
              {/* Student Header */}
              <div className="flex items-center justify-between pb-3 border-b">
                <div>
                  <h3 className="font-semibold text-lg">{student?.full_name || 'Unknown Student'}</h3>
                  <p className="text-sm text-muted-foreground">{student?.email}</p>
                </div>
                <Badge variant="secondary" className="text-base px-3 py-1">
                  {stats.total} total mistakes
                </Badge>
              </div>

              {/* Statistics Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Mistake Type Breakdown */}
                <Card className="bg-background/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">By Type</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-sm">
                        <BookOpen className="h-3 w-3 text-blue-500" />
                        Quiz
                      </span>
                      <Badge variant="outline" className="text-blue-500 border-blue-500/20">
                        {stats.byType.quiz}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-sm">
                        <Calculator className="h-3 w-3 text-primary" />
                        Exercise
                      </span>
                      <Badge variant="outline" className="text-primary border-primary/20">
                        {stats.byType.exercise}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-sm">
                        <Target className="h-3 w-3 text-green-500" />
                        Practice
                      </span>
                      <Badge variant="outline" className="text-green-500 border-green-500/20">
                        {stats.byType.practice}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* Top Weak Topics */}
                <Card className="bg-background/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Weak Topics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {stats.topTopics.length > 0 ? (
                      stats.topTopics.map(([topic, count]) => (
                        <div key={topic} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="truncate max-w-[150px]">{topic}</span>
                            <span className="text-muted-foreground">{count}</span>
                          </div>
                          <Progress 
                            value={(count / stats.total) * 100} 
                            className="h-1.5"
                          />
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No data yet</p>
                    )}
                  </CardContent>
                </Card>

                {/* Trend Analysis */}
                <Card className="bg-background/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Trend (7 Days)</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">This week</span>
                      <Badge variant="outline">{stats.lastWeek}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Last week</span>
                      <Badge variant="outline">{stats.previousWeek}</Badge>
                    </div>
                    <div className="flex items-center gap-2 pt-2 border-t">
                      {stats.trend < 0 ? (
                        <>
                          <TrendingDown className="h-4 w-4 text-green-500" />
                          <span className="text-sm font-medium text-green-500">
                            {Math.abs(stats.trend).toFixed(0)}% improvement
                          </span>
                        </>
                      ) : stats.trend > 0 ? (
                        <>
                          <TrendingUp className="h-4 w-4 text-destructive" />
                          <span className="text-sm font-medium text-destructive">
                            {stats.trend.toFixed(0)}% more errors
                          </span>
                        </>
                      ) : (
                        <>
                          <Minus className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">No change</span>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Filters and Sort */}
              <div className="flex flex-wrap gap-3 items-center">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <Select value={filterType} onValueChange={(value) => setFilterType(value as FilterType)}>
                    <SelectTrigger className="w-[140px] h-9">
                      <SelectValue placeholder="Filter type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="quiz">Quiz</SelectItem>
                      <SelectItem value="exercise">Exercise</SelectItem>
                      <SelectItem value="practice">Practice</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortType)}>
                  <SelectTrigger className="w-[140px] h-9">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="topic">Topic</SelectItem>
                    <SelectItem value="type">Type</SelectItem>
                  </SelectContent>
                </Select>
                <Badge variant="secondary" className="ml-auto">
                  Showing {filteredMistakes.length} of {studentMistakes.length}
                </Badge>
              </div>

              {/* Mistakes Accordion */}
              {filteredMistakes.length > 0 ? (
                <Accordion type="single" collapsible className="w-full">
                  {filteredMistakes.map((mistake, index) => (
                    <AccordionItem key={mistake.id || index} value={`mistake-${index}`}>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3 text-left w-full">
                          <Badge className={getTypeColor(mistake.type)}>
                            <span className="flex items-center gap-1">
                              {getTypeIcon(mistake.type)}
                              {mistake.type}
                            </span>
                          </Badge>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{mistake.topic}</p>
                            <p className="text-xs text-muted-foreground">
                              {mistake.created_at && new Date(mistake.created_at).toLocaleDateString(undefined, {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                          {mistake.attempts && mistake.attempts > 1 && (
                            <Badge variant="outline" className="text-xs">
                              {mistake.attempts} attempts
                            </Badge>
                          )}
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-4 pt-3 px-1">
                          <div className="p-3 bg-muted/50 rounded-lg">
                            <p className="text-sm font-medium mb-2">Problem:</p>
                            <p className="text-sm leading-relaxed">{mistake.problem}</p>
                          </div>
                          
                          {mistake.user_answer && (
                            <div className="p-3 bg-destructive/5 border border-destructive/20 rounded-lg">
                              <p className="text-sm font-medium mb-2 text-destructive">Student's Answer:</p>
                              <p className="text-sm leading-relaxed">{mistake.user_answer}</p>
                            </div>
                          )}
                          
                          {mistake.correct_answer && (
                            <div className="p-3 bg-green-500/5 border border-green-500/20 rounded-lg">
                              <p className="text-sm font-medium mb-2 text-green-600">Correct Answer:</p>
                              <p className="text-sm leading-relaxed text-green-600">{mistake.correct_answer}</p>
                            </div>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              ) : (
                <p className="text-center text-sm text-muted-foreground py-8">
                  No mistakes match the current filter
                </p>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}