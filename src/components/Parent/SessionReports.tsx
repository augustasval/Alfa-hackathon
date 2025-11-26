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
  key_insights: string | null;
  recommendations: string | null;
  created_at: string;
  session: {
    id: string;
    topic: string;
    started_at: string;
    duration_minutes: number;
    problems_attempted: number;
    problems_correct: number;
    questions_asked: number;
    struggle_areas: string | null;
  };
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
          <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-purple-500" />
          Recent Session Reports
        </CardTitle>
      </CardHeader>
      <CardContent>
        {reports.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <TrendingUp className="w-12 h-12 mx-auto mb-4 text-gray-300" />
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
                  className="p-5 bg-gray-50 rounded-lg border border-gray-200"
                >
                  {/* Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">{student?.name}</h3>
                      <p className="text-sm text-gray-500">
                        {report.session?.started_at && new Date(report.session.started_at).toLocaleDateString()} at{' '}
                        {report.session?.started_at && new Date(report.session.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Duration: {sessionDuration} minutes
                      </p>
                    </div>
                    <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">
                      {report.accuracy_percentage || 0}% accuracy
                    </Badge>
                  </div>

                  {/* Topic */}
                  <div className="mb-4">
                    <div className="text-sm font-medium text-gray-600 mb-1">Topic:</div>
                    <div className="text-gray-800">{report.session?.topic || 'General Practice'}</div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-3 mb-4 p-3 bg-white rounded-md border">
                    <div className="text-center">
                      <div className="text-xs text-gray-500 mb-1 flex items-center justify-center gap-1">
                        <Target className="w-3 h-3" />
                        Problems Attempted
                      </div>
                      <div className="text-xl font-bold">{report.session?.problems_attempted || 0}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-gray-500 mb-1">Solved Correctly</div>
                      <div className="text-xl font-bold text-green-600">{report.session?.problems_correct || 0}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-gray-500 mb-1 flex items-center justify-center gap-1">
                        <HelpCircle className="w-3 h-3" />
                        Questions Asked
                      </div>
                      <div className="text-xl font-bold">{report.session?.questions_asked || 0}</div>
                    </div>
                  </div>

                  {/* Struggle Areas */}
                  {report.session?.struggle_areas && (
                    <div className="mb-3">
                      <div className="text-sm font-medium text-gray-600 mb-1 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-red-500" />
                        Struggle Areas:
                      </div>
                      <div className="text-sm text-red-600">{report.session.struggle_areas}</div>
                    </div>
                  )}

                  {/* Key Insights */}
                  {report.key_insights && (
                    <div className="mb-3">
                      <div className="text-sm font-medium text-gray-600 mb-1 flex items-center gap-1">
                        <Lightbulb className="w-3 h-3 text-yellow-500" />
                        Key Insights:
                      </div>
                      <div className="text-sm text-gray-600">{report.key_insights}</div>
                    </div>
                  )}

                  {/* Recommendations */}
                  {report.recommendations && (
                    <div>
                      <div className="text-sm font-medium text-gray-600 mb-1">Recommendations:</div>
                      <div className="text-sm text-gray-600">{report.recommendations}</div>
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
