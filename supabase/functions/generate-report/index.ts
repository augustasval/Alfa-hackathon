import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface RequestBody {
  sessionId: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { sessionId }: RequestBody = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: session, error: sessionError } = await supabase
      .from('tutoring_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      throw new Error('Session not found');
    }

    const conversationText = Array.isArray(session.conversation_history)
      ? session.conversation_history.map((msg: { role: string; content: string }) =>
          `${msg.role === 'user' ? 'Student' : 'Tutor'}: ${msg.content}`
        ).join('\n\n')
      : '';

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'user',
            content: `Analyze this tutoring session and create a parent-friendly report.

Session details:
- Topic: ${session.topic}
- Duration: ${session.duration_minutes} minutes
- Problems attempted: ${session.problems_attempted}
- Problems correct: ${session.problems_correct}
- Questions asked: ${session.questions_asked}

Conversation:
${conversationText}

Generate:
1. A brief summary (2-3 sentences) of what was covered
2. Key insights about the student's understanding (1-2 sentences)
3. Specific recommendations for the next session (1-2 sentences)
4. Struggle areas if any were identified

Format as JSON:
{
  "summary": "...",
  "key_insights": "...",
  "recommendations": "...",
  "struggle_areas": "..."
}`
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error('AI service error');
    }

    const data = await response.json();
    const reportText = data.choices?.[0]?.message?.content || '{}';
    const reportData = JSON.parse(reportText);

    const accuracyPercentage = session.problems_attempted > 0
      ? Math.round((session.problems_correct / session.problems_attempted) * 100)
      : 0;

    const { error: reportError } = await supabase
      .from('session_reports')
      .insert({
        session_id: sessionId,
        student_id: session.student_id,
        parent_id: session.parent_id,
        summary: reportData.summary || 'Session completed successfully.',
        accuracy_percentage: accuracyPercentage,
        key_insights: reportData.key_insights || null,
        recommendations: reportData.recommendations || null,
      });

    if (reportError) {
      throw reportError;
    }

    if (reportData.struggle_areas) {
      await supabase
        .from('tutoring_sessions')
        .update({ struggle_areas: reportData.struggle_areas })
        .eq('id', sessionId);
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    );
  } catch (error) {
    console.error('Error generating report:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to generate report' }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    );
  }
});
