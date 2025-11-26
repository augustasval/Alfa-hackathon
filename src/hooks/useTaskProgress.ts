import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SessionManager } from "@/lib/sessionManager";

interface TaskProgress {
  id: string;
  task_id: string;
  session_id: string;
  quiz_passed: boolean;
  exercises_completed: number;
  current_phase: 'theory' | 'quiz' | 'exercises' | 'completed';
}

export const useTaskProgress = (taskId?: string) => {
  const [progress, setProgress] = useState<TaskProgress | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchProgress = useCallback(async (specificTaskId?: string) => {
    const targetTaskId = specificTaskId || taskId;
    if (!targetTaskId) return null;

    setLoading(true);
    try {
      const sessionId = SessionManager.getSession();
      if (!sessionId) return null;

      const { data, error } = await supabase
        .from('task_progress')
        .select('*')
        .eq('task_id', targetTaskId)
        .eq('session_id', sessionId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setProgress(data as TaskProgress);
        return data as TaskProgress;
      }

      // Create new progress record if none exists
      const { data: newProgress, error: insertError } = await supabase
        .from('task_progress')
        .insert({
          task_id: targetTaskId,
          session_id: sessionId,
          quiz_passed: false,
          exercises_completed: 0,
          current_phase: 'theory'
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setProgress(newProgress as TaskProgress);
      return newProgress as TaskProgress;
    } catch (error) {
      console.error('Error fetching task progress:', error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  const markQuizPassed = useCallback(async (specificTaskId?: string) => {
    const targetTaskId = specificTaskId || taskId;
    if (!targetTaskId) return;

    try {
      const sessionId = SessionManager.getSession();
      if (!sessionId) return;

      // First, ensure progress record exists
      const { data: existingProgress } = await supabase
        .from('task_progress')
        .select('*')
        .eq('task_id', targetTaskId)
        .eq('session_id', sessionId)
        .maybeSingle();

      if (!existingProgress) {
        // Create new record with quiz passed
        const { error } = await supabase
          .from('task_progress')
          .insert({
            task_id: targetTaskId,
            session_id: sessionId,
            quiz_passed: true,
            exercises_completed: 0,
            current_phase: 'exercises'
          });

        if (error) throw error;
      } else {
        // Update existing record
        const { error } = await supabase
          .from('task_progress')
          .update({ 
            quiz_passed: true, 
            current_phase: 'exercises',
            updated_at: new Date().toISOString()
          })
          .eq('task_id', targetTaskId)
          .eq('session_id', sessionId);

        if (error) throw error;
      }

      // Update local state
      setProgress(prev => prev ? { 
        ...prev, 
        quiz_passed: true, 
        current_phase: 'exercises' 
      } : null);
    } catch (error) {
      console.error('Error marking quiz passed:', error);
      throw error;
    }
  }, [taskId]);

  const incrementExercise = useCallback(async (specificTaskId?: string) => {
    const targetTaskId = specificTaskId || taskId;
    if (!targetTaskId) return;

    try {
      const sessionId = SessionManager.getSession();
      if (!sessionId) return;

      // First, ensure progress record exists
      const { data: currentProgress } = await supabase
        .from('task_progress')
        .select('exercises_completed, quiz_passed')
        .eq('task_id', targetTaskId)
        .eq('session_id', sessionId)
        .maybeSingle();

      let newCount: number;
      if (!currentProgress) {
        // Create new record if it doesn't exist
        newCount = 1;
        const isCompleted = newCount >= 4;
        
        const { error } = await supabase
          .from('task_progress')
          .insert({
            task_id: targetTaskId,
            session_id: sessionId,
            quiz_passed: true, // Assume quiz passed if we're doing exercises
            exercises_completed: newCount,
            current_phase: isCompleted ? 'completed' : 'exercises'
          });

        if (error) throw error;
      } else {
        // Update existing record
        newCount = currentProgress.exercises_completed + 1;
        const isCompleted = newCount >= 4;

        const { error } = await supabase
          .from('task_progress')
          .update({ 
            exercises_completed: newCount,
            current_phase: isCompleted ? 'completed' : 'exercises',
            updated_at: new Date().toISOString()
          })
          .eq('task_id', targetTaskId)
          .eq('session_id', sessionId);

        if (error) throw error;
      }

      // Update local state
      setProgress(prev => prev ? { 
        ...prev, 
        exercises_completed: newCount,
        current_phase: newCount >= 4 ? 'completed' : 'exercises'
      } : null);

      return newCount;
    } catch (error) {
      console.error('Error incrementing exercise:', error);
      throw error;
    }
  }, [taskId]);

  const getCurrentPhase = useCallback(() => {
    if (!progress) return 'theory';
    if (!progress.quiz_passed) return 'theory';
    if (progress.exercises_completed < 4) return 'exercises';
    return 'completed';
  }, [progress]);

  return {
    progress,
    loading,
    fetchProgress,
    markQuizPassed,
    incrementExercise,
    getCurrentPhase
  };
};
