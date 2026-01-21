import { Schedule, StudyDay, Task } from "@/types/schedule";
import { isSameDay, isAfter, isBefore, startOfDay } from "date-fns";

const STREAK_KEY = "study-streak";
const LAST_COMPLETION_KEY = "last-completion-date";

interface StreakData {
  streak: number;
  lastCompletionDate: string | null;
}

export const getStreakData = (): StreakData => {
  try {
    const streak = parseInt(localStorage.getItem(STREAK_KEY) || "0", 10);
    const lastCompletionDate = localStorage.getItem(LAST_COMPLETION_KEY);
    return { streak, lastCompletionDate };
  } catch {
    return { streak: 0, lastCompletionDate: null };
  }
};

export const updateStreak = (completedToday: boolean): number => {
  const today = startOfDay(new Date());
  const { streak, lastCompletionDate } = getStreakData();
  
  if (!completedToday) return streak;
  
  let newStreak = streak;
  
  if (lastCompletionDate) {
    const lastDate = startOfDay(new Date(lastCompletionDate));
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (isSameDay(lastDate, today)) {
      // Já completou hoje, mantém streak
      return streak;
    } else if (isSameDay(lastDate, yesterday)) {
      // Completou ontem, incrementa streak
      newStreak = streak + 1;
    } else {
      // Quebrou o streak
      newStreak = 1;
    }
  } else {
    newStreak = 1;
  }
  
  localStorage.setItem(STREAK_KEY, newStreak.toString());
  localStorage.setItem(LAST_COMPLETION_KEY, today.toISOString());
  
  return newStreak;
};

export const getTodayIndex = (schedule: Schedule): number => {
  const today = startOfDay(new Date());
  
  // Procura o dia com a data de hoje
  const todayDayIndex = schedule.days.findIndex(day => 
    isSameDay(startOfDay(day.date), today)
  );
  
  if (todayDayIndex !== -1) return todayDayIndex;
  
  // Se não encontrar, pega o próximo dia não concluído
  const nextIncompleteIndex = schedule.days.findIndex(day => {
    const hasIncompleteTasks = day.tasks.some(t => !t.completed);
    return hasIncompleteTasks;
  });
  
  return nextIncompleteIndex !== -1 ? nextIncompleteIndex : 0;
};

export const getTodayDay = (schedule: Schedule): StudyDay | null => {
  const index = getTodayIndex(schedule);
  return schedule.days[index] || null;
};

export const getTop3Tasks = (tasks: Task[]): Task[] => {
  // Primeiro as não concluídas, ordenadas por durationMin (menor primeiro)
  const incompleteTasks = tasks
    .filter(t => !t.completed)
    .sort((a, b) => (a.durationMin || 30) - (b.durationMin || 30));
  
  return incompleteTasks.slice(0, 3);
};

export const postponeTask = (
  schedule: Schedule,
  dayId: string,
  taskId: string
): Schedule => {
  const dayIndex = schedule.days.findIndex(d => d.id === dayId);
  if (dayIndex === -1 || dayIndex >= schedule.days.length - 1) return schedule;
  
  const task = schedule.days[dayIndex].tasks.find(t => t.id === taskId);
  if (!task) return schedule;
  
  const updatedDays = schedule.days.map((day, idx) => {
    if (idx === dayIndex) {
      return {
        ...day,
        tasks: day.tasks.filter(t => t.id !== taskId)
      };
    }
    if (idx === dayIndex + 1) {
      return {
        ...day,
        tasks: [{ ...task, id: `task-${Date.now()}-postponed-${Math.random().toString(36).substr(2, 9)}` }, ...day.tasks]
      };
    }
    return day;
  });
  
  return { ...schedule, days: updatedDays };
};

export const splitTask = (
  schedule: Schedule,
  dayId: string,
  taskId: string,
  firstPartDuration: number
): Schedule => {
  const dayIndex = schedule.days.findIndex(d => d.id === dayId);
  if (dayIndex === -1) return schedule;
  
  const day = schedule.days[dayIndex];
  const taskIndex = day.tasks.findIndex(t => t.id === taskId);
  if (taskIndex === -1) return schedule;
  
  const originalTask = day.tasks[taskIndex];
  const originalDuration = originalTask.durationMin || 30;
  const secondPartDuration = Math.max(5, originalDuration - firstPartDuration);
  
  const task1: Task = {
    ...originalTask,
    id: `task-${Date.now()}-split1-${Math.random().toString(36).substr(2, 9)}`,
    title: `${originalTask.title} (parte 1)`,
    durationMin: firstPartDuration,
    completed: false,
  };
  
  const task2: Task = {
    ...originalTask,
    id: `task-${Date.now()}-split2-${Math.random().toString(36).substr(2, 9)}`,
    title: `${originalTask.title} (parte 2)`,
    durationMin: secondPartDuration,
    completed: false,
  };
  
  const updatedTasks = [
    ...day.tasks.slice(0, taskIndex),
    task1,
    task2,
    ...day.tasks.slice(taskIndex + 1)
  ];
  
  const updatedDays = schedule.days.map((d, idx) =>
    idx === dayIndex ? { ...d, tasks: updatedTasks } : d
  );
  
  return { ...schedule, days: updatedDays };
};

export const replanFromToday = (schedule: Schedule): Schedule => {
  const todayIndex = getTodayIndex(schedule);
  
  // Coletar backlog: tarefas não concluídas de dias anteriores
  const backlog: Task[] = [];
  
  for (let i = 0; i < todayIndex; i++) {
    const incompleteTasks = schedule.days[i].tasks.filter(t => !t.completed);
    backlog.push(...incompleteTasks.map(t => ({
      ...t,
      id: `task-${Date.now()}-replan-${Math.random().toString(36).substr(2, 9)}`
    })));
  }
  
  if (backlog.length === 0) return schedule;
  
  // Distribuir backlog nos dias a partir de hoje
  const updatedDays = schedule.days.map((day, idx) => {
    if (idx < todayIndex) {
      // Remover tarefas não concluídas de dias passados
      return {
        ...day,
        tasks: day.tasks.filter(t => t.completed)
      };
    }
    if (idx === todayIndex) {
      // Adicionar backlog ao início do dia de hoje
      return {
        ...day,
        tasks: [...backlog, ...day.tasks]
      };
    }
    return day;
  });
  
  return { ...schedule, days: updatedDays };
};

export const updateTaskTimeSpent = (
  schedule: Schedule,
  dayId: string,
  taskId: string,
  timeSpentMin: number
): Schedule => {
  const updatedDays = schedule.days.map(day => {
    if (day.id !== dayId) return day;
    return {
      ...day,
      tasks: day.tasks.map(task =>
        task.id === taskId ? { ...task, timeSpentMin } : task
      )
    };
  });
  
  return { ...schedule, days: updatedDays };
};

// Migrar tarefas antigas que não têm durationMin
export const migrateTask = (task: Task): Task => ({
  ...task,
  durationMin: task.durationMin ?? 30,
  acceptanceCriteria: task.acceptanceCriteria ?? [],
});

export const migrateSchedule = (schedule: Schedule): Schedule => ({
  ...schedule,
  days: schedule.days.map(day => ({
    ...day,
    tasks: day.tasks.map(migrateTask)
  }))
});
