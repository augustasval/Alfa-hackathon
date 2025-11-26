import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { GradeTopicSelector, curriculumTopics } from "@/components/GradeTopicSelector";
import { Loader2, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getOrCreateSessionId } from "@/lib/session";
import { SessionManager } from "@/lib/sessionManager";

interface OnboardingModalProps {
  open: boolean;
  onComplete: () => void;
  existingPlan?: {
    grade: string;
    topicId: string;
    topicName: string;
  } | null;
  onClose?: () => void;
}

export const OnboardingModal = ({ open, onComplete, existingPlan, onClose }: OnboardingModalProps) => {
  const [step, setStep] = useState(1);
  const [selectedGrade, setSelectedGrade] = useState(existingPlan?.grade || "9");
  const [selectedTopicId, setSelectedTopicId] = useState(existingPlan?.topicId || "");
  const [testDate, setTestDate] = useState<Date>();
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const generateLocalPlan = async (sessionId: string, topic: any, daysUntilTest: number) => {
    // Create local fallback plan when Edge Function is not available
    const today = new Date();
    
    console.log('Starting local plan generation:', { sessionId: sessionId.substring(0, 8) + '...', topic: topic.name, daysUntilTest });
    
    // Validate inputs
    if (!sessionId || !topic || !topic.id || !topic.name || daysUntilTest < 1) {
      throw new Error('Invalid parameters for plan generation');
    }

    // Delete any existing plan for this session to avoid duplicates
    try {
      await supabase
        .from('learning_plans')
        .delete()
        .eq('session_id', sessionId);
    } catch (deleteError) {
      console.warn('Could not delete existing plans:', deleteError);
    }
    
    // Create learning plan in Supabase
    const planData = {
      session_id: sessionId,
      grade: selectedGrade,
      topic_id: topic.id,
      topic_name: topic.name,
      test_date: format(testDate!, 'yyyy-MM-dd')
    };

    console.log('Inserting plan data:', planData);

    // Try to insert plan directly to Supabase with retry logic
    let plan;
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        const { data, error } = await supabase
          .from('learning_plans')
          .insert(planData)
          .select()
          .single();

        if (error) throw error;
        plan = data;
        break;
      } catch (error) {
        attempts++;
        console.warn(`Plan insertion attempt ${attempts} failed:`, error);
        
        if (attempts >= maxAttempts) {
          throw new Error(`Failed to create learning plan after ${maxAttempts} attempts: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
        
        // Wait a bit before retrying
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    if (!plan || !plan.id) {
      throw new Error('Failed to create learning plan: No plan ID received');
    }

    console.log('Plan created successfully:', plan.id);

    // Generate topic-based daily study sessions
    const tasks = [];
    
    // Create topic-specific study sessions based on the selected topic
    const getTopicBasedTasks = (topicName: string, daysAvailable: number) => {
      const topicTasks = [];
      
      // Define subtopics based on the main topic
      let subtopics: string[] = [];
      
      if (topicName.toLowerCase().includes('quadratic')) {
        subtopics = [
          'Quadratic Equations Basics',
          'Factoring Quadratics',
          'Quadratic Formula',
          'Graphing Parabolas',
          'Word Problems with Quadratics',
          'Advanced Applications'
        ];
      } else if (topicName.toLowerCase().includes('polynomial')) {
        subtopics = [
          'Polynomial Basics',
          'Adding and Subtracting Polynomials',
          'Multiplying Polynomials',
          'Factoring Polynomials',
          'Polynomial Division',
          'Advanced Polynomial Problems'
        ];
      } else if (topicName.toLowerCase().includes('pythagorean')) {
        subtopics = [
          'Pythagorean Theorem Basics',
          'Finding Missing Sides',
          'Pythagorean Triples',
          'Word Problems',
          'Distance Formula'
        ];
      } else if (topicName.toLowerCase().includes('trigonometry') || topicName.toLowerCase().includes('trig')) {
        subtopics = [
          'Basic Trigonometric Ratios',
          'Sine, Cosine, and Tangent',
          'Special Angles',
          'Solving Right Triangles',
          'Trigonometric Applications',
          'Advanced Trigonometry'
        ];
      } else if (topicName.toLowerCase().includes('function')) {
        subtopics = [
          'Understanding Functions',
          'Function Notation',
          'Linear Functions',
          'Function Transformations',
          'Composite Functions'
        ];
      } else {
        // Generic subtopics for any topic
        subtopics = [
          `${topicName} Fundamentals`,
          `${topicName} Problem Solving`,
          `${topicName} Applications`,
          `Advanced ${topicName}`,
          `${topicName} Review`
        ];
      }
      
      // Distribute subtopics across available days
      const subtopicsToUse = Math.min(subtopics.length, Math.max(3, daysAvailable - 1)); // Leave 1 day for final review
      const selectedSubtopics = subtopics.slice(0, subtopicsToUse);
      
      return selectedSubtopics;
    };
    
    const subtopics = getTopicBasedTasks(topic.name, daysUntilTest);
    
    // Create daily tasks for each subtopic
    subtopics.forEach((subtopic, index) => {
      const taskDate = new Date(today);
      taskDate.setDate(today.getDate() + index);
      
      tasks.push({
        plan_id: plan.id,
        day_number: index + 1,
        scheduled_date: format(taskDate, 'yyyy-MM-dd'),
        title: subtopic,
        description: `Complete theory, practice problems, and quiz on ${subtopic}. Start with understanding the concepts, then practice with examples, and test your knowledge.`,
        task_type: 'practice' // Using 'practice' as it encompasses theory + practice + quiz
      });
    });

    // Add final comprehensive review day
    if (daysUntilTest > subtopics.length) {
      const reviewDate = new Date(testDate!);
      reviewDate.setDate(testDate!.getDate() - 1);
      tasks.push({
        plan_id: plan.id,
        day_number: daysUntilTest,
        scheduled_date: format(reviewDate, 'yyyy-MM-dd'),
        title: `${topic.name} - Final Review`,
        description: `Comprehensive review of all ${topic.name} concepts. Review notes, practice mixed problems, and prepare for your test.`,
        task_type: 'review'
      });
    }

    // Insert tasks with validation
    if (tasks.length === 0) {
      throw new Error('No tasks generated for the study plan');
    }

    console.log(`Inserting ${tasks.length} tasks for plan ${plan.id}`);

    // Insert tasks with retry logic
    let tasksInserted = false;
    let taskAttempts = 0;
    const maxTaskAttempts = 3;

    while (taskAttempts < maxTaskAttempts && !tasksInserted) {
      try {
        const { error: tasksError } = await supabase
          .from('learning_tasks')
          .insert(tasks);

        if (tasksError) throw tasksError;
        tasksInserted = true;
        console.log('Tasks inserted successfully');
      } catch (error) {
        taskAttempts++;
        console.warn(`Task insertion attempt ${taskAttempts} failed:`, error);
        
        if (taskAttempts >= maxTaskAttempts) {
          // Clean up the plan if task insertion fails completely
          try {
            await supabase
              .from('learning_plans')
              .delete()
              .eq('id', plan.id);
          } catch (cleanupError) {
            console.warn('Failed to cleanup plan after task insertion failure:', cleanupError);
          }
          
          throw new Error(`Failed to create study tasks after ${maxTaskAttempts} attempts: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
        
        // Wait a bit before retrying
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log('Local plan generation completed successfully');
    return { taskCount: tasks.length };
  };

  const handleGeneratePlan = async () => {
    // Enhanced validation
    if (!selectedGrade || !selectedTopicId || !testDate) {
      toast({
        title: "Missing information",
        description: "Please complete all steps before generating your plan.",
        variant: "destructive",
      });
      return;
    }

    // Validate test date is in the future
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const testDateOnly = new Date(testDate.getFullYear(), testDate.getMonth(), testDate.getDate());
    
    if (testDateOnly <= today) {
      toast({
        title: "Invalid test date",
        description: "Please select a future date for your test.",
        variant: "destructive",
      });
      return;
    }

    // Get topic name from ID
    const topic = curriculumTopics[selectedGrade]?.find(t => t.id === selectedTopicId);
    if (!topic) {
      toast({
        title: "Error",
        description: "Invalid topic selected. Please refresh and try again.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      // Get or create session ID with better error handling
      const sessionId = getOrCreateSessionId();

      // Check if a plan already exists for this session
      const { data: existingPlanData } = await supabase
        .from('learning_plans')
        .select('id')
        .eq('session_id', sessionId)
        .maybeSingle();

      if (existingPlanData) {
        // If user is switching plans (came from settings), delete old plan first
        if (existingPlan) {
          console.log('User switching plans - deleting old plan:', existingPlanData.id);
          
          // Delete old tasks first (foreign key constraint)
          await supabase
            .from('learning_tasks')
            .delete()
            .eq('plan_id', existingPlanData.id);
          
          // Delete old task progress
          await supabase
            .from('task_progress')
            .delete()
            .eq('session_id', sessionId);
          
          // Delete old plan
          await supabase
            .from('learning_plans')
            .delete()
            .eq('id', existingPlanData.id);
            
          console.log('Old plan deleted, proceeding with new plan creation');
        } else {
          // First-time user somehow has a plan - just redirect
          console.log('Plan already exists for this session, proceeding to home');
          toast({
            title: "Plan already exists!",
            description: "You already have a learning plan. Taking you to your dashboard.",
          });
          onComplete();
          return;
        }
      }

      const daysUntilTest = Math.ceil((testDateOnly.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysUntilTest < 1) {
        toast({
          title: "Invalid study period",
          description: "Please select a test date that's at least 1 day in the future.",
          variant: "destructive",
        });
        return;
      }

      console.log('Generating plan:', { 
        grade: selectedGrade, 
        topic: topic.name, 
        daysUntilTest, 
        sessionId: sessionId.substring(0, 8) + '...' 
      });

      let result;
      try {
        // Try the Edge Function first with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        const { data, error } = await supabase.functions.invoke('generate-learning-plan', {
          body: {
            grade: selectedGrade,
            topicId: topic.id,
            topicName: topic.name,
            testDate: format(testDate, 'yyyy-MM-dd'),
            sessionId
          },
          headers: {
            'Content-Type': 'application/json'
          }
        });

        clearTimeout(timeoutId);

        if (error) {
          console.log('Edge Function error:', error);
          throw error;
        }
        result = data;
        console.log('Edge Function succeeded:', result);
      } catch (error) {
        console.log('Edge Function failed, using local fallback:', error);
        // Fall back to local plan generation
        result = await generateLocalPlan(sessionId, topic, daysUntilTest);
        console.log('Local fallback completed:', result);
      }

      if (!result || !result.taskCount) {
        throw new Error('Failed to generate plan: Invalid result');
      }

      // Double-check that the plan was actually created by querying the database
      const { data: verifyPlan } = await supabase
        .from('learning_plans')
        .select('id')
        .eq('session_id', sessionId)
        .maybeSingle();

      if (!verifyPlan) {
        throw new Error('Plan creation could not be verified. Please try again.');
      }

      console.log('Plan verified successfully:', verifyPlan.id);

      // Store the session in multiple places for cross-domain access
      SessionManager.setSession(sessionId);
      
      // Also add session to URL for sharing across network/localhost
      const url = new URL(window.location.href);
      url.searchParams.set('session', sessionId);
      window.history.replaceState({}, '', url.toString());

      toast({
        title: "Learning plan created!",
        description: `Your personalized ${result.taskCount}-day study plan is ready.`,
      });

      // Wait a moment to ensure database operations are committed
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onComplete();
      
      // Navigate to learn page after completing onboarding
      window.location.href = '/learn';
    } catch (error) {
      console.error('Error generating plan:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast({
        title: "Error creating plan",
        description: `${errorMessage}. Please try again or contact support if the problem persists.`,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog 
      open={open} 
      onOpenChange={(isOpen) => {
        // Only allow closing if user has existing plan
        if (!isOpen && existingPlan && onClose) {
          onClose();
        }
      }}
    >
      <DialogContent 
        className={`max-w-2xl ${!existingPlan ? '[&>button]:hidden' : ''}`}
        onPointerDownOutside={(e) => {
          // Prevent closing if no existing plan
          if (!existingPlan) e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Sparkles className="h-6 w-6 text-primary" />
            Welcome to Your Math Journey
          </DialogTitle>
          <DialogDescription>
            Let's create a personalized learning plan to help you succeed on your upcoming test.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {step === 1 && (
            <div className="space-y-4">
              <div className="text-center space-y-2 py-4">
                <h3 className="text-lg font-semibold">Step 1: Choose Your Topic</h3>
                <p className="text-sm text-muted-foreground">
                  Select the grade level and curriculum topic you need to study.
                </p>
              </div>
              
              <GradeTopicSelector
                selectedGrade={selectedGrade}
                selectedTopic={selectedTopicId}
                onGradeChange={setSelectedGrade}
                onTopicChange={setSelectedTopicId}
              />

              <div className="flex justify-end">
                <Button
                  onClick={() => setStep(2)}
                  disabled={!selectedGrade || !selectedTopicId}
                  size="lg"
                >
                  Next Step
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="text-center space-y-2 py-4">
                <h3 className="text-lg font-semibold">Step 2: Set Your Test Date</h3>
                <p className="text-sm text-muted-foreground">
                  When is your exam? We'll create a study plan that gets you ready in time.
                </p>
              </div>

              <div className="flex justify-center">
                <Calendar
                  mode="single"
                  selected={testDate}
                  onSelect={setTestDate}
                  disabled={(date) => date < new Date()}
                  className="rounded-md border pointer-events-auto"
                />
              </div>

              {testDate && (
                <div className="text-center text-sm text-muted-foreground">
                  Test date: {format(testDate, 'MMMM d, yyyy')}
                </div>
              )}

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button
                  onClick={() => setStep(3)}
                  disabled={!testDate}
                  size="lg"
                >
                  Next Step
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="text-center space-y-2 py-4">
                <h3 className="text-lg font-semibold">Step 3: Generate Your Plan</h3>
                <p className="text-sm text-muted-foreground">
                  Review your selections and let AI create your personalized study schedule.
                </p>
              </div>

              <div className="bg-secondary/50 rounded-lg p-6 space-y-3">
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Grade & Topic:</span>
                  <p className="text-lg font-semibold">
                    {selectedGrade} - {curriculumTopics[selectedGrade]?.find(t => t.id === selectedTopicId)?.name}
                  </p>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Test Date:</span>
                  <p className="text-lg font-semibold">{testDate ? format(testDate, 'MMMM d, yyyy') : ''}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Days to prepare:</span>
                  <p className="text-lg font-semibold">
                    {testDate ? Math.ceil((testDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 0} days
                  </p>
                </div>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(2)} disabled={isGenerating}>
                  Back
                </Button>
                <Button
                  onClick={handleGeneratePlan}
                  disabled={isGenerating}
                  size="lg"
                  className="gap-2"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generating Plan...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Generate My Plan
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
