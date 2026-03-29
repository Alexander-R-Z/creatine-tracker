import { AppState, DayLog, LogEntry, normalizeImportedState } from './storage';

export type ImportMode = 'replace' | 'merge';

const MERGE_ROLLBACK_KEY = 'obsidian_creatine_merge_rollback';
const MERGE_ROLLBACK_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;

interface MergeRollbackSnapshot {
	createdAt: string;
	expiresAt: string;
	replacedLogs: Record<string, DayLog>;
	addedDates: string[];
}

function sortEntries(entries: LogEntry[]): LogEntry[] {
	return [...entries].sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
}

function cloneDayLog(log: DayLog): DayLog {
	return {
		total: Math.max(0, log.total),
		entries: sortEntries(log.entries.map((entry) => ({ ...entry }))),
	};
}

function readMergeRollbackSnapshot(): MergeRollbackSnapshot | null {
	if (typeof localStorage === 'undefined') return null;

	const raw = localStorage.getItem(MERGE_ROLLBACK_KEY);
	if (!raw) return null;

	try {
		const parsed = JSON.parse(raw) as MergeRollbackSnapshot;
		if (!parsed || typeof parsed !== 'object') {
			localStorage.removeItem(MERGE_ROLLBACK_KEY);
			return null;
		}

		const expiresAt = new Date(parsed.expiresAt).getTime();
		if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) {
			localStorage.removeItem(MERGE_ROLLBACK_KEY);
			return null;
		}

		return {
			createdAt: parsed.createdAt,
			expiresAt: parsed.expiresAt,
			replacedLogs: parsed.replacedLogs || {},
			addedDates: Array.isArray(parsed.addedDates) ? parsed.addedDates : [],
		};
	} catch {
		localStorage.removeItem(MERGE_ROLLBACK_KEY);
		return null;
	}
}

function writeMergeRollbackSnapshot(snapshot: MergeRollbackSnapshot) {
	if (typeof localStorage === 'undefined') return;
	localStorage.setItem(MERGE_ROLLBACK_KEY, JSON.stringify(snapshot));
}

export function clearMergeRollbackSnapshot() {
	if (typeof localStorage === 'undefined') return;
	localStorage.removeItem(MERGE_ROLLBACK_KEY);
}

export function hasMergeRollbackSnapshot(): boolean {
	return readMergeRollbackSnapshot() !== null;
}

export function cleanupExpiredMergeRollbackSnapshot() {
	// This is called proactively on app load to ensure expired snapshots are cleaned.
	// readMergeRollbackSnapshot already removes expired entries, so we call it to trigger cleanup.
	if (typeof localStorage === 'undefined') return;
	readMergeRollbackSnapshot();
}

export function rollbackLastMergeImport(current: AppState): AppState {
	const snapshot = readMergeRollbackSnapshot();
	if (!snapshot) return current;

	const restoredLogs: AppState['logs'] = { ...current.logs };

	for (const date of snapshot.addedDates) {
		delete restoredLogs[date];
	}

	for (const [date, dayLog] of Object.entries(snapshot.replacedLogs)) {
		restoredLogs[date] = cloneDayLog(dayLog);
	}

	clearMergeRollbackSnapshot();

	return {
		...current,
		logs: restoredLogs,
	};
}

export function createBackupPayload(state: AppState): string {
	return JSON.stringify(
		{
			exportedAt: new Date().toISOString(),
			app: 'creatine-tracker',
			data: state,
		},
		null,
		2,
	);
}

export function parseBackupPayload(content: string): AppState {
	const raw = JSON.parse(content) as unknown;

	// Accept both full wrapper { data: ... } and raw AppState backups.
	if (typeof raw === 'object' && raw !== null && 'data' in raw) {
		const wrapped = raw as { data?: unknown };
		if (typeof wrapped.data !== 'object' || wrapped.data === null || Array.isArray(wrapped.data)) {
			throw new Error('Invalid backup payload: "data" must be an object.');
		}
		return normalizeImportedState(wrapped.data);
	}

	if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
		throw new Error('Invalid backup payload: expected an app state object.');
	}

	return normalizeImportedState(raw);
}

export function applyImportedState(current: AppState, imported: AppState, mode: ImportMode): AppState {
	if (mode === 'replace') {
		clearMergeRollbackSnapshot();
		return imported;
	}

	const mergedLogs: AppState['logs'] = { ...current.logs };
	const replacedLogs: Record<string, DayLog> = {};
	const addedDates: string[] = [];

	for (const [date, importedLog] of Object.entries(imported.logs)) {
		const currentLog = mergedLogs[date];
		if (currentLog) {
			replacedLogs[date] = cloneDayLog(currentLog);
		} else {
			addedDates.push(date);
		}

		// Merge mode intentionally replaces matching dates with imported data.
		mergedLogs[date] = cloneDayLog(importedLog);
	}

	if (Object.keys(replacedLogs).length > 0 || addedDates.length > 0) {
		const now = new Date();
		writeMergeRollbackSnapshot({
			createdAt: now.toISOString(),
			expiresAt: new Date(now.getTime() + MERGE_ROLLBACK_RETENTION_MS).toISOString(),
			replacedLogs,
			addedDates,
		});
	}

	return {
		...current,
		logs: mergedLogs,
		onboarded: current.onboarded || imported.onboarded,
	};
}
