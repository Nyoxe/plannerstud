import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  Clock, 
  ChevronLeft, 
  RefreshCw, 
  ArrowRight, 
  Scissors,
  Flame,
  Target,
  CheckCircle2,
  LogOut
} from "lucide-react";
import { loadSchedule, saveSchedule, getThemePreference } from "@/lib/storage";
import { Schedule, Task } from "@/types/schedule";
import {
  getTodayIndex,
  getTodayDay,
  getTop3Tasks,
  postponeTask,
  splitTask,
  replanFromToday,
  updateTaskTimeSpent,
  getStreakData,
  updateStreak,
  migrateSchedule
} from "@/lib/today-utils";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";

export default function TodayPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [streak, setStreak] = useState(0);
  const [splitDialogOpen, setSplitDialogOpen] = useState(false);
  const [splitTaskData, setSplitTaskData] = useState<{ dayId: string; taskId: string; duration: number } | null>(null);
  const [splitDuration, setSplitDuration] = useState(15);

  useEffect(() => {
    const theme = getThemePreference();
    document.documentElement.classList.toggle("dark", theme === "dark");

    const loadData = async () => {
      setLoading(true);
      const saved = await loadSchedule();
      if (!saved) {
        navigate("/");
        return;
      }
      // Migrar dados antigos
      const migrated = migrateSchedule(saved);
      setSchedule(migrated);
      setLoading(false);
    };

    loadData();
    
    const { streak: currentStreak } = getStreakData();
    setStreak(currentStreak);
  }, [navigate]);

  if (loading || !schedule) return null;

  const todayIndex = getTodayIndex(schedule);
  const todayDay = getTodayDay(schedule);
  
  if (!todayDay) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">Nenhum dia encontrado no cronograma.</p>
            <Button onClick={() => navigate("/")} className="mt-4">
              Voltar ao início
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const top3Tasks = getTop3Tasks(todayDay.tasks);
  const completedCount = todayDay.tasks.filter(t => t.completed).length;
  const totalCount = todayDay.tasks.length;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const handleTaskToggle = async (taskId: string) => {
    const updatedDays = schedule.days.map(day => {
      if (day.id !== todayDay.id) return day;
      return {
        ...day,
        tasks: day.tasks.map(task =>
          task.id === taskId ? { ...task, completed: !task.completed } : task
        )
      };
    });

    const updatedSchedule = { ...schedule, days: updatedDays };
    setSchedule(updatedSchedule);
    await saveSchedule(updatedSchedule);

    // Atualizar streak se completou pelo menos uma tarefa
    const hasCompleted = updatedDays.find(d => d.id === todayDay.id)?.tasks.some(t => t.completed);
    if (hasCompleted) {
      const newStreak = updateStreak(true);
      setStreak(newStreak);
    }
  };

  const handlePostpone = async (taskId: string) => {
    if (todayIndex >= schedule.days.length - 1) {
      toast({
        title: "Não é possível adiar",
        description: "Este é o último dia do cronograma.",
        variant: "destructive"
      });
      return;
    }
    
    const updated = postponeTask(schedule, todayDay.id, taskId);
    setSchedule(updated);
    await saveSchedule(updated);
    toast({ title: "Tarefa adiada para amanhã" });
  };

  const handleSplitOpen = (taskId: string, duration: number) => {
    setSplitTaskData({ dayId: todayDay.id, taskId, duration });
    setSplitDuration(Math.floor(duration / 2));
    setSplitDialogOpen(true);
  };

  const handleSplitConfirm = async () => {
    if (!splitTaskData) return;
    
    if (splitDuration < 5 || splitDuration >= splitTaskData.duration) {
      toast({
        title: "Duração inválida",
        description: "A primeira parte deve ter entre 5 e " + (splitTaskData.duration - 5) + " minutos.",
        variant: "destructive"
      });
      return;
    }

    const updated = splitTask(schedule, splitTaskData.dayId, splitTaskData.taskId, splitDuration);
    setSchedule(updated);
    await saveSchedule(updated);
    setSplitDialogOpen(false);
    toast({ title: "Tarefa dividida em 2 partes" });
  };

  const handleTimeSpentChange = async (taskId: string, value: string) => {
    const timeSpent = parseInt(value, 10) || 0;
    const updated = updateTaskTimeSpent(schedule, todayDay.id, taskId, timeSpent);
    setSchedule(updated);
    await saveSchedule(updated);
  };

  const handleReplan = async () => {
    const updated = replanFromToday(schedule);
    setSchedule(updated);
    await saveSchedule(updated);
    toast({ title: "Cronograma replanejado", description: "Tarefas atrasadas foram movidas para hoje." });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  // Verificar se há tarefas atrasadas
  const hasBacklog = schedule.days.slice(0, todayIndex).some(day =>
    day.tasks.some(t => !t.completed)
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
        <div className="container max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => navigate("/schedule")}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              Cronograma
            </Button>
            
            <div className="flex items-center gap-3">
              {streak > 0 && (
                <Badge variant="secondary" className="gap-1">
                  <Flame className="h-3.5 w-3.5 text-orange-500" />
                  {streak} dias
                </Badge>
              )}
              
              {hasBacklog && (
                <Button variant="outline" size="sm" onClick={handleReplan}>
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Replanejar
                </Button>
              )}

              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Data e cronograma */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Calendar className="h-4 w-4" />
            <span>{format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}</span>
          </div>
          <h1 className="text-2xl font-bold">
            Dia {todayDay.dayNumber}: {todayDay.title}
          </h1>
          <p className="text-muted-foreground text-sm">{schedule.config.topic}</p>
        </div>

        {/* Progresso do dia */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Progresso de hoje</span>
              <span className="text-sm text-muted-foreground">{completedCount}/{totalCount}</span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </CardContent>
        </Card>

        {/* Top 3 */}
        {top3Tasks.length > 0 && (
          <Card className="border-primary/30 bg-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                Foco: Top 3 tarefas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {top3Tasks.map((task, idx) => (
                <div key={task.id} className="flex items-center gap-3 p-2 rounded-md bg-background">
                  <span className="text-xs font-bold text-primary">{idx + 1}</span>
                  <span className="text-sm flex-1">{task.title}</span>
                  {task.durationMin && (
                    <Badge variant="outline" className="text-xs">
                      {task.durationMin}min
                    </Badge>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Lista completa */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Todas as tarefas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {todayDay.tasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                onToggle={() => handleTaskToggle(task.id)}
                onPostpone={() => handlePostpone(task.id)}
                onSplit={() => handleSplitOpen(task.id, task.durationMin || 30)}
                onTimeSpentChange={(val) => handleTimeSpentChange(task.id, val)}
                isLastDay={todayIndex >= schedule.days.length - 1}
              />
            ))}
          </CardContent>
        </Card>
      </main>

      {/* Dialog para dividir tarefa */}
      <Dialog open={splitDialogOpen} onOpenChange={setSplitDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Dividir tarefa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Duração total: {splitTaskData?.duration || 30} min
            </p>
            <div className="space-y-2">
              <label className="text-sm font-medium">Duração da parte 1 (min)</label>
              <Input
                type="number"
                min={5}
                max={(splitTaskData?.duration || 30) - 5}
                value={splitDuration}
                onChange={(e) => setSplitDuration(parseInt(e.target.value, 10) || 0)}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Parte 2 terá: {(splitTaskData?.duration || 30) - splitDuration} min
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSplitDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSplitConfirm}>
              <Scissors className="h-4 w-4 mr-1" />
              Dividir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface TaskRowProps {
  task: Task;
  onToggle: () => void;
  onPostpone: () => void;
  onSplit: () => void;
  onTimeSpentChange: (value: string) => void;
  isLastDay: boolean;
}

function TaskRow({ task, onToggle, onPostpone, onSplit, onTimeSpentChange, isLastDay }: TaskRowProps) {
  return (
    <div className={`p-3 rounded-lg border transition-colors ${task.completed ? "bg-muted/50 opacity-60" : "bg-card"}`}>
      <div className="flex items-start gap-3">
        <Checkbox
          checked={task.completed}
          onCheckedChange={onToggle}
          className="mt-0.5 data-[state=checked]:bg-primary"
        />
        
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <span className={`text-sm ${task.completed ? "line-through text-muted-foreground" : ""}`}>
              {task.title}
            </span>
            {task.durationMin && (
              <Badge variant="outline" className="text-xs">
                <Clock className="h-3 w-3 mr-1" />
                {task.durationMin}min
              </Badge>
            )}
          </div>
          
          {/* Acceptance Criteria */}
          {task.acceptanceCriteria && task.acceptanceCriteria.length > 0 && (
            <div className="space-y-1">
              {task.acceptanceCriteria.map((criteria, idx) => (
                <div key={idx} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CheckCircle2 className="h-3 w-3" />
                  <span>{criteria}</span>
                </div>
              ))}
            </div>
          )}
          
          {/* Actions row */}
          <div className="flex items-center gap-2 pt-1">
            <div className="flex items-center gap-1">
              <Input
                type="number"
                placeholder="min"
                value={task.timeSpentMin || ""}
                onChange={(e) => onTimeSpentChange(e.target.value)}
                className="h-7 w-16 text-xs"
                min={0}
              />
              <span className="text-xs text-muted-foreground">gasto</span>
            </div>
            
            {!task.completed && (
              <>
                {!isLastDay && (
                  <Button variant="ghost" size="sm" onClick={onPostpone} className="h-7 text-xs">
                    <ArrowRight className="h-3 w-3 mr-1" />
                    Adiar
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={onSplit} className="h-7 text-xs">
                  <Scissors className="h-3 w-3 mr-1" />
                  Dividir
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
