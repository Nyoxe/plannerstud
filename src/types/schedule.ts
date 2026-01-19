export type Level = "beginner" | "intermediate" | "advanced";
export type Goal = "exam" | "skill" | "review";

export interface Task {
  id: string;
  title: string;
  completed: boolean;
}

export interface StudyDay {
  id: string;
  dayNumber: number;
  date: Date;
  title: string;
  duration: number; // hours
  tasks: Task[];
  scheduledTime?: string; // HH:MM format
  notes?: string;
}

export interface ScheduleConfig {
  topic: string;
  hoursPerDay: number;
  totalDays: number;
  level: Level;
  goal: Goal;
  usePomodoro: boolean;
  createdAt: Date;
}

export interface Schedule {
  config: ScheduleConfig;
  days: StudyDay[];
}
