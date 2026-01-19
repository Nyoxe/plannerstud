import { Schedule, ScheduleConfig, StudyDay, Task, Level } from "@/types/schedule";

// Template base adjustable by level
const getSubtopics = (topic: string, level: Level, totalDays: number): string[] => {
  const baseTemplates: Record<Level, string[]> = {
    beginner: [
      `Introdução a ${topic}`,
      `Conceitos fundamentais`,
      `Terminologia essencial`,
      `Primeiros passos práticos`,
      `Fundamentos básicos`,
      `Exercícios iniciais`,
      `Prática guiada`,
      `Consolidação do básico`,
      `Revisão dos fundamentos`,
      `Preparação para próximo nível`,
    ],
    intermediate: [
      `Visão geral e objetivos de ${topic}`,
      `Conceitos intermediários`,
      `Técnicas avançadas básicas`,
      `Prática aplicada`,
      `Resolução de problemas`,
      `Projeto prático 1`,
      `Análise de casos`,
      `Projeto prático 2`,
      `Integração de conhecimentos`,
      `Revisão e consolidação`,
    ],
    advanced: [
      `Domínio avançado de ${topic}`,
      `Técnicas especializadas`,
      `Otimização e performance`,
      `Casos complexos`,
      `Projeto avançado`,
      `Pesquisa e inovação`,
      `Aplicações reais`,
      `Mentoria e ensino`,
      `Revisão profunda`,
      `Avaliação final`,
    ],
  };

  const templates = baseTemplates[level];
  const result: string[] = [];
  
  for (let i = 0; i < totalDays; i++) {
    result.push(templates[i % templates.length]);
  }
  
  return result;
};

const generateTasks = (
  subtopic: string,
  hoursPerDay: number,
  level: Level,
  usePomodoro: boolean
): Task[] => {
  const baseTaskTemplates: Record<Level, string[]> = {
    beginner: [
      "Ler material introdutório",
      "Assistir vídeo explicativo",
      "Fazer anotações principais",
      "Resolver exercícios básicos",
      "Revisar conceitos",
      "Praticar com exemplos",
    ],
    intermediate: [
      "Estudar teoria avançada",
      "Analisar exemplos práticos",
      "Resolver problemas moderados",
      "Criar resumo do tópico",
      "Aplicar em mini-projeto",
      "Revisar e refinar",
    ],
    advanced: [
      "Pesquisar material especializado",
      "Analisar casos complexos",
      "Desenvolver solução original",
      "Documentar aprendizados",
      "Aplicar em projeto real",
      "Avaliar e otimizar",
    ],
  };

  const templates = baseTaskTemplates[level];
  const taskCount = Math.min(Math.max(3, Math.floor(hoursPerDay * 1.5)), 6);
  
  const tasks: Task[] = [];
  
  for (let i = 0; i < taskCount; i++) {
    const baseTask = templates[i % templates.length];
    const taskTitle = usePomodoro 
      ? `${baseTask} (25min + 5min pausa)`
      : baseTask;
    
    tasks.push({
      id: `task-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 9)}`,
      title: taskTitle,
      completed: false,
    });
  }

  return tasks;
};

export const generateSchedule = (config: ScheduleConfig): Schedule => {
  const subtopics = getSubtopics(config.topic, config.level, config.totalDays);
  const startDate = new Date();
  
  const days: StudyDay[] = [];

  for (let i = 0; i < config.totalDays; i++) {
    const dayDate = new Date(startDate);
    dayDate.setDate(startDate.getDate() + i);
    
    const subtopic = subtopics[i];
    
    days.push({
      id: `day-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 9)}`,
      dayNumber: i + 1,
      date: dayDate,
      title: subtopic,
      duration: config.hoursPerDay,
      tasks: generateTasks(subtopic, config.hoursPerDay, config.level, config.usePomodoro),
      scheduledTime: undefined,
      notes: undefined,
    });
  }

  return {
    id: `schedule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    config,
    days,
  };
};

export const calculateProgress = (schedule: Schedule): number => {
  const totalTasks = schedule.days.reduce((acc, day) => acc + day.tasks.length, 0);
  const completedTasks = schedule.days.reduce(
    (acc, day) => acc + day.tasks.filter(t => t.completed).length, 
    0
  );
  
  if (totalTasks === 0) return 0;
  return Math.round((completedTasks / totalTasks) * 100);
};

export const calculateDayProgress = (day: StudyDay): { completed: number; total: number } => {
  const total = day.tasks.length;
  const completed = day.tasks.filter(t => t.completed).length;
  return { completed, total };
};
