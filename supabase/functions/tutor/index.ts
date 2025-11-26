const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const body = await req.json();
    const { action } = body;

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    if (action === 'start_session') {
      const { topic, numProblems } = body;

      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [{
            role: 'user',
            content: `Generate ${numProblems} practice problems for the topic: ${topic}

The problems should:
- Start easy and gradually increase in difficulty
- Be appropriate for middle/high school students
- Include clear, specific questions
- Have definitive correct answers

Return ONLY a JSON array in this exact format, with no additional text:
[
  {"question": "Problem text here", "answer": "x=-2, x=-3"},
  {"question": "Problem text here", "answer": "x=-1, x=-4"}
]

The answer should be the simplified final answer the student should provide.`
          }],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('AI gateway error:', response.status, errorText);
        throw new Error('AI service error');
      }

      const data = await response.json();
      const responseText = data.choices?.[0]?.message?.content || '[]';
      const problems = JSON.parse(responseText);

      return new Response(
        JSON.stringify({ problems }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        },
      );
    }

    if (action === 'check_answer') {
      const { problem, studentAnswer, conversationHistory } = body;

      const conversationContext = conversationHistory && conversationHistory.length > 0
        ? `\n\nConversation history:\n${conversationHistory.map((msg: any) => `${msg.role}: ${msg.content}`).join('\n')}`
        : '';

      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [{
            role: 'user',
            content: `You are a patient math tutor checking a student's answer.

Problem: ${problem}
Student's answer: ${studentAnswer}${conversationContext}

First, determine if the student's answer is correct. Accept equivalent forms (e.g., "x=-2, x=-3" is same as "(-2, -3)" or "x=-2 or x=-3").

Then provide feedback:
- If CORRECT: Give enthusiastic praise and explain why it's right. Keep it brief (1-2 sentences).
- If INCORRECT: Don't give the answer! Instead:
  - Point out what they got wrong (if it's a minor error)
  - Ask a guiding question to help them think about their approach
  - Give a small hint about the next step
  - Be encouraging and supportive

Return ONLY a JSON object in this exact format:
{
  "isCorrect": true or false,
  "feedback": "Your encouraging feedback here"
}`
          }],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('AI gateway error:', response.status, errorText);
        throw new Error('AI service error');
      }

      const data = await response.json();
      const responseText = data.choices?.[0]?.message?.content || '{}';
      const result = JSON.parse(responseText);

      return new Response(
        JSON.stringify(result),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        },
      );
    }

    if (action === 'get_help') {
      const { helpType, problem, studentWork, conversationHistory } = body;

      const conversationContext = conversationHistory && conversationHistory.length > 0
        ? `\n\nConversation history:\n${conversationHistory.map((msg: any) => `${msg.role}: ${msg.content}`).join('\n')}`
        : '';

      const studentWorkContext = studentWork ? `\n\nStudent's current work: ${studentWork}` : '';

      let helpInstruction = '';
      if (helpType === 'hint') {
        helpInstruction = 'Give a helpful hint about the next step, but don\'t give away the answer. Be specific enough to be useful.';
      } else if (helpType === 'explain') {
        helpInstruction = 'Explain the concept or approach differently using simpler terms or a real-world analogy. Break it down into smaller steps.';
      } else if (helpType === 'stuck') {
        helpInstruction = 'The student is completely stuck. Ask them what they understand so far, and guide them to the very first step they need to take. Be extra encouraging.';
      }

      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [{
            role: 'user',
            content: `You are a patient math tutor helping a student who asked for help.

Problem: ${problem}${studentWorkContext}${conversationContext}

Help type requested: ${helpType}

${helpInstruction}

IMPORTANT: NEVER give the direct answer. Guide them to discover it themselves.

Keep your response conversational and encouraging (2-4 sentences).

Return ONLY a JSON object in this exact format:
{
  "guidance": "Your helpful guidance here"
}`
          }],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('AI gateway error:', response.status, errorText);
        throw new Error('AI service error');
      }

      const data = await response.json();
      const responseText = data.choices?.[0]?.message?.content || '{}';
      const result = JSON.parse(responseText);

      return new Response(
        JSON.stringify(result),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        },
      );
    }

    return new Response(
      JSON.stringify({ error: 'Unknown action' }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    );

  } catch (error) {
    console.error('Error in tutor function:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to process request', message: String(error) }),
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
