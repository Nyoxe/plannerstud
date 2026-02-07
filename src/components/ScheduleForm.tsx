import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { BookOpen, Clock, Target, GraduationCap, Timer, Sparkles } from "lucide-react";
import { ScheduleConfig, Level, Goal, Schedule, EnrichedContent } from "@/types/schedule";
import { generateSchedule } from "@/lib/schedule-generator";
import { saveSchedule } from "@/lib/storage";
import { supabase } from "@/integrations/supabase/client";

interface ScheduleFormProps {
  onSuccess?: () => void;
}

export function ScheduleForm({ onSuccess }: ScheduleFormProps) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState("");
  
  const [formData, setFormData] = useState({
    topic: "",
    hoursPerDay: 2,
    totalDays: 7,
    level: "beginner" as Level,
    goal: "skill" as Goal,
    usePomodoro: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const enrichAllDays = async (schedule: Schedule): Promise<Schedule> => {
    const enrichedDays = [...schedule.days];
    const totalDays = enrichedDays.length;
    
    for (let i = 0; i < totalDays; i++) {
      const day = enrichedDays[i];
      setLoadingMessage(`Gerando conteúdo para "${day.title}"...`);
      setLoadingProgress(((i + 1) / totalDays) * 100);
      
      try {
        const { data, error } = await supabase.functions.invoke("enrich-content", {
          body: {
            topic: schedule.config.topic,
            subtopic: day.title,
            level: schedule.config.level,
          },
        });

        if (!error && data) {
          enrichedDays[i] = {
            ...day,
            enrichedContent: data as EnrichedContent,
          };
        }
      } catch (err) {
        console.error(`Failed to enrich day ${i + 1}:`, err);
        // Continue with other days even if one fails
      }
      
      // Small delay between requests to avoid rate limiting
      if (i < totalDays - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    return { ...schedule, days: enrichedDays };
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.topic.trim()) {
      newErrors.topic = "Informe o tema de estudo";
    }
    if (formData.hoursPerDay < 0.5 || formData.hoursPerDay > 12) {
      newErrors.hoursPerDay = "Entre 0.5 e 12 horas";
    }
    if (formData.totalDays < 1 || formData.totalDays > 90) {
      newErrors.totalDays = "Entre 1 e 90 dias";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    setLoadingProgress(0);
    setLoadingMessage("Criando estrutura do cronograma...");
    
    const config: ScheduleConfig = {
      topic: formData.topic.trim(),
      hoursPerDay: formData.hoursPerDay,
      totalDays: formData.totalDays,
      level: formData.level,
      goal: formData.goal,
      usePomodoro: formData.usePomodoro,
      createdAt: new Date(),
    };
    
    let schedule = generateSchedule(config);
    
    // Enrich all days with AI content
    setLoadingMessage("Gerando conteúdo com IA...");
    schedule = await enrichAllDays(schedule);
    
    await saveSchedule(schedule);
    
    if (onSuccess) {
      onSuccess();
    }
    navigate("/schedule");
  };

  if (isLoading) {
    return <LoadingState progress={loadingProgress} message={loadingMessage} />;
  }

  return (
    <Card className="w-full max-w-lg animate-fade-in">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Topic */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              Tema ou Assunto
            </label>
            <Input
              placeholder="Ex: React, Machine Learning, Inglês..."
              value={formData.topic}
              onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
              className={errors.topic ? "border-destructive" : ""}
            />
            {errors.topic && (
              <p className="text-xs text-destructive">{errors.topic}</p>
            )}
          </div>

          {/* Time inputs */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                Horas por dia
              </label>
              <Input
                type="number"
                min={0.5}
                max={12}
                step={0.5}
                value={formData.hoursPerDay}
                onChange={(e) => setFormData({ ...formData, hoursPerDay: parseFloat(e.target.value) || 0 })}
                className={errors.hoursPerDay ? "border-destructive" : ""}
              />
              {errors.hoursPerDay && (
                <p className="text-xs text-destructive">{errors.hoursPerDay}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                Quantidade de dias
              </label>
              <Input
                type="number"
                min={1}
                max={90}
                value={formData.totalDays}
                onChange={(e) => setFormData({ ...formData, totalDays: parseInt(e.target.value) || 0 })}
                className={errors.totalDays ? "border-destructive" : ""}
              />
              {errors.totalDays && (
                <p className="text-xs text-destructive">{errors.totalDays}</p>
              )}
            </div>
          </div>

          {/* Level */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-primary" />
              Seu nível
            </label>
            <Select
              value={formData.level}
              onValueChange={(value: Level) => setFormData({ ...formData, level: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner">Iniciante</SelectItem>
                <SelectItem value="intermediate">Intermediário</SelectItem>
                <SelectItem value="advanced">Avançado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Goal */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              Objetivo final
            </label>
            <Select
              value={formData.goal}
              onValueChange={(value: Goal) => setFormData({ ...formData, goal: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="exam">Prova ou Certificação</SelectItem>
                <SelectItem value="skill">Aprender nova habilidade</SelectItem>
                <SelectItem value="review">Revisão de conteúdo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Pomodoro */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <Checkbox
              id="pomodoro"
              checked={formData.usePomodoro}
              onCheckedChange={(checked) => 
                setFormData({ ...formData, usePomodoro: checked === true })
              }
            />
            <label htmlFor="pomodoro" className="flex items-center gap-2 cursor-pointer">
              <Timer className="h-4 w-4 text-primary" />
              <span className="text-sm">
                Usar técnica Pomodoro (blocos 25/5 min)
              </span>
            </label>
          </div>

          {/* Submit */}
          <Button type="submit" className="w-full gap-2" size="lg">
            <Sparkles className="h-4 w-4" />
            Gerar Cronograma
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

interface LoadingStateProps {
  progress: number;
  message: string;
}

function LoadingState({ progress, message }: LoadingStateProps) {
  return (
    <Card className="w-full max-w-lg animate-fade-in">
      <CardContent className="pt-6 space-y-4">
        <div className="text-center space-y-3 py-4">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 animate-pulse-soft">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">
              Gerando cronograma com IA
            </p>
            <p className="text-xs text-muted-foreground line-clamp-1 max-w-xs mx-auto">
              {message || "Preparando..."}
            </p>
          </div>
        </div>
        
        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-center text-muted-foreground">
            {Math.round(progress)}% concluído
          </p>
        </div>
        
        <div className="space-y-3 opacity-50">
          <Skeleton className="h-12 w-full" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
          </div>
          <Skeleton className="h-12 w-full" />
        </div>
      </CardContent>
    </Card>
  );
}
