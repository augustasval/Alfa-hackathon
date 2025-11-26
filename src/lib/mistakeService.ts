import { supabase } from '@/integrations/supabase/client';

export interface Mistake {
  id?: string;
  user_id?: string;
  type: 'quiz' | 'exercise' | 'practice';
  problem: string;
  topic: string;
  attempts?: number;
  user_answer?: string;
  correct_answer?: string;
  incorrect_steps?: number[];
  step_details?: any;
  created_at?: string;
}

export const mistakeService = {
  // Save a mistake to the database
  async saveMistake(mistake: Mistake): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('mistakes')
      .insert({
        user_id: user.id,
        type: mistake.type,
        problem: mistake.problem,
        topic: mistake.topic,
        attempts: mistake.attempts,
        user_answer: mistake.user_answer,
        correct_answer: mistake.correct_answer,
        incorrect_steps: mistake.incorrect_steps,
        step_details: mistake.step_details,
      });

    if (error) throw error;
  },

  // Get all mistakes for the current user
  async getMistakes(): Promise<Mistake[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('mistakes')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Get mistakes for linked students (parent view)
  async getLinkedStudentMistakes(parentId: string): Promise<Mistake[]> {
    const { data, error } = await supabase
      .from('mistakes')
      .select(`
        *,
        profiles!inner(id, full_name, email)
      `)
      .in('user_id', 
        supabase
          .from('students')
          .select('linked_profile_id')
          .eq('parent_id', parentId)
      );

    if (error) throw error;
    return data || [];
  },

  // Delete a mistake
  async deleteMistake(id: string): Promise<void> {
    const { error } = await supabase
      .from('mistakes')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Clear all mistakes for current user
  async clearAllMistakes(): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('mistakes')
      .delete()
      .eq('user_id', user.id);

    if (error) throw error;
  },
};
