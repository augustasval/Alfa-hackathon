import { supabase } from "@/integrations/supabase/client";

export interface CustomExercise {
  id: string;
  user_id: string;
  topic: string;
  question: string;
  difficulty: string;
  created_at: string;
}

export const customExerciseService = {
  async saveExercise(topic: string, question: string, difficulty: string = 'medium'): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('custom_exercises')
      .insert({
        user_id: user.id,
        topic,
        question,
        difficulty,
      });

    if (error) throw error;
  },

  async getExercisesByTopic(topic: string): Promise<CustomExercise[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('custom_exercises')
      .select('*')
      .eq('user_id', user.id)
      .eq('topic', topic)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async deleteExercise(id: string): Promise<void> {
    const { error } = await supabase
      .from('custom_exercises')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};
