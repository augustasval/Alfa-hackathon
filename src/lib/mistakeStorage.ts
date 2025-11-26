export interface MistakeRecord {
  id: string;
  type: 'quiz' | 'exercise' | 'practice';
  problem: string;
  topic: string;
  date: string;
  attempts?: number;
  userAnswer?: string;
  correctAnswer?: string;
  incorrectSteps?: number[];
  stepDetails?: { step: string; explanation: string }[];
}

const STORAGE_KEY = 'mathMistakes';

export const mistakeStorage = {
  // Get all mistakes
  getAll(): MistakeRecord[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading mistakes:', error);
      return [];
    }
  },

  // Add a new mistake
  add(mistake: Omit<MistakeRecord, 'id' | 'date'>): void {
    try {
      const mistakes = this.getAll();
      const newMistake: MistakeRecord = {
        ...mistake,
        id: `mistake-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        date: new Date().toISOString(),
      };
      mistakes.push(newMistake);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mistakes));
    } catch (error) {
      console.error('Error saving mistake:', error);
    }
  },

  // Delete a mistake by ID
  delete(id: string): void {
    try {
      const mistakes = this.getAll();
      const filtered = mistakes.filter(m => m.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error deleting mistake:', error);
    }
  },

  // Clear all mistakes
  clear(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing mistakes:', error);
    }
  },

  // Get mistakes by type
  getByType(type: MistakeRecord['type']): MistakeRecord[] {
    return this.getAll().filter(m => m.type === type);
  },

  // Get mistakes by topic
  getByTopic(topic: string): MistakeRecord[] {
    return this.getAll().filter(m => m.topic === topic);
  },

  // Get mistakes from last N days
  getFromLastDays(days: number): MistakeRecord[] {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    return this.getAll().filter(m => new Date(m.date) >= cutoffDate);
  },

  // Calculate improvement rate (comparing last 7 days to previous 7 days)
  getImprovementRate(): { thisWeek: number; lastWeek: number; percentChange: number } {
    const last7Days = this.getFromLastDays(7);
    const previous7Days = this.getAll().filter(m => {
      const date = new Date(m.date);
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 7);
      const previousCutoff = new Date();
      previousCutoff.setDate(previousCutoff.getDate() - 14);
      return date >= previousCutoff && date < cutoff;
    });

    const thisWeek = last7Days.length;
    const lastWeek = previous7Days.length;
    const percentChange = lastWeek === 0 ? 0 : ((thisWeek - lastWeek) / lastWeek) * 100;

    return { thisWeek, lastWeek, percentChange: -percentChange }; // Negative because decrease is good
  },

  // Get daily mistake counts for chart
  getDailyMistakeCounts(days: number): { date: string; quiz: number; exercise: number; practice: number }[] {
    const mistakes = this.getFromLastDays(days);
    const dailyMap = new Map<string, { quiz: number; exercise: number; practice: number }>();

    // Initialize all days with 0
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      dailyMap.set(dateStr, { quiz: 0, exercise: 0, practice: 0 });
    }

    // Count mistakes per day per type
    mistakes.forEach(m => {
      const dateStr = new Date(m.date).toISOString().split('T')[0];
      const counts = dailyMap.get(dateStr);
      if (counts) {
        counts[m.type]++;
      }
    });

    // Convert to array and sort by date
    return Array.from(dailyMap.entries())
      .map(([date, counts]) => ({ date, ...counts }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  },

  // Analyze exercise patterns
  analyzeExercisePatterns(): {
    commonStepKeywords: { keyword: string; count: number }[];
    mostProblematicStepPosition: number | null;
    stepPositionCounts: Record<number, number>;
  } {
    const exerciseMistakes = this.getByType('exercise');
    const keywordCounts = new Map<string, number>();
    const stepPositionCounts: Record<number, number> = {};

    // Common mathematical operation keywords
    const keywords = ['factor', 'distribute', 'simplify', 'sign', 'multiply', 'divide', 'exponent', 'combine'];

    exerciseMistakes.forEach(mistake => {
      if (mistake.stepDetails) {
        mistake.stepDetails.forEach((detail, idx) => {
          // Count step positions
          const stepNum = mistake.incorrectSteps?.[idx] ?? idx;
          stepPositionCounts[stepNum] = (stepPositionCounts[stepNum] || 0) + 1;

          // Count keywords in explanations
          const text = (detail.step + ' ' + detail.explanation).toLowerCase();
          keywords.forEach(keyword => {
            if (text.includes(keyword)) {
              keywordCounts.set(keyword, (keywordCounts.get(keyword) || 0) + 1);
            }
          });
        });
      }
    });

    // Find most common keywords
    const commonStepKeywords = Array.from(keywordCounts.entries())
      .map(([keyword, count]) => ({ keyword, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    // Find most problematic step position
    const stepPositions = Object.entries(stepPositionCounts).map(([pos, count]) => ({ pos: parseInt(pos), count }));
    const mostProblematicStepPosition = stepPositions.length > 0
      ? stepPositions.sort((a, b) => b.count - a.count)[0].pos
      : null;

    return { commonStepKeywords, mostProblematicStepPosition, stepPositionCounts };
  },

  // Get days since last mistake (streak)
  getDaysSinceLastMistake(): number {
    const mistakes = this.getAll();
    if (mistakes.length === 0) return 0;

    const sortedMistakes = mistakes.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const lastMistakeDate = new Date(sortedMistakes[0].date);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - lastMistakeDate.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  },
};
