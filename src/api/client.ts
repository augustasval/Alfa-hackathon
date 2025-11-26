const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

async function callEdgeFunction(functionName: string, body: object) {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/${functionName}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    throw new Error(`API call failed: ${response.statusText}`);
  }

  return response.json();
}

export const api = {
  // Tutor functions
  tutor: (data: {
    action: 'start_session' | 'check_answer' | 'get_help';
    topic?: string;
    numProblems?: number;
    problem?: string;
    studentAnswer?: string;
    conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
    helpType?: 'hint' | 'explain' | 'stuck';
    studentWork?: string;
  }) => callEdgeFunction('tutor', data),

  // Extract math problem from image (Vision API)
  extractProblem: (data: { image: string }) => callEdgeFunction('extract-problem', data),

  // Generate session report for parent
  generateReport: (data: { sessionId: string }) => callEdgeFunction('generate-report', data),

  // Existing math-mastery-ai functions
  generateLearningPlan: (data: {
    grade: string;
    topicId: string;
    topicName: string;
    testDate: string;
    sessionId: string;
  }) => callEdgeFunction('generate-learning-plan', data),

  askStepQuestion: (data: {
    stepContent: string;
    stepExplanation: string;
    stepExample: string;
    userQuestion: string;
    topic: string;
    gradeLevel: string;
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
  }) => {
    // This returns a streaming response
    return fetch(`${SUPABASE_URL}/functions/v1/ask-step-question`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });
  },

  generateQuiz: (data: {
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
    topic: string;
    gradeLevel: string;
  }) => callEdgeFunction('generate-quiz', data),

  generateGraphData: (data: {
    context: string;
    topic: string;
    gradeLevel: string;
    stepContent: string;
    stepExample: string;
  }) => callEdgeFunction('generate-graph-data', data),

  generateVisualExample: (data: {
    context: string;
    topic: string;
    gradeLevel: string;
  }) => callEdgeFunction('generate-visual-example', data),
};
