import { useCallback, useEffect, useMemo, useState } from 'react';

type InstallOutcome = 'accepted' | 'dismissed';

interface BeforeInstallPromptEvent extends Event {
	prompt: () => Promise<void>;
	userChoice: Promise<{ outcome: InstallOutcome }>;
}

const isStandaloneMode = () => {
	if (typeof window === 'undefined') {
		return false;
	}

	const standaloneMedia = window.matchMedia('(display-mode: standalone)').matches;
	const iosStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
	return standaloneMedia || iosStandalone;
};

export function useInstallPrompt() {
	const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
	const [isInstalled, setIsInstalled] = useState<boolean>(() => isStandaloneMode());

	useEffect(() => {
		const onBeforeInstallPrompt = (event: Event) => {
			event.preventDefault();
			setDeferredPrompt(event as BeforeInstallPromptEvent);
		};

		const onAppInstalled = () => {
			setIsInstalled(true);
			setDeferredPrompt(null);
		};

		window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
		window.addEventListener('appinstalled', onAppInstalled);

		return () => {
			window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
			window.removeEventListener('appinstalled', onAppInstalled);
		};
	}, []);

	const install = useCallback(async () => {
		if (!deferredPrompt) {
			return;
		}

		await deferredPrompt.prompt();
		const result = await deferredPrompt.userChoice;
		if (result.outcome === 'accepted') {
			setIsInstalled(true);
		}
		setDeferredPrompt(null);
	}, [deferredPrompt]);

	const canInstall = useMemo(() => !isInstalled && deferredPrompt !== null, [deferredPrompt, isInstalled]);

	return {
		canInstall,
		install,
		isInstalled,
	};
}
