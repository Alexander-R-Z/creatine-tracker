import { useEffect, useState } from 'react';

export type ServiceWorkerStatus = 'offline' | 'online' | 'updating' | 'updated' | 'ready';

export function useServiceWorkerStatus() {
	const [status, setStatus] = useState<ServiceWorkerStatus>('online');
	const [hasUpdate, setHasUpdate] = useState(false);

	useEffect(() => {
		const updateOnlineStatus = () => {
			setStatus(navigator.onLine ? 'online' : 'offline');
		};

		window.addEventListener('online', updateOnlineStatus);
		window.addEventListener('offline', updateOnlineStatus);

		updateOnlineStatus();

		return () => {
			window.removeEventListener('online', updateOnlineStatus);
			window.removeEventListener('offline', updateOnlineStatus);
		};
	}, []);

	useEffect(() => {
		if (!('serviceWorker' in navigator)) {
			return;
		}

		let controllerChangeTimer: ReturnType<typeof setTimeout> | null = null;
		let updateAvailableTimer: ReturnType<typeof setTimeout> | null = null;

		const handleControllerChange = () => {
			setStatus('updated');
			setHasUpdate(true);
			if (controllerChangeTimer) {
				clearTimeout(controllerChangeTimer);
			}
			controllerChangeTimer = setTimeout(() => {
				setStatus(navigator.onLine ? 'online' : 'offline');
				setHasUpdate(false);
			}, 5000);
		};

		const handleMessage = (event: MessageEvent) => {
			if (event.data?.type === 'UPDATE_AVAILABLE') {
				setStatus('updating');
				if (updateAvailableTimer) {
					clearTimeout(updateAvailableTimer);
				}
				updateAvailableTimer = setTimeout(() => {
					setStatus('online');
				}, 2000);
			}
		};

		navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);
		navigator.serviceWorker.addEventListener('message', handleMessage);

		return () => {
			navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
			navigator.serviceWorker.removeEventListener('message', handleMessage);
			if (controllerChangeTimer) {
				clearTimeout(controllerChangeTimer);
			}
			if (updateAvailableTimer) {
				clearTimeout(updateAvailableTimer);
			}
		};
	}, []);

	return { status, hasUpdate };
}
