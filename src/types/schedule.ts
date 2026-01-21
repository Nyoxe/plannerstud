export type Level = "beginner" | "intermediate" | "advanced";
export type Goal = "exam" | "skill" | "review";

export interface Resource {
  title: string;
  url: string;
  type: "article" | "video" | "course" | "documentation";
}

export interface EnrichedContent {
  summary?: string;
  resources?: Resource[];
  isLoading?: boolean;
  error?: string;
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  durationMin?: number; // 5-180
  acceptanceCriteria?: string[]; // 1-3 items
  resources?: string[];
  timeSpentMin?: number; // tempo real gasto
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
  enrichedContent?: EnrichedContent;
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
  id: string;
  config: ScheduleConfig;
  days: StudyDay[];
}
