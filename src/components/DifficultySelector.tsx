import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface DifficultySelectorProps {
  value: "easy" | "medium" | "hard";
  onChange: (value: "easy" | "medium" | "hard") => void;
}

export const DifficultySelector = ({ value, onChange }: DifficultySelectorProps) => {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Level:</span>
      <div className="flex gap-1">
        <Button
          variant={value === "easy" ? "default" : "outline"}
          size="sm"
          onClick={() => onChange("easy")}
          className="text-xs"
        >
          Easy
        </Button>
        <Button
          variant={value === "medium" ? "default" : "outline"}
          size="sm"
          onClick={() => onChange("medium")}
          className="text-xs"
        >
          Medium
        </Button>
        <Button
          variant={value === "hard" ? "default" : "outline"}
          size="sm"
          onClick={() => onChange("hard")}
          className="text-xs"
        >
          Hard
        </Button>
      </div>
    </div>
  );
};
