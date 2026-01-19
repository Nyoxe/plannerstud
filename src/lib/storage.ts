import { Schedule } from "@/types/schedule";

const SCHEDULE_KEY = "study-schedule";
const THEME_KEY = "theme-preference";

export const saveSchedule = (schedule: Schedule): void => {
  try {
    localStorage.setItem(SCHEDULE_KEY, JSON.stringify(schedule));
  } catch (error) {
    console.error("Failed to save schedule:", error);
  }
};

export const loadSchedule = (): Schedule | null => {
  try {
    const data = localStorage.getItem(SCHEDULE_KEY);
    if (!data) return null;
    
    const schedule = JSON.parse(data);
    // Convert date strings back to Date objects
    schedule.config.createdAt = new Date(schedule.config.createdAt);
    schedule.days = schedule.days.map((day: any) => ({
      ...day,
      date: new Date(day.date),
    }));
    
    return schedule;
  } catch (error) {
    console.error("Failed to load schedule:", error);
    return null;
  }
};

export const clearSchedule = (): void => {
  try {
    localStorage.removeItem(SCHEDULE_KEY);
  } catch (error) {
    console.error("Failed to clear schedule:", error);
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
