import { useState } from "react";
import { Calendar as CalendarIcon, Target, BookOpen, CheckCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Navigation } from "@/components/Navigation";
import { GradeTopicSelector, curriculumTopics } from "@/components/GradeTopicSelector";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

interface StudyTask {
  day: number;
  title: string;
  description: string;
  completed: boolean;
}

const LearningPlan = () => {
  const [selectedGrade, setSelectedGrade] = useState("9");
  const [selectedTopic, setSelectedTopic] = useState("9-quadratics");
  const [testDate, setTestDate] = useState<Date>();
  const [studyPlan, setStudyPlan] = useState<StudyTask[]>([]);

  const generateStudyPlan = () => {
    if (!testDate) {
      toast({
        title: "Please select a test date",
        description: "Choose when your test will be to generate a study plan.",
        variant: "destructive",
      });
      return;
    }

    const today = new Date();
    const daysUntilTest = Math.ceil((testDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilTest < 1) {
      toast({
        title: "Test date must be in the future",
        description: "Please select a future date for your test.",
        variant: "destructive",
      });
      return;
    }

    const topicName = curriculumTopics[selectedGrade]?.find((t) => t.id === selectedTopic)?.name || "this topic";

    const plan: StudyTask[] = [];

    // Day 1: Introduction
    plan.push({
      day: 1,
      title: "Understand the Basics",
      description: `Review core concepts of ${topicName}. Read through definitions and watch introductory examples.`,
      completed: false,
    });

    // Day 2: Step-by-step learning
    plan.push({
      day: 2,
      title: "Step-by-Step Learning",
      description: "Go through detailed step-by-step explanations. Take notes on each step and why it works.",
      completed: false,
    });

    // Day 3: Easy practice
    plan.push({
      day: 3,
      title: "Easy Practice Problems",
      description: "Start with easy problems to build confidence. Focus on understanding the process.",
      completed: false,
    });

    if (daysUntilTest >= 5) {
      // Day 4: Medium practice
      plan.push({
        day: 4,
        title: "Medium Difficulty Practice",
        description: "Move to medium difficulty problems. Challenge yourself but use hints when needed.",
        completed: false,
      });
    }

    if (daysUntilTest >= 7) {
      // Day 5: Review mistakes
      plan.push({
        day: 5,
        title: "Review Common Mistakes",
        description: "Look at your mistake tracker. Identify patterns and practice those problem types.",
        completed: false,
      });

      // Day 6: Hard practice
      plan.push({
        day: 6,
        title: "Advanced Problems",
        description: "Tackle hard difficulty problems. Work without hints first, then check solutions.",
        completed: false,
      });
    }

    if (daysUntilTest >= 10) {
      // Day 7: Mixed practice
      plan.push({
        day: 7,
        title: "Mixed Practice Session",
        description: "Practice a variety of problems at all difficulty levels without looking at solutions.",
        completed: false,
      });
    }

    // Second to last day: Final review
    const reviewDay = Math.max(plan.length + 1, daysUntilTest - 1);
    plan.push({
      day: reviewDay,
      title: "Comprehensive Review",
      description: "Review all key concepts, formulas, and problem-solving strategies. Make a summary sheet.",
      completed: false,
    });

    // Last day: Light practice
    plan.push({
      day: daysUntilTest,
      title: "Light Practice & Rest",
      description: "Do a few easy problems to stay sharp. Get good rest before your test. You've got this!",
      completed: false,
    });

    setStudyPlan(plan);
    toast({
      title: "Study plan generated!",
      description: `Created a ${daysUntilTest}-day plan for ${topicName}`,
    });
  };

  const toggleTaskComplete = (index: number) => {
    const newPlan = [...studyPlan];
    newPlan[index].completed = !newPlan[index].completed;
    setStudyPlan(newPlan);
  };

  const completedTasks = studyPlan.filter((task) => task.completed).length;
  const progressPercentage = studyPlan.length > 0 ? (completedTasks / studyPlan.length) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="flex flex-col gap-6">
          <Navigation />
          
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">Learning Plan</h1>
            <p className="text-muted-foreground">Plan your study schedule</p>
          </div>

        <div className="space-y-6">
          <GradeTopicSelector
            selectedGrade={selectedGrade}
            selectedTopic={selectedTopic}
            onGradeChange={setSelectedGrade}
            onTopicChange={setSelectedTopic}
          />

          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">When is your test?</h2>
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("w-full sm:w-[280px] justify-start text-left font-normal", !testDate && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {testDate ? format(testDate, "PPP") : <span>Pick a test date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={testDate}
                    onSelect={setTestDate}
                    disabled={(date) => date < new Date()}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
              <Button onClick={generateStudyPlan} className="w-full sm:w-auto">
                Generate Study Plan
              </Button>
            </div>
          </Card>

          {studyPlan.length > 0 && (
            <>
              <Card className="p-6 bg-primary/5 border-primary/20">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold">Your Progress</h3>
                  <Badge variant="secondary">
                    {completedTasks}/{studyPlan.length} tasks
                  </Badge>
                </div>
                <div className="w-full bg-muted rounded-full h-3">
                  <div
                    className="bg-primary h-3 rounded-full transition-all"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {testDate && `Test date: ${format(testDate, "MMMM d, yyyy")}`}
                </p>
              </Card>

              <Card className="p-6">
                <h2 className="text-xl font-bold mb-4">Study Schedule</h2>
                <div className="space-y-3">
                  {studyPlan.map((task, index) => (
                    <Card
                      key={index}
                      className={cn(
                        "p-4 transition-all cursor-pointer hover:shadow-md",
                        task.completed ? "bg-primary/5 border-primary/20" : "bg-accent/5 border-accent"
                      )}
                      onClick={() => toggleTaskComplete(index)}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={cn(
                            "flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center mt-1",
                            task.completed ? "bg-primary border-primary" : "border-muted-foreground"
                          )}
                        >
                          {task.completed && <CheckCircle className="h-4 w-4 text-primary-foreground" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className={cn("font-semibold", task.completed && "line-through text-muted-foreground")}>
                              {task.title}
                            </h3>
                            <Badge variant="outline">Day {task.day}</Badge>
                          </div>
                          <p className={cn("text-sm", task.completed ? "text-muted-foreground" : "text-foreground")}>
                            {task.description}
                          </p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </Card>

              <Card className="p-6 bg-accent/5 border-accent">
                <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Study Tips
                </h2>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <BookOpen className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Spend 30-45 minutes per study session for best retention</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <BookOpen className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Take short breaks between study sessions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <BookOpen className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Practice without looking at solutions first</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <BookOpen className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Review your mistake tracker regularly</span>
                  </li>
                </ul>
              </Card>
            </>
          )}
        </div>
        </div>
      </div>
    </div>
  );
};

export default LearningPlan;
