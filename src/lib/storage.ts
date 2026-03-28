import { format, subHours, startOfDay } from 'date-fns';
import { CURRENT_SCHEMA_VERSION, migrateToCurrentVersion } from './migrations';

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
	version: number;
	settings: Settings;
	logs: Record<string, DayLog>;
	onboarded: boolean;
}

const STORAGE_KEY = 'obsidian_creatine_data';
function createDefaultState(): AppState {
	return {
		version: CURRENT_SCHEMA_VERSION,
		settings: {
			dailyGoal: 5,
			portionSize: 5,
			resetTime: '04:30',
		},
		logs: {},
		onboarded: false,
	};
}

function isObject(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}

function isFiniteNumber(value: unknown): value is number {
	return typeof value === 'number' && Number.isFinite(value);
}

function sanitizeResetTime(value: unknown): string {
	if (typeof value !== 'string') return '04:30';
	const match = value.match(/^(\d{2}):(\d{2})$/);
	if (!match) return '04:30';
	const hours = Number(match[1]);
	const minutes = Number(match[2]);
	if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return '04:30';
	return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

function sanitizeSettings(value: unknown): Settings {
	const defaults = createDefaultState().settings;
	if (!isObject(value)) return defaults;

	const dailyGoal = isFiniteNumber(value.dailyGoal) ? Math.max(1, Math.round(value.dailyGoal)) : defaults.dailyGoal;
	const rawPortion = isFiniteNumber(value.portionSize)
		? Math.max(1, Math.round(value.portionSize))
		: defaults.portionSize;
	const portionSize = Math.min(rawPortion, dailyGoal);

	const goal = value.goal === 'gym' || value.goal === 'gym_more' ? value.goal : undefined;
	const weight = isFiniteNumber(value.weight) ? Math.max(20, Math.min(250, Math.round(value.weight))) : undefined;

	return {
		dailyGoal,
		portionSize,
		resetTime: sanitizeResetTime(value.resetTime),
		...(goal ? { goal } : {}),
		...(weight ? { weight } : {}),
	};
}

function sanitizeEntries(value: unknown): LogEntry[] {
	if (!Array.isArray(value)) return [];
	return value
		.filter((entry): entry is Record<string, unknown> => isObject(entry))
		.map((entry) => ({
			time: typeof entry.time === 'string' ? entry.time : new Date(0).toISOString(),
			amount: isFiniteNumber(entry.amount) ? Math.max(0, entry.amount) : 0,
		}))
		.filter((entry) => entry.amount > 0);
}

function sanitizeLogs(value: unknown): Record<string, DayLog> {
	if (!isObject(value)) return {};
	const logs: Record<string, DayLog> = {};

	for (const [dateKey, dayLog] of Object.entries(value)) {
		if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey) || !isObject(dayLog)) continue;

		const entries = sanitizeEntries(dayLog.entries);
		const total = isFiniteNumber(dayLog.total)
			? Math.max(0, dayLog.total)
			: entries.reduce((sum, entry) => sum + entry.amount, 0);

		logs[dateKey] = {
			total,
			entries,
		};
	}

	return logs;
}

function migrateAndValidate(raw: unknown): AppState {
	const defaults = createDefaultState();
	if (!isObject(raw)) return defaults;

	const migrated = migrateToCurrentVersion(raw);

	return {
		version: CURRENT_SCHEMA_VERSION,
		settings: sanitizeSettings(migrated.settings),
		logs: sanitizeLogs(migrated.logs),
		onboarded: typeof migrated.onboarded === 'boolean' ? migrated.onboarded : defaults.onboarded,
	};
}

export function normalizeImportedState(raw: unknown): AppState {
	return migrateAndValidate(raw);
}

// The day ends at a configurable time (default 04:30 AM).
// To get the "effective" date for tracking, we subtract the offset.
export function getEffectiveDate(date: Date = new Date(), resetTime: string = '04:30'): string {
	const [hours, minutes] = resetTime.split(':').map(Number);
	const offsetHours = hours + minutes / 60;
	const effective = subHours(date, offsetHours);
	return format(startOfDay(effective), 'yyyy-MM-dd');
}

export function loadState(): AppState {
	const saved = localStorage.getItem(STORAGE_KEY);
	if (saved) {
		try {
			const parsed = JSON.parse(saved) as unknown;
			return migrateAndValidate(parsed);
		} catch (e) {
			console.error('Failed to parse saved state', e);
		}
	}
	return createDefaultState();
}

export function saveState(state: AppState) {
	localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, version: CURRENT_SCHEMA_VERSION }));
}

export function getLogForDate(state: AppState, dateStr: string): DayLog {
	return state.logs[dateStr] || { total: 0, entries: [] };
}

export function addEntry(state: AppState, amount: number): AppState {
	const dateStr = getEffectiveDate(new Date(), state.settings.resetTime);
	const currentLog = getLogForDate(state, dateStr);

	const newLog: DayLog = {
		total: currentLog.total + amount,
		entries: [...currentLog.entries, { time: new Date().toISOString(), amount }],
	};

	return {
		...state,
		logs: {
			...state.logs,
			[dateStr]: newLog,
		},
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
		entries: newEntries,
	};

	// If the log is now empty (total=0, no entries), remove the day entirely
	if (newLog.total === 0 && newLog.entries.length === 0) {
		const { [dateStr]: _, ...remainingLogs } = state.logs;
		return {
			...state,
			logs: remainingLogs,
		};
	}

	return {
		...state,
		logs: {
			...state.logs,
			[dateStr]: newLog,
		},
	};
}

export function updateDayLog(state: AppState, dateStr: string, newTotal: number): AppState {
	const currentLog = getLogForDate(state, dateStr);

	const newLog: DayLog = {
		...currentLog,
		total: Math.max(0, newTotal),
	};

	// If the log is now empty (total=0, no entries), remove the day entirely
	if (newLog.total === 0 && newLog.entries.length === 0) {
		const { [dateStr]: _, ...remainingLogs } = state.logs;
		return {
			...state,
			logs: remainingLogs,
		};
	}

	return {
		...state,
		logs: {
			...state.logs,
			[dateStr]: newLog,
		},
	};
}

/**
 * Prunes logs to remove old per-entry details (>24 months) while preserving totals for history,
 * and removes entirely empty days (total=0, no entries).
 */
export function pruneLogs(state: AppState): AppState {
	const now = new Date();
	const twentyFourMonthsAgo = new Date(now.getTime() - 24 * 30.44 * 24 * 60 * 60 * 1000);
	const cutoffDateStr = format(twentyFourMonthsAgo, 'yyyy-MM-dd');

	const prunedLogs: Record<string, DayLog> = {};

	for (const [dateKey, dayLog] of Object.entries(state.logs)) {
		// Skip dates that don't match the expected format
		if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) continue;

		// Remove entirely empty days (total=0 and no entries)
		if (dayLog.total === 0 && dayLog.entries.length === 0) {
			continue;
		}

		// For old dates (>24 months), keep only the total, discard entries
		if (dateKey < cutoffDateStr) {
			prunedLogs[dateKey] = {
				total: dayLog.total,
				entries: [],
			};
		} else {
			// Keep recent dates as-is
			prunedLogs[dateKey] = dayLog;
		}
	}

	return {
		...state,
		logs: prunedLogs,
	};
}
