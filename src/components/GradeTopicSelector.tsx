import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";

export interface CurriculumTopic {
  id: string;
  name: string;
  grade: string;
}

export const curriculumTopics: Record<string, CurriculumTopic[]> = {
  "9": [
    { id: "9-polynomials", name: "Polynomials", grade: "9" },
    { id: "9-quadratics", name: "Quadratic Equations", grade: "9" },
  ],
};

interface GradeTopicSelectorProps {
  selectedGrade: string;
  selectedTopic: string;
  onGradeChange: (grade: string) => void;
  onTopicChange: (topic: string) => void;
}

export const GradeTopicSelector = ({
  selectedGrade,
  selectedTopic,
  onGradeChange,
  onTopicChange,
}: GradeTopicSelectorProps) => {
  const topics = curriculumTopics[selectedGrade] || [];

  return (
    <Card className="p-4 bg-accent/5 border-accent">
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Grade Level</label>
          <Select value={selectedGrade} onValueChange={onGradeChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select grade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="9">Grade 9</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Curriculum Topic</label>
          <Select value={selectedTopic} onValueChange={onTopicChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select topic" />
            </SelectTrigger>
            <SelectContent>
              {topics.map((topic) => (
                <SelectItem key={topic.id} value={topic.id}>
                  {topic.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </Card>
  );
};
