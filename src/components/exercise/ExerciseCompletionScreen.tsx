import { useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronRight, PartyPopper } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ExerciseCompletionScreenProps {
  completedCount: number;
  hasNextTask: boolean;
  onKeepLearning: () => void;
}

export const ExerciseCompletionScreen = ({
  completedCount,
  hasNextTask,
  onKeepLearning,
}: ExerciseCompletionScreenProps) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <Card className="p-6">
          <div className="text-center py-12 space-y-6">
            <div className="flex justify-center">
              <PartyPopper className="h-20 w-20 text-primary animate-bounce" />
            </div>
            <div>
              <h2 className="text-3xl font-bold mb-2">Excellent Work!</h2>
              <p className="text-muted-foreground text-lg">
                You've completed all 4 exercises.
              </p>
            </div>
            <Badge variant="secondary" className="text-lg px-4 py-2">
              {completedCount}/4 Exercises Completed ✓
            </Badge>
            <div className="flex flex-col gap-3 max-w-sm mx-auto pt-4">
              {hasNextTask && (
                <Button onClick={onKeepLearning} size="lg" className="w-full">
                  Keep Learning
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              )}
              <Button onClick={() => navigate('/')} variant="outline" size="lg" className="w-full">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
