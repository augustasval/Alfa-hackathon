import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { grade, topicId, topicName, testDate, sessionId } = await req.json();
    
    console.log('Generating learning plan for:', { grade, topicId, topicName, testDate, sessionId });

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Calculate days until test
    const today = new Date();
    const test = new Date(testDate);
    const daysUntilTest = Math.ceil((test.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    console.log(`Days until test: ${daysUntilTest}`);

    if (daysUntilTest < 1) {
      throw new Error('Test date must be in the future');
    }

    // AI prompt to generate learning plan
    const systemPrompt = `You are an expert math educator creating personalized study plans. Generate a day-by-day learning plan that:
- Breaks down the topic into logical steps
- Follows the progression: theory → quiz → practice (easy) → practice (hard) → review
- Spaces out learning appropriately given available days
- Includes rest/review days before the exam
- Adapts to the student's grade level

Each task should have:
- A clear, actionable title
- A brief description of what to study/practice
- A task type: 'theory', 'quiz', 'practice', or 'review'`;

    const userPrompt = `Create a ${daysUntilTest}-day study plan for:
- Grade: ${grade}
- Topic: ${topicName}
- Test Date: ${testDate}

Generate tasks for each day leading up to the test. Make it engaging and achievable.`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'create_learning_plan',
            description: 'Generate a structured learning plan with daily tasks',
            parameters: {
              type: 'object',
              properties: {
                tasks: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      day_number: { type: 'integer', description: 'Day number (1 to N)' },
                      title: { type: 'string', description: 'Task title' },
                      description: { type: 'string', description: 'Task description' },
                      task_type: { type: 'string', enum: ['theory', 'quiz', 'practice', 'review'] }
                    },
                    required: ['day_number', 'title', 'description', 'task_type']
                  }
                }
              },
              required: ['tasks']
            }
          }
        }],
        tool_choice: { type: 'function', function: { name: 'create_learning_plan' } }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    console.log('AI response received');

    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error('No tool call in AI response');
    }

    const planData = JSON.parse(toolCall.function.arguments);
    const tasks = planData.tasks;

    console.log(`Generated ${tasks.length} tasks`);

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Insert learning plan
    const { data: plan, error: planError } = await supabase
      .from('learning_plans')
      .insert({
        session_id: sessionId,
        grade,
        topic_id: topicId,
        topic_name: topicName,
        test_date: testDate
      })
      .select()
      .single();

    if (planError) {
      console.error('Error creating plan:', planError);
      throw planError;
    }

    console.log('Plan created:', plan.id);

    // Insert tasks with scheduled dates
    const tasksToInsert = tasks.map((task: any) => {
      const scheduledDate = new Date(today);
      scheduledDate.setDate(today.getDate() + task.day_number - 1);
      
      return {
        plan_id: plan.id,
        day_number: task.day_number,
        scheduled_date: scheduledDate.toISOString().split('T')[0],
        title: task.title,
        description: task.description,
        task_type: task.task_type
      };
    });

    const { error: tasksError } = await supabase
      .from('learning_tasks')
      .insert(tasksToInsert);

    if (tasksError) {
      console.error('Error creating tasks:', tasksError);
      throw tasksError;
    }

    console.log('Tasks created successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        planId: plan.id,
        taskCount: tasks.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-learning-plan:', error);
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
