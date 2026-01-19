import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Clock, Calendar, FileText, ChevronDown, ChevronUp } from "lucide-react";
import { StudyDay, Task } from "@/types/schedule";
import { calculateDayProgress } from "@/lib/schedule-generator";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface StudyCardProps {
  day: StudyDay;
  onTaskToggle: (dayId: string, taskId: string) => void;
  onTimeChange: (dayId: string, time: string) => void;
  onNotesChange: (dayId: string, notes: string) => void;
}

export function StudyCard({ day, onTaskToggle, onTimeChange, onNotesChange }: StudyCardProps) {
  const [expanded, setExpanded] = useState(true);
  const { completed, total } = calculateDayProgress(day);
  const progressPercent = total > 0 ? (completed / total) * 100 : 0;
  const isComplete = completed === total;

  return (
    <Card className={`study-card animate-slide-up transition-all ${isComplete ? "border-success/50 bg-success/5" : ""}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              <span>{format(day.date, "EEEE, d 'de' MMMM", { locale: ptBR })}</span>
            </div>
            <CardTitle className="text-lg font-semibold">
              Dia {day.dayNumber}: {day.title}
            </CardTitle>
          </div>
          <button 
            onClick={() => setExpanded(!expanded)}
            className="p-1 rounded-md hover:bg-muted transition-colors"
            aria-label={expanded ? "Recolher" : "Expandir"}
          >
            {expanded ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        </div>

        <div className="flex items-center gap-4 pt-2">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            <span>{day.duration}h de estudo</span>
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>Progresso</span>
              <span className="font-medium">{completed}/{total}</span>
            </div>
            <Progress value={progressPercent} className="h-1.5 progress-bar" />
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {day.tasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onToggle={() => onTaskToggle(day.id, task.id)}
              />
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Clock className="h-3 w-3" />
                Horário (opcional)
              </label>
              <Input
                type="time"
                value={day.scheduledTime || ""}
                onChange={(e) => onTimeChange(day.id, e.target.value)}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <FileText className="h-3 w-3" />
                Notas
              </label>
              <Input
                type="text"
                placeholder="Adicionar nota..."
                value={day.notes || ""}
                onChange={(e) => onNotesChange(day.id, e.target.value)}
                className="h-8 text-sm"
              />
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

function TaskItem({ task, onToggle }: { task: Task; onToggle: () => void }) {
  return (
    <div 
      className={`flex items-center gap-3 p-2 rounded-md transition-colors hover:bg-muted/50 ${
        task.completed ? "opacity-60" : ""
      }`}
    >
      <Checkbox
        id={task.id}
        checked={task.completed}
        onCheckedChange={onToggle}
        className="data-[state=checked]:bg-success data-[state=checked]:border-success"
      />
      <label
        htmlFor={task.id}
        className={`text-sm flex-1 cursor-pointer ${
          task.completed ? "line-through text-muted-foreground" : ""
        }`}
      >
        {task.title}
      </label>
    </div>
  );
}
