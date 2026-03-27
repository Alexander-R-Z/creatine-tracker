import { format, subHours, startOfDay } from "date-fns";

export interface LogEntry {
  time: string;
  amount: number;
}

export interface DayLog {
  total: number;
  entries: LogEntry[];
}

export interface Settings {
  dailyGoal: number;
  portionSize: number;
  weight?: number;
  goal?: 'gym' | 'gym_more';
  resetTime?: string; // HH:mm format
}

export interface AppState {
  settings: Settings;
  logs: Record<string, DayLog>;
  onboarded: boolean;
}

const STORAGE_KEY = "obsidian_creatine_data";

// The day ends at a configurable time (default 04:30 AM).
// To get the "effective" date for tracking, we subtract the offset.
export function getEffectiveDate(date: Date = new Date(), resetTime: string = "04:30"): string {
  const [hours, minutes] = resetTime.split(':').map(Number);
  const offsetHours = hours + (minutes / 60);
  const effective = subHours(date, offsetHours);
  return format(startOfDay(effective), "yyyy-MM-dd");
}

export function loadState(): AppState {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error("Failed to parse saved state", e);
    }
  }
  return {
    settings: {
      dailyGoal: 5,
      portionSize: 5,
      resetTime: "04:30",
    },
    logs: {},
    onboarded: false,
  };
}

export function saveState(state: AppState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function getLogForDate(state: AppState, dateStr: string): DayLog {
  return state.logs[dateStr] || { total: 0, entries: [] };
}

export function addEntry(state: AppState, amount: number): AppState {
  const dateStr = getEffectiveDate(new Date(), state.settings.resetTime);
  const currentLog = getLogForDate(state, dateStr);
  
  const newLog: DayLog = {
    total: currentLog.total + amount,
    entries: [
      ...currentLog.entries,
      { time: new Date().toISOString(), amount }
    ]
  };

  return {
    ...state,
    logs: {
      ...state.logs,
      [dateStr]: newLog
    }
  };
}

export function undoLastEntry(state: AppState): AppState {
  const dateStr = getEffectiveDate(new Date(), state.settings.resetTime);
  const currentLog = getLogForDate(state, dateStr);
  
  if (currentLog.entries.length === 0) return state;

  const lastEntry = currentLog.entries[currentLog.entries.length - 1];
  const newEntries = currentLog.entries.slice(0, -1);
  
  const newLog: DayLog = {
    total: Math.max(0, currentLog.total - lastEntry.amount),
    entries: newEntries
  };

  return {
    ...state,
    logs: {
      ...state.logs,
      [dateStr]: newLog
    }
  };
}

export function updateDayLog(state: AppState, dateStr: string, newTotal: number): AppState {
  const currentLog = getLogForDate(state, dateStr);
  
  const newLog: DayLog = {
    ...currentLog,
    total: Math.max(0, newTotal),
  };

  return {
    ...state,
    logs: {
      ...state.logs,
      [dateStr]: newLog
    }
  };
}
