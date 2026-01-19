import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Schedule } from "@/types/schedule";
import { calculateProgress } from "@/lib/schedule-generator";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarCheck, Clock, Trash2, BookOpen } from "lucide-react";

interface ScheduleCardProps {
  schedule: Schedule;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

export function ScheduleCard({ schedule, onSelect, onDelete }: ScheduleCardProps) {
  const progress = calculateProgress(schedule);
  const { config } = schedule;
  
  const levelLabels = {
    beginner: "Iniciante",
    intermediate: "Intermediário",
    advanced: "Avançado",
  };
  
  const goalLabels = {
    exam: "Prova",
    skill: "Nova habilidade",
    review: "Revisão",
  };

  return (
    <Card 
      className="group cursor-pointer transition-all hover:shadow-md hover:border-primary/50"
      onClick={() => onSelect(schedule.id)}
    >
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <BookOpen className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-sm truncate">{config.topic}</h3>
              <p className="text-xs text-muted-foreground">
                {format(config.createdAt, "d 'de' MMM, yyyy", { locale: ptBR })}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(schedule.id);
            }}
          >
            <Trash2 className="h-3.5 w-3.5 text-destructive" />
          </Button>
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <CalendarCheck className="h-3 w-3" />
            {config.totalDays} dias
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {config.hoursPerDay}h/dia
          </span>
          <span className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-medium">
            {levelLabels[config.level]}
          </span>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Progresso</span>
            <span className="font-medium">{progress}%</span>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>
      </CardContent>
    </Card>
  );
}
