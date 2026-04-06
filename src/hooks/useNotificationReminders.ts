import { useEffect, useRef, useState } from 'react';
import { AppState, getEffectiveDate, getLogForDate } from '../lib/storage';

type NotificationPermissionState = NotificationPermission | 'unsupported';

interface ReminderDeliveryState {
	dailyReminderDate?: string;
	missedGoalReminderDate?: string;
}

export interface NotificationReminderStatus {
	supported: boolean;
	isInstalled: boolean;
	permission: NotificationPermissionState;
	canSchedule: boolean;
	reason: string;
}

const REMINDER_STORAGE_KEY = 'obsidian_creatine_reminder_delivery';
const APP_BASE = '/creatine-tracker/';
const DEFAULT_ICON = `${APP_BASE}icons/icon.svg`;

function isStandaloneMode() {
	if (typeof window === 'undefined') {
		return false;
	}

	const standaloneMedia = window.matchMedia('(display-mode: standalone)').matches;
	const iosStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
	return standaloneMedia || iosStandalone;
}

function readDeliveryState(): ReminderDeliveryState {
	if (typeof localStorage === 'undefined') {
		return {};
	}

	try {
		const raw = localStorage.getItem(REMINDER_STORAGE_KEY);
		if (!raw) return {};
		const parsed = JSON.parse(raw) as Partial<ReminderDeliveryState>;
		return {
			dailyReminderDate: typeof parsed.dailyReminderDate === 'string' ? parsed.dailyReminderDate : undefined,
			missedGoalReminderDate:
				typeof parsed.missedGoalReminderDate === 'string' ? parsed.missedGoalReminderDate : undefined,
		};
	} catch {
		return {};
	}
}

function writeDeliveryState(state: ReminderDeliveryState) {
	if (typeof localStorage === 'undefined') {
		return;
	}

	localStorage.setItem(REMINDER_STORAGE_KEY, JSON.stringify(state));
}

function parseTimeToMinutes(value: string): number {
	const [hours, minutes] = value.split(':').map(Number);
	return hours * 60 + minutes;
}

async function showReminderNotification(title: string, body: string) {
	if (typeof window === 'undefined' || !('Notification' in window)) {
		return;
	}

	const options = {
		body,
		icon: DEFAULT_ICON,
		badge: DEFAULT_ICON,
		data: { url: APP_BASE },
		tag: title,
		actions: [{ action: 'open', title: 'Open app' }],
	};

	if ('serviceWorker' in navigator) {
		try {
			const registration = await navigator.serviceWorker.ready;
			await registration.showNotification(title, options);
			return;
		} catch {
			// Fall back to the window Notification API below.
		}
	}

	new Notification(title, options);
}

export function useNotificationReminders(state: AppState) {
	const supported = typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator;
	const [permission, setPermission] = useState<NotificationPermissionState>(() => {
		if (!supported) return 'unsupported';
		return Notification.permission;
	});
	const [isInstalled, setIsInstalled] = useState<boolean>(() => isStandaloneMode());
	const deliveryStateRef = useRef<ReminderDeliveryState>(readDeliveryState());

	useEffect(() => {
		const refreshInstalledState = () => setIsInstalled(isStandaloneMode());
		window.addEventListener('focus', refreshInstalledState);
		document.addEventListener('visibilitychange', refreshInstalledState);
		window.addEventListener('appinstalled', refreshInstalledState);
		refreshInstalledState();

		return () => {
			window.removeEventListener('focus', refreshInstalledState);
			document.removeEventListener('visibilitychange', refreshInstalledState);
			window.removeEventListener('appinstalled', refreshInstalledState);
		};
	}, []);

	useEffect(() => {
		if (!supported) return;
		setPermission(Notification.permission);
	}, [supported]);

	const requestPermission = async () => {
		if (!supported || !isInstalled || permission === 'denied') {
			return false;
		}

		const result = await Notification.requestPermission();
		setPermission(result);
		return result === 'granted';
	};

	const canSchedule = isInstalled && supported && permission === 'granted';

	let reason = 'Notifications are ready.';
	if (!supported) {
		reason = 'Notifications are not supported in this browser.';
	} else if (!isInstalled) {
		reason = 'Install the app to enable notifications.';
	} else if (permission === 'denied') {
		reason = 'Notifications are blocked in browser settings.';
	} else if (!(state.settings.notificationsEnabled ?? false)) {
		reason = 'Notifications are off.';
	} else if (permission !== 'granted') {
		reason = 'Tap Enable notifications to grant permission.';
	}

	const status: NotificationReminderStatus = {
		supported,
		isInstalled,
		permission,
		canSchedule,
		reason,
	};

	useEffect(() => {
		if (!canSchedule || !(state.settings.notificationsEnabled ?? false)) {
			return;
		}

		let cancelled = false;

		const checkReminders = async () => {
			if (cancelled) return;

			const now = new Date();
			const effectiveDate = getEffectiveDate(now, state.settings.resetTime);
			const currentMinutes = now.getHours() * 60 + now.getMinutes();
			const deliveryState = deliveryStateRef.current;

			if (state.settings.dailyReminderEnabled ?? false) {
				const reminderMinutes = parseTimeToMinutes(state.settings.dailyReminderTime ?? '09:00');
				if (currentMinutes >= reminderMinutes && deliveryState.dailyReminderDate !== effectiveDate) {
					await showReminderNotification(
						'Creatine reminder',
						`Time to log your daily creatine dose. You're tracking ${getLogForDate(state, effectiveDate).total}g today.`,
					);
					deliveryStateRef.current = {
						...deliveryState,
						dailyReminderDate: effectiveDate,
					};
					writeDeliveryState(deliveryStateRef.current);
				}
			}

			if (state.settings.missedGoalReminderEnabled ?? false) {
				const cutoffMinutes = parseTimeToMinutes(state.settings.missedGoalReminderTime ?? '22:00');
				const todayLog = getLogForDate(state, effectiveDate);
				if (
					currentMinutes >= cutoffMinutes &&
					todayLog.total < state.settings.dailyGoal &&
					deliveryState.missedGoalReminderDate !== effectiveDate
				) {
					await showReminderNotification(
						'Daily goal not reached',
						`You are at ${todayLog.total}g and still need ${Math.max(0, state.settings.dailyGoal - todayLog.total)}g to hit today's goal.`,
					);
					deliveryStateRef.current = {
						...deliveryState,
						missedGoalReminderDate: effectiveDate,
					};
					writeDeliveryState(deliveryStateRef.current);
				}
			}
		};

		void checkReminders();
		const intervalId = window.setInterval(() => {
			void checkReminders();
		}, 60_000);

		return () => {
			cancelled = true;
			window.clearInterval(intervalId);
		};
	}, [canSchedule, state]);

	return {
		status,
		requestPermission,
	};
}
