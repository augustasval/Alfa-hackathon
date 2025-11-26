import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SessionManager } from "@/lib/sessionManager";

interface LearningPlan {
  id: string;
  grade: string;
  topic_id: string;
  topic_name: string;
  test_date: string;
  created_at: string;
}

interface LearningTask {
  id: string;
  plan_id: string;
  day_number: number;
  scheduled_date: string;
  title: string;
  description: string;
  task_type: 'theory' | 'quiz' | 'practice' | 'review';
  is_completed: boolean;
  completed_at: string | null;
}

export const useLearningPlan = () => {
  const [plan, setPlan] = useState<LearningPlan | null>(null);
  const [tasks, setTasks] = useState<LearningTask[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPlan = async () => {
    setLoading(true);
    try {
      console.log('Current URL:', window.location.href);
      console.log('localStorage available:', typeof Storage !== 'undefined');
      
      const sessionId = SessionManager.getSession();
      if (!sessionId) {
        console.log('No session ID found in any storage location');
        setLoading(false);
        return;
      }

      console.log('Fetching plan for session:', sessionId.substring(0, 8) + '...');

      // Fetch the learning plan with retry logic for robustness
      let planData = null;
      let attempts = 0;
      const maxAttempts = 3;

      while (attempts < maxAttempts && !planData) {
        try {
          const { data, error } = await supabase
            .from('learning_plans')
            .select('*')
            .eq('session_id', sessionId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (error) throw error;
          planData = data;
          break;
        } catch (error) {
          attempts++;
          console.warn(`Plan fetch attempt ${attempts} failed:`, error);
          if (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }

      if (!planData) {
        console.log('No plan found for session');
        setLoading(false);
        return;
      }

      console.log('Plan found:', planData.id);
      setPlan(planData);

      // Fetch tasks for this plan
      const { data: tasksData, error: tasksError } = await supabase
        .from('learning_tasks')
        .select('*')
        .eq('plan_id', planData.id)
        .order('day_number', { ascending: true });

      if (tasksError) throw tasksError;

      console.log(`Found ${tasksData?.length || 0} tasks for plan`);
      setTasks((tasksData || []) as LearningTask[]);
    } catch (error) {
      console.error('Error fetching learning plan:', error);
      setPlan(null);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const markTaskComplete = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('learning_tasks')
        .update({ 
          is_completed: true, 
          completed_at: new Date().toISOString() 
        })
        .eq('id', taskId);

      if (error) throw error;

      // Update local state
      setTasks(prev => 
        prev.map(task => 
          task.id === taskId 
            ? { ...task, is_completed: true, completed_at: new Date().toISOString() }
            : task
        )
      );
    } catch (error) {
      console.error('Error marking task complete:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchPlan();
  }, []);

  return {
    plan,
    tasks,
    loading,
    refetch: fetchPlan,
    markTaskComplete
  };
};
