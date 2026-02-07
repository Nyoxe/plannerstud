import { Schedule } from "@/types/schedule";
import { supabase } from "@/integrations/supabase/client";

const ACTIVE_SCHEDULE_KEY = "active-schedule-id";
const THEME_KEY = "theme-preference";
const LOCAL_SCHEDULES_KEY = "study-schedules";

// Helper to parse schedule from database format
const parseScheduleFromDB = (dbSchedule: any): Schedule => {
  return {
    id: dbSchedule.id,
    config: {
      ...dbSchedule.config,
      createdAt: new Date(dbSchedule.config.createdAt),
    },
    days: dbSchedule.days.map((day: any) => ({
      ...day,
      date: new Date(day.date),
    })),
  };
};

// Helper to prepare schedule for database
const prepareScheduleForDB = (schedule: Schedule) => {
  return {
    id: schedule.id,
    config: {
      ...schedule.config,
      createdAt: schedule.config.createdAt.toISOString(),
    },
    days: schedule.days.map((day) => ({
      ...day,
      date: day.date.toISOString(),
    })),
  };
};

// Get all schedules from Supabase
export const getAllSchedules = async (): Promise<Schedule[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from("schedules")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch schedules:", error);
      return [];
    }

    return (data || []).map(parseScheduleFromDB);
  } catch (error) {
    console.error("Failed to load schedules:", error);
    return [];
  }
};

// Save schedule to Supabase
export const saveSchedule = async (schedule: Schedule): Promise<void> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error("User not authenticated");
      return;
    }

    const prepared = prepareScheduleForDB(schedule);

    // Check if schedule exists
    const { data: existing } = await supabase
      .from("schedules")
      .select("id")
      .eq("id", prepared.id)
      .single();

    if (existing) {
      // Update existing schedule
      const { error } = await supabase
        .from("schedules")
        .update({
          config: prepared.config as any,
          days: prepared.days as any,
        })
        .eq("id", prepared.id);

      if (error) {
        console.error("Failed to update schedule:", error);
        return;
      }
    } else {
      // Insert new schedule
      const { error } = await supabase
        .from("schedules")
        .insert({
          id: prepared.id,
          user_id: user.id,
          config: prepared.config as any,
          days: prepared.days as any,
        });

      if (error) {
        console.error("Failed to insert schedule:", error);
        return;
      }
    }

    setActiveScheduleId(schedule.id);
  } catch (error) {
    console.error("Failed to save schedule:", error);
  }
};

// Load a specific schedule or the active one
export const loadSchedule = async (id?: string): Promise<Schedule | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const targetId = id || getActiveScheduleId();

    if (targetId) {
      const { data, error } = await supabase
        .from("schedules")
        .select("*")
        .eq("id", targetId)
        .single();

      if (!error && data) {
        return parseScheduleFromDB(data);
      }
    }

    // Fallback to first schedule
    const { data, error } = await supabase
      .from("schedules")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error || !data) return null;

    return parseScheduleFromDB(data);
  } catch (error) {
    console.error("Failed to load schedule:", error);
    return null;
  }
};

// Delete schedule from Supabase
export const deleteSchedule = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from("schedules")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Failed to delete schedule:", error);
      return;
    }

    if (getActiveScheduleId() === id) {
      setActiveScheduleId(null);
    }
  } catch (error) {
    console.error("Failed to delete schedule:", error);
  }
};

// Migrate local storage data to Supabase
export const migrateLocalToSupabase = async (): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const localData = localStorage.getItem(LOCAL_SCHEDULES_KEY);
    if (!localData) return false;

    const localSchedules = JSON.parse(localData);
    if (!Array.isArray(localSchedules) || localSchedules.length === 0) return false;

    // Check if user already has schedules in DB
    const { data: existingSchedules } = await supabase
      .from("schedules")
      .select("id")
      .limit(1);

    if (existingSchedules && existingSchedules.length > 0) {
      // User already has data in DB, skip migration
      return false;
    }

    // Migrate each schedule
    for (const schedule of localSchedules) {
      const prepared = prepareScheduleForDB({
        ...schedule,
        config: {
          ...schedule.config,
          createdAt: new Date(schedule.config.createdAt),
        },
        days: schedule.days.map((day: any) => ({
          ...day,
          date: new Date(day.date),
        })),
      });

      await supabase.from("schedules").insert({
        id: prepared.id,
        user_id: user.id,
        config: prepared.config as any,
        days: prepared.days as any,
      });
    }

    // Clear local storage after successful migration
    localStorage.removeItem(LOCAL_SCHEDULES_KEY);
    
    return true;
  } catch (error) {
    console.error("Failed to migrate local data:", error);
    return false;
  }
};

// Active schedule ID (kept in localStorage for quick access)
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

export const clearSchedule = async (): Promise<void> => {
  try {
    localStorage.removeItem(ACTIVE_SCHEDULE_KEY);
  } catch (error) {
    console.error("Failed to clear schedules:", error);
  }
};

// Theme preferences (kept in localStorage - no need for DB)
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
