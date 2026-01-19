import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ScheduleForm } from "@/components/ScheduleForm";
import { ThemeToggle } from "@/components/ThemeToggle";
import { loadSchedule, getThemePreference } from "@/lib/storage";
import { CalendarCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Initialize theme
    const theme = getThemePreference();
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, []);

  const existingSchedule = loadSchedule();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <CalendarCheck className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold">StudyPlanner</span>
          </div>
          
          <div className="flex items-center gap-2">
            {existingSchedule && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/schedule")}
                className="gap-1.5"
              >
                <CalendarCheck className="h-3.5 w-3.5" />
                Ver cronograma
              </Button>
            )}
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="container max-w-4xl mx-auto px-4 py-12">
        <div className="flex flex-col items-center gap-8">
          {/* Hero */}
          <div className="text-center space-y-3 max-w-md">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
              <Sparkles className="h-3 w-3" />
              Cronograma inteligente
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Planeje seus estudos de forma eficiente
            </h1>
            <p className="text-muted-foreground">
              Gere um cronograma personalizado em segundos. Acompanhe seu progresso e conquiste seus objetivos.
            </p>
          </div>

          {/* Form */}
          <ScheduleForm />

          {/* Footer note */}
          <p className="text-xs text-muted-foreground text-center max-w-sm">
            Seu cronograma é salvo localmente no navegador. 
            Você pode retomar de onde parou a qualquer momento.
          </p>
        </div>
      </main>
    </div>
  );
};

export default Index;
