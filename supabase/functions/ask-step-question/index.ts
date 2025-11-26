import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { stepContent, stepExplanation, stepExample, userQuestion, topic, gradeLevel, conversationHistory } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const exampleContext = stepExample ? `\n\nThe example provided is: ${stepExample}` : '';
    
    const gradeContext = gradeLevel ? `\n\nIMPORTANT: The student is in grade ${gradeLevel}. Adjust your explanations to be appropriate for this grade level. Use age-appropriate language and mathematical concepts they would understand at this level. Don't introduce concepts they haven't learned yet.` : '';

    const systemPrompt = `You are a helpful math tutor assistant. A student is working through a step-by-step problem solution and has a question about a specific step. 

The topic is: ${topic}
The step shows: ${stepContent}
The explanation provided was: ${stepExplanation}${exampleContext}${gradeContext}

CRITICAL: Keep your responses concise - maximum 5 sentences. Provide a clear, encouraging answer that helps them understand the concept better. Use proper mathematical notation with LaTeX format for equations (wrap inline math in $ symbols and display math in $$ symbols). Be patient and break down complex ideas into simple terms appropriate for their grade level.`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...(conversationHistory || []),
      { role: "user", content: userQuestion }
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: messages,
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI usage limit reached. Please contact support." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Error in ask-step-question:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
