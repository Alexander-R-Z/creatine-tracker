import { format, subDays } from 'date-fns';
import { CURRENT_SCHEMA_VERSION, migrateToCurrentVersion } from './migrations';

export interface LogEntry {
	time: string;
	amount: number;
}

export interface DayLog {
	total: number;
	entries: LogEntry[];
}

export interface MuffledAudioToggle {
	enabled: boolean;
	muffled: boolean;
}

export interface AudioComboState {
	baseCombo: number;
	temporaryBoost: number;
	lastActionTime: number;
}

export interface AudioSettings {
	enabled: boolean;
	addPortion: boolean;
	dailyGoalReached: boolean;
	correctToday: MuffledAudioToggle;
	increaseDecrease: MuffledAudioToggle;
	historyEdit: MuffledAudioToggle;
	combo: AudioComboState;
}

export interface Settings {
	dailyGoal: number;
	portionSize: number;
	weight?: number;
	goal?: 'gym' | 'gym_more';
	resetTime?: string; // HH:mm format
	entryRetentionMonths?: number; // How many months to keep per-entry details (3-60, default 24)
	weeklyChartCarousel?: boolean; // Home chart mode: rolling 7-day window ending today
	notificationsEnabled?: boolean;
	dailyReminderEnabled?: boolean;
	dailyReminderTime?: string; // HH:mm format
	missedGoalReminderEnabled?: boolean;
	missedGoalReminderTime?: string; // HH:mm format
	audio?: AudioSettings;
}

export interface AppState {
	version: number;
	settings: Settings;
	logs: Record<string, DayLog>;
	onboarded: boolean;
}

const STORAGE_KEY = 'obsidian_creatine_data';
const GRAM_STEP = 0.5;

function clampNumber(value: number, min: number, max: number): number {
	return Math.max(min, Math.min(max, value));
}

export function createDefaultAudioSettings(): AudioSettings {
	return {
		enabled: false,
		addPortion: true,
		dailyGoalReached: true,
		correctToday: { enabled: true, muffled: true },
		increaseDecrease: { enabled: true, muffled: true },
		historyEdit: { enabled: true, muffled: true },
		combo: {
			baseCombo: 0,
			temporaryBoost: 0,
			lastActionTime: 0,
		},
	};
}

function snapToHalfStep(value: number): number {
	return Math.round(value / GRAM_STEP) * GRAM_STEP;
}

function createDefaultState(): AppState {
	return {
		version: CURRENT_SCHEMA_VERSION,
		settings: {
			dailyGoal: 5,
			portionSize: 5,
			resetTime: '04:30',
			entryRetentionMonths: 24,
			weeklyChartCarousel: true,
			notificationsEnabled: false,
			dailyReminderEnabled: true,
			dailyReminderTime: '09:00',
			missedGoalReminderEnabled: true,
			missedGoalReminderTime: '22:00',
			audio: createDefaultAudioSettings(),
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

function sanitizeTime(value: unknown, fallback: string): string {
	if (typeof value !== 'string') return fallback;
	const match = value.match(/^(\d{2}):(\d{2})$/);
	if (!match) return fallback;
	const hours = Number(match[1]);
	const minutes = Number(match[2]);
	if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return fallback;
	return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

function sanitizeMuffledToggle(value: unknown, fallback: MuffledAudioToggle): MuffledAudioToggle {
	if (!isObject(value)) return fallback;
	return {
		enabled: typeof value.enabled === 'boolean' ? value.enabled : fallback.enabled,
		muffled: typeof value.muffled === 'boolean' ? value.muffled : fallback.muffled,
	};
}

function sanitizeAudioSettings(value: unknown): AudioSettings {
	const defaults = createDefaultAudioSettings();
	if (!isObject(value)) return defaults;

	let combo = defaults.combo;
	if (isObject(value.combo)) {
		const rawBaseCombo = isFiniteNumber(value.combo.baseCombo) ? value.combo.baseCombo : defaults.combo.baseCombo;
		const rawTemporaryBoost = isFiniteNumber(value.combo.temporaryBoost)
			? value.combo.temporaryBoost
			: defaults.combo.temporaryBoost;
		const rawLastActionTime = isFiniteNumber(value.combo.lastActionTime)
			? value.combo.lastActionTime
			: defaults.combo.lastActionTime;
		combo = {
			baseCombo: clampNumber(Math.floor(rawBaseCombo), 0, 35),
			temporaryBoost: clampNumber(rawTemporaryBoost, 0, 40),
			lastActionTime: Math.max(0, Math.floor(rawLastActionTime)),
		};
	}

	return {
		enabled: typeof value.enabled === 'boolean' ? value.enabled : defaults.enabled,
		addPortion: typeof value.addPortion === 'boolean' ? value.addPortion : defaults.addPortion,
		dailyGoalReached:
			typeof value.dailyGoalReached === 'boolean' ? value.dailyGoalReached : defaults.dailyGoalReached,
		correctToday: sanitizeMuffledToggle(value.correctToday, defaults.correctToday),
		increaseDecrease: sanitizeMuffledToggle(value.increaseDecrease, defaults.increaseDecrease),
		historyEdit: sanitizeMuffledToggle(value.historyEdit, defaults.historyEdit),
		combo,
	};
}

function sanitizeSettings(value: unknown): Settings {
	const defaults = createDefaultState().settings;
	if (!isObject(value)) return defaults;

	const dailyGoal = isFiniteNumber(value.dailyGoal)
		? snapToHalfStep(Math.max(1, value.dailyGoal))
		: defaults.dailyGoal;
	const rawPortion = isFiniteNumber(value.portionSize)
		? snapToHalfStep(Math.max(1, value.portionSize))
		: defaults.portionSize;
	const portionSize = Math.min(rawPortion, dailyGoal);

	const goal = value.goal === 'gym' || value.goal === 'gym_more' ? value.goal : undefined;
	const weight = isFiniteNumber(value.weight) ? Math.max(20, Math.min(250, Math.round(value.weight))) : undefined;
	const entryRetentionMonths = isFiniteNumber(value.entryRetentionMonths)
		? Math.max(3, Math.min(60, Math.round(value.entryRetentionMonths)))
		: defaults.entryRetentionMonths;
	const weeklyChartCarousel =
		typeof value.weeklyChartCarousel === 'boolean' ? value.weeklyChartCarousel : defaults.weeklyChartCarousel;
	const notificationsEnabled =
		typeof value.notificationsEnabled === 'boolean' ? value.notificationsEnabled : defaults.notificationsEnabled;
	const dailyReminderEnabled =
		typeof value.dailyReminderEnabled === 'boolean' ? value.dailyReminderEnabled : defaults.dailyReminderEnabled;
	const missedGoalReminderEnabled =
		typeof value.missedGoalReminderEnabled === 'boolean'
			? value.missedGoalReminderEnabled
			: defaults.missedGoalReminderEnabled;
	const audio = sanitizeAudioSettings(value.audio);

	return {
		dailyGoal,
		portionSize,
		resetTime: sanitizeResetTime(value.resetTime),
		entryRetentionMonths,
		weeklyChartCarousel,
		notificationsEnabled,
		dailyReminderEnabled,
		dailyReminderTime: sanitizeTime(value.dailyReminderTime, defaults.dailyReminderTime),
		missedGoalReminderEnabled,
		missedGoalReminderTime: sanitizeTime(value.missedGoalReminderTime, defaults.missedGoalReminderTime),
		audio,
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
			amount: isFiniteNumber(entry.amount) ? snapToHalfStep(Math.max(0, entry.amount)) : 0,
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
			? snapToHalfStep(Math.max(0, dayLog.total))
			: snapToHalfStep(entries.reduce((sum, entry) => sum + entry.amount, 0));

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

// The day ends at a configurable local wall-clock time (default 04:30 AM).
// We compare against today's reset timestamp to avoid DST/fractional-hour edge cases.
export function getEffectiveDate(date: Date = new Date(), resetTime: string = '04:30'): string {
	const [hours, minutes] = resetTime.split(':').map(Number);
	const resetToday = new Date(date);
	resetToday.setHours(hours, minutes, 0, 0);

	if (date < resetToday) {
		return format(subDays(date, 1), 'yyyy-MM-dd');
	}

	return format(date, 'yyyy-MM-dd');
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
	const safeAmount = snapToHalfStep(Math.max(0, amount));

	const newLog: DayLog = {
		total: snapToHalfStep(currentLog.total + safeAmount),
		entries: [...currentLog.entries, { time: new Date().toISOString(), amount: safeAmount }],
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
		total: snapToHalfStep(Math.max(0, currentLog.total - lastEntry.amount)),
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
	const snappedTotal = snapToHalfStep(Math.max(0, newTotal));
	const snappedCurrentTotal = snapToHalfStep(Math.max(0, currentLog.total));

	const newLog: DayLog = {
		total: snappedTotal,
		// If total is manually changed, drop old entries to avoid undo subtracting stale amounts.
		entries: snappedTotal === snappedCurrentTotal ? currentLog.entries : [],
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
 * Prunes logs to remove old per-entry details (older than configured retention period) while preserving totals for history,
 * and removes entirely empty days (total=0, no entries).
 */
export function pruneLogs(state: AppState): AppState {
	const retentionMonths = state.settings.entryRetentionMonths ?? 24;
	const now = new Date();
	const cutoffMs = retentionMonths * 30.44 * 24 * 60 * 60 * 1000;
	const retentionCutoffDate = new Date(now.getTime() - cutoffMs);
	const cutoffDateStr = format(retentionCutoffDate, 'yyyy-MM-dd');

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
