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

		const handleControllerChange = () => {
			setStatus('updated');
			setHasUpdate(true);
			const timer = setTimeout(() => {
				setStatus(navigator.onLine ? 'online' : 'offline');
				setHasUpdate(false);
			}, 5000);
			return () => clearTimeout(timer);
		};

		const handleMessage = (event: MessageEvent) => {
			if (event.data?.type === 'UPDATE_AVAILABLE') {
				setStatus('updating');
				const timer = setTimeout(() => {
					setStatus('online');
				}, 2000);
				return () => clearTimeout(timer);
			}
		};

		navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);
		navigator.serviceWorker.addEventListener('message', handleMessage);

		return () => {
			navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
			navigator.serviceWorker.removeEventListener('message', handleMessage);
		};
	}, []);

	return { status, hasUpdate };
}
