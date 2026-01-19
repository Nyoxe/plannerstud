import { Schedule } from "@/types/schedule";

const SCHEDULES_KEY = "study-schedules";
const ACTIVE_SCHEDULE_KEY = "active-schedule-id";
const THEME_KEY = "theme-preference";

const parseSchedule = (schedule: any): Schedule => {
  return {
    ...schedule,
    config: {
      ...schedule.config,
      createdAt: new Date(schedule.config.createdAt),
    },
    days: schedule.days.map((day: any) => ({
      ...day,
      date: new Date(day.date),
    })),
  };
};

export const getAllSchedules = (): Schedule[] => {
  try {
    const data = localStorage.getItem(SCHEDULES_KEY);
    if (!data) return [];
    
    const schedules = JSON.parse(data);
    return schedules.map(parseSchedule);
  } catch (error) {
    console.error("Failed to load schedules:", error);
    return [];
  }
};

export const saveSchedule = (schedule: Schedule): void => {
  try {
    const schedules = getAllSchedules();
    const existingIndex = schedules.findIndex(s => s.id === schedule.id);
    
    if (existingIndex >= 0) {
      schedules[existingIndex] = schedule;
    } else {
      schedules.unshift(schedule);
    }
    
    localStorage.setItem(SCHEDULES_KEY, JSON.stringify(schedules));
    setActiveScheduleId(schedule.id);
  } catch (error) {
    console.error("Failed to save schedule:", error);
  }
};

export const loadSchedule = (id?: string): Schedule | null => {
  try {
    const schedules = getAllSchedules();
    if (schedules.length === 0) return null;
    
    const targetId = id || getActiveScheduleId();
    if (targetId) {
      const found = schedules.find(s => s.id === targetId);
      if (found) return found;
    }
    
    return schedules[0];
  } catch (error) {
    console.error("Failed to load schedule:", error);
    return null;
  }
};

export const deleteSchedule = (id: string): void => {
  try {
    const schedules = getAllSchedules();
    const filtered = schedules.filter(s => s.id !== id);
    localStorage.setItem(SCHEDULES_KEY, JSON.stringify(filtered));
    
    if (getActiveScheduleId() === id) {
      setActiveScheduleId(filtered[0]?.id || null);
    }
  } catch (error) {
    console.error("Failed to delete schedule:", error);
  }
};

export const getActiveScheduleId = (): string | null => {
  try {
    return localStorage.getItem(ACTIVE_SCHEDULE_KEY);
  } catch {
    return null;
  }
};

export const setActiveScheduleId = (id: string | null): void => {
  try {
    if (id) {
      localStorage.setItem(ACTIVE_SCHEDULE_KEY, id);
    } else {
      localStorage.removeItem(ACTIVE_SCHEDULE_KEY);
    }
  } catch (error) {
    console.error("Failed to set active schedule:", error);
  }
};

export const clearSchedule = (): void => {
  try {
    localStorage.removeItem(SCHEDULES_KEY);
    localStorage.removeItem(ACTIVE_SCHEDULE_KEY);
  } catch (error) {
    console.error("Failed to clear schedules:", error);
  }
};

export const getThemePreference = (): "light" | "dark" => {
  try {
    const theme = localStorage.getItem(THEME_KEY);
    if (theme === "dark" || theme === "light") return theme;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  } catch {
    return "light";
  }
};

export const setThemePreference = (theme: "light" | "dark"): void => {
  try {
    localStorage.setItem(THEME_KEY, theme);
    document.documentElement.classList.toggle("dark", theme === "dark");
  } catch (error) {
    console.error("Failed to save theme:", error);
  }
};
