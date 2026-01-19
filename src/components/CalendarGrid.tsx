import { StudyDay } from "@/types/schedule";
import { calculateDayProgress } from "@/lib/schedule-generator";
import { CheckCircle2 } from "lucide-react";

interface CalendarGridProps {
  days: StudyDay[];
  onDayClick: (dayId: string) => void;
}

export function CalendarGrid({ days, onDayClick }: CalendarGridProps) {
  const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  
  // Get the starting day of week for the first study day
  const firstDayOfWeek = days.length > 0 ? days[0].date.getDay() : 0;
  
  // Create empty cells for alignment
  const emptyCells = Array(firstDayOfWeek).fill(null);
  
  return (
    <div className="animate-fade-in">
      {/* Week header */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-center text-xs font-medium text-muted-foreground py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar cells */}
      <div className="grid grid-cols-7 gap-1">
        {emptyCells.map((_, index) => (
          <div key={`empty-${index}`} className="aspect-square" />
        ))}
        
        {days.map((day) => {
          const { completed, total } = calculateDayProgress(day);
          const isComplete = completed === total;
          const hasProgress = completed > 0;
          
          return (
            <button
              key={day.id}
              onClick={() => onDayClick(day.id)}
              className={`
                aspect-square rounded-lg border p-1 sm:p-2 flex flex-col items-center justify-center gap-0.5
                transition-all hover:border-primary hover:shadow-sm
                ${isComplete 
                  ? "bg-success/10 border-success/50" 
                  : hasProgress 
                    ? "bg-primary/5 border-primary/30" 
                    : "bg-card border-border"
                }
              `}
            >
              <span className="text-xs font-medium">Dia {day.dayNumber}</span>
              <div className="flex items-center gap-0.5">
                {isComplete ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                ) : (
                  <span className="text-[10px] text-muted-foreground">
                    {completed}/{total}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
