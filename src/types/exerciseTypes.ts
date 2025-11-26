export interface DetailedStep {
  step: string;
  explanation: string;
}

export interface Problem {
  id: string;
  question: string;
  answer: string;
  hint: string;
  difficulty: 'easy' | 'medium' | 'hard';
  detailedSolution: DetailedStep[];
}

export interface WebhookStep {
  id: number;
  latex: string;
  raw: string;
}

export interface ChatMessage {
  role: 'user' | 'ai';
  content: string;
}

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface DifficultyColors {
  bg: string;
  border: string;
  text: string;
  badge: string;
}

export const getDifficultyColor = (difficulty: string): DifficultyColors => {
  switch (difficulty) {
    case 'easy': return { bg: 'bg-green-500/20', border: 'border-green-500/50', text: 'text-green-500', badge: 'bg-green-500/20 text-green-400 border-green-500/50' };
    case 'medium': return { bg: 'bg-yellow-500/20', border: 'border-yellow-500/50', text: 'text-yellow-500', badge: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50' };
    case 'hard': return { bg: 'bg-red-500/20', border: 'border-red-500/50', text: 'text-red-500', badge: 'bg-red-500/20 text-red-400 border-red-500/50' };
    default: return { bg: 'bg-gray-500/20', border: 'border-gray-500/50', text: 'text-gray-500', badge: 'bg-gray-500/20 text-gray-400 border-gray-500/50' };
  }
};
