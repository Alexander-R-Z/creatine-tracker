import { motion, AnimatePresence } from 'motion/react';
import { Wifi, WifiOff, RotateCcw, CheckCircle2 } from 'lucide-react';
import { useServiceWorkerStatus, type ServiceWorkerStatus } from '../hooks/useServiceWorkerStatus';

interface StatusIndicatorProps {
	status: ServiceWorkerStatus;
	hasUpdate: boolean;
}

export function StatusIndicator({ status, hasUpdate }: StatusIndicatorProps) {
	const statusConfig: Record<
		ServiceWorkerStatus,
		{ icon: any; label: string; color: string; textColor: string; hide?: boolean }
	> = {
		offline: {
			icon: WifiOff,
			label: 'Offline Mode',
			color: 'bg-[#ff6b6b]',
			textColor: 'text-[#ff6b6b]',
		},
		online: {
			icon: Wifi,
			label: 'Online',
			color: 'bg-[#51cf66]',
			textColor: 'text-[#51cf66]',
			hide: !hasUpdate,
		},
		ready: {
			icon: Wifi,
			label: 'Ready',
			color: 'bg-[#51cf66]',
			textColor: 'text-[#51cf66]',
			hide: true,
		},
		updating: {
			icon: RotateCcw,
			label: 'Updating...',
			color: 'bg-[#ffd43b]',
			textColor: 'text-[#ffd43b]',
		},
		updated: {
			icon: CheckCircle2,
			label: 'App Updated',
			color: 'bg-[#51cf66]',
			textColor: 'text-[#51cf66]',
		},
	};

	const current = statusConfig[status];

	if (current?.hide) {
		return null;
	}

	const Icon = current?.icon || Wifi;

	return (
		<AnimatePresence mode='wait'>
			<motion.div
				key={status}
				initial={{ opacity: 0, scale: 0.9 }}
				animate={{ opacity: 1, scale: 1 }}
				exit={{ opacity: 0, scale: 0.9 }}
				transition={{ duration: 0.2 }}
				className='fixed bottom-6 right-6 z-40 flex items-center gap-2 px-3 py-2 rounded-full border border-white/10 bg-[#1a1a1a]/95 backdrop-blur-lg'
			>
				<div className={`w-2 h-2 rounded-full ${current?.color} animate-pulse`} />
				<div className='flex items-center gap-1.5'>
					<Icon className={`w-3.5 h-3.5 ${current?.textColor}`} />
					<span className='text-xs font-semibold text-[#ababab]'>{current?.label}</span>
				</div>
			</motion.div>
		</AnimatePresence>
	);
}
