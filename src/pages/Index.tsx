import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ScheduleForm } from "@/components/ScheduleForm";
import { ScheduleCard } from "@/components/ScheduleCard";
import { ThemeToggle } from "@/components/ThemeToggle";
import { getAllSchedules, deleteSchedule, setActiveScheduleId, getThemePreference } from "@/lib/storage";
import { Schedule } from "@/types/schedule";
import { CalendarCheck, Sparkles, Plus, LogIn, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useSession } from "@/lib/useSession";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const navigate = useNavigate();
  const { session, loading } = useSession();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    const theme = getThemePreference();
    document.documentElement.classList.toggle("dark", theme === "dark");
    loadSchedules();
  }, []);

  const loadSchedules = () => {
    setSchedules(getAllSchedules());
  };

  const handleSelectSchedule = (id: string) => {
    setActiveScheduleId(id);
    navigate("/schedule");
  };

  const handleDeleteSchedule = (id: string) => {
    deleteSchedule(id);
    loadSchedules();
    setDeleteId(null);
  };

  const handleFormSuccess = () => {
    loadSchedules();
    setShowForm(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const hasSchedules = schedules.length > 0;

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
            {hasSchedules && !showForm && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowForm(true)}
                className="gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" />
                Novo cronograma
              </Button>
            )}
            <ThemeToggle />
            
            {!loading && (
              session ? (
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  <LogOut className="h-4 w-4" />
                </Button>
              ) : (
                <Link to="/login">
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <LogIn className="h-3.5 w-3.5" />
                    Entrar
                  </Button>
                </Link>
              )
            )}
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="container max-w-4xl mx-auto px-4 py-12">
        {!hasSchedules || showForm ? (
          <div className="flex flex-col items-center gap-8">
            {/* Hero */}
            <div className="text-center space-y-3 max-w-md">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                <Sparkles className="h-3 w-3" />
                Cronograma inteligente
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
                {hasSchedules ? "Criar novo cronograma" : "Planeje seus estudos de forma eficiente"}
              </h1>
              <p className="text-muted-foreground">
                {hasSchedules 
                  ? "Preencha os dados abaixo para gerar um novo plano de estudos."
                  : "Gere um cronograma personalizado em segundos. Acompanhe seu progresso e conquiste seus objetivos."
                }
              </p>
            </div>

            {/* Form */}
            <ScheduleForm onSuccess={handleFormSuccess} />

            {hasSchedules && (
              <Button variant="ghost" onClick={() => setShowForm(false)}>
                Voltar para meus cronogramas
              </Button>
            )}

            {/* Footer note */}
            {!hasSchedules && (
              <p className="text-xs text-muted-foreground text-center max-w-sm">
                Seus cronogramas são salvos localmente no navegador. 
                Você pode retomar de onde parou a qualquer momento.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold">Meus Cronogramas</h1>
              <p className="text-sm text-muted-foreground">
                Selecione um cronograma para continuar estudando
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {schedules.map((schedule) => (
                <ScheduleCard
                  key={schedule.id}
                  schedule={schedule}
                  onSelect={handleSelectSchedule}
                  onDelete={(id) => setDeleteId(id)}
                />
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir cronograma?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O cronograma e todo o progresso serão perdidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && handleDeleteSchedule(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Index;
