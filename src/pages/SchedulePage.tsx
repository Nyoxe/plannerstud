import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProgressHeader } from "@/components/ProgressHeader";
import { StudyCard } from "@/components/StudyCard";
import { CalendarGrid } from "@/components/CalendarGrid";
import { loadSchedule, saveSchedule, getThemePreference } from "@/lib/storage";
import { calculateProgress } from "@/lib/schedule-generator";
import { Schedule, EnrichedContent } from "@/types/schedule";
import { LayoutList, CalendarDays } from "lucide-react";

export default function SchedulePage() {
  const navigate = useNavigate();
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [activeTab, setActiveTab] = useState("timeline");
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize theme
    const theme = getThemePreference();
    document.documentElement.classList.toggle("dark", theme === "dark");

    // Load schedule
    const saved = loadSchedule();
    if (!saved) {
      navigate("/");
      return;
    }
    setSchedule(saved);
  }, [navigate]);

  const handleTaskToggle = (dayId: string, taskId: string) => {
    if (!schedule) return;

    const updatedDays = schedule.days.map((day) => {
      if (day.id !== dayId) return day;
      
      return {
        ...day,
        tasks: day.tasks.map((task) => 
          task.id === taskId ? { ...task, completed: !task.completed } : task
        ),
      };
    });

    const updatedSchedule = { ...schedule, days: updatedDays };
    setSchedule(updatedSchedule);
    saveSchedule(updatedSchedule);
  };

  const handleTimeChange = (dayId: string, time: string) => {
    if (!schedule) return;

    const updatedDays = schedule.days.map((day) =>
      day.id === dayId ? { ...day, scheduledTime: time } : day
    );

    const updatedSchedule = { ...schedule, days: updatedDays };
    setSchedule(updatedSchedule);
    saveSchedule(updatedSchedule);
  };

  const handleNotesChange = (dayId: string, notes: string) => {
    if (!schedule) return;

    const updatedDays = schedule.days.map((day) =>
      day.id === dayId ? { ...day, notes } : day
    );

    const updatedSchedule = { ...schedule, days: updatedDays };
    setSchedule(updatedSchedule);
    saveSchedule(updatedSchedule);
  };

  const handleEnrichContent = (dayId: string, content: EnrichedContent) => {
    if (!schedule) return;

    const updatedDays = schedule.days.map((day) =>
      day.id === dayId ? { ...day, enrichedContent: content } : day
    );

    const updatedSchedule = { ...schedule, days: updatedDays };
    setSchedule(updatedSchedule);
    saveSchedule(updatedSchedule);
  };

  const handleDayClick = (dayId: string) => {
    setActiveTab("timeline");
    // Scroll to the day card
    setTimeout(() => {
      const element = document.getElementById(`day-${dayId}`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 100);
  };

  const handleExportPDF = () => {
    window.print();
  };

  const handleExportPNG = () => {
    // TODO: Implement PNG export with html-to-image
    // Placeholder for future implementation
    console.log("PNG export - coming soon");
  };

  if (!schedule) {
    return null;
  }

  const progress = calculateProgress(schedule);

  return (
    <div className="min-h-screen bg-background">
      <ProgressHeader
        topic={schedule.config.topic}
        progress={progress}
        onExportPDF={handleExportPDF}
        onExportPNG={handleExportPNG}
      />

      <main className="container max-w-4xl mx-auto px-4 py-6" ref={contentRef}>
        {/* Print header - only visible when printing */}
        <div className="hidden print:block mb-6">
          <h1 className="text-2xl font-bold">{schedule.config.topic}</h1>
          <p className="text-sm text-muted-foreground">
            {schedule.config.totalDays} dias • {schedule.config.hoursPerDay}h por dia • 
            Progresso: {progress}%
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="no-print">
          <TabsList className="grid w-full max-w-xs grid-cols-2 mb-6">
            <TabsTrigger value="timeline" className="gap-2">
              <LayoutList className="h-4 w-4" />
              Timeline
            </TabsTrigger>
            <TabsTrigger value="calendar" className="gap-2">
              <CalendarDays className="h-4 w-4" />
              Calendário
            </TabsTrigger>
          </TabsList>

          <TabsContent value="timeline" className="space-y-4">
            {schedule.days.map((day) => (
              <div key={day.id} id={`day-${day.id}`}>
                <StudyCard
                  day={day}
                  topic={schedule.config.topic}
                  onTaskToggle={handleTaskToggle}
                  onTimeChange={handleTimeChange}
                  onNotesChange={handleNotesChange}
                  onEnrichContent={handleEnrichContent}
                />
              </div>
            ))}
          </TabsContent>

          <TabsContent value="calendar">
            <CalendarGrid days={schedule.days} onDayClick={handleDayClick} />
          </TabsContent>
        </Tabs>

        {/* Print content - shows timeline for PDF export */}
        <div className="hidden print:block space-y-4">
          {schedule.days.map((day) => (
            <div key={day.id}>
              <StudyCard
                day={day}
                topic={schedule.config.topic}
                onTaskToggle={handleTaskToggle}
                onTimeChange={handleTimeChange}
                onNotesChange={handleNotesChange}
                onEnrichContent={handleEnrichContent}
              />
            </div>
          ))}
        </div>
      </main>

      {/* 
        EXTENSÃO FUTURA - Supabase Integration:
        
        Para habilitar login e persistência na nuvem:
        1. Adicionar variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY
        2. Criar tabela 'schedules' com RLS
        3. Implementar auth via Supabase Auth
        4. Substituir localStorage por queries Supabase
        
        Verificar se vars existem:
        const supabaseEnabled = import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY;
        
        Se não existirem, continuar usando localStorage (comportamento atual).
      */}
    </div>
  );
}
