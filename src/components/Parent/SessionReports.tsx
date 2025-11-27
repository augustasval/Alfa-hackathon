import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Clock, Target, HelpCircle, TrendingUp, AlertTriangle, Lightbulb } from 'lucide-react';

interface Student {
  id: string;
  name: string;
  grade_level: number;
}

interface SessionReportsProps {
  students: Student[];
}

interface ReportWithSession {
  id: string;
  session_id: string;
  student_id: string;
  parent_id: string;
  summary: string;
  accuracy_percentage: number | null;
  key_insights: string[] | null;
  recommendations: string[] | null;
  report_content: string;
  created_at: string;
  session: {
    id: string;
    topic: string;
    created_at: string;
    duration_minutes: number | null;
    completed: boolean;
    user_id: string;
  } | null;
}

export default function SessionReports({ students }: SessionReportsProps) {
  const [reports, setReports] = useState<ReportWithSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, []);

  async function loadReports() {
    try {
      const { data: reportsData, error: reportsError } = await supabase
        .from('session_reports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (reportsError) throw reportsError;

      if (reportsData && reportsData.length > 0) {
        const sessionIds = reportsData.map(r => r.session_id);
        const { data: sessionsData, error: sessionsError } = await supabase
          .from('tutoring_sessions')
          .select('*')
          .in('id', sessionIds);

        if (sessionsError) throw sessionsError;

        const reportsWithSessions = reportsData.map(report => ({
          ...report,
          session: sessionsData?.find(s => s.id === report.session_id)!
        }));

        setReports(reportsWithSessions);
      }
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          Recent Session Reports
        </CardTitle>
      </CardHeader>
      <CardContent>
        {reports.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <TrendingUp className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
            <p>No completed sessions yet.</p>
            <p className="text-sm mt-1">Reports will appear here after your student completes a session.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => {
              const student = students.find(s => s.id === report.student_id);
              const sessionDuration = report.session?.duration_minutes || 0;

              return (
                <div
                  key={report.id}
                  className="p-5 bg-muted/50 rounded-lg border border-border"
                >
                  {/* Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">{student?.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {report.session?.created_at && new Date(report.session.created_at).toLocaleDateString()} at{' '}
                        {report.session?.created_at && new Date(report.session.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Duration: {sessionDuration} minutes
                      </p>
                    </div>
                    <Badge className="bg-primary/10 text-primary hover:bg-primary/10">
                      {report.accuracy_percentage || 0}% accuracy
                    </Badge>
                  </div>

                  {/* Topic */}
                  <div className="mb-4">
                    <div className="text-sm font-medium text-muted-foreground mb-1">Topic:</div>
                    <div className="text-foreground">{report.session?.topic || 'General Practice'}</div>
                  </div>

                  {/* Summary */}
                  <div className="mb-4">
                    <div className="text-sm font-medium text-muted-foreground mb-1">Summary:</div>
                    <div className="text-sm text-foreground">{report.summary || report.report_content}</div>
                  </div>

                  {/* Key Insights */}
                  {report.key_insights && report.key_insights.length > 0 && (
                    <div className="mb-3">
                      <div className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1">
                        <Lightbulb className="w-3 h-3 text-yellow-500" />
                        Key Insights:
                      </div>
                      <ul className="text-sm text-muted-foreground list-disc list-inside">
                        {report.key_insights.map((insight, idx) => (
                          <li key={idx}>{insight}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Recommendations */}
                  {report.recommendations && report.recommendations.length > 0 && (
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-1">Recommendations:</div>
                      <ul className="text-sm text-muted-foreground list-disc list-inside">
                        {report.recommendations.map((rec, idx) => (
                          <li key={idx}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
