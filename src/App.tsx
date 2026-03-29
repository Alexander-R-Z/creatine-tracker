import { useState, useEffect, useMemo, Suspense, lazy } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { Keyboard } from 'lucide-react';
import { loadState, saveState, AppState, pruneLogs } from './lib/storage';
import { cleanupExpiredMergeRollbackSnapshot } from './lib/backup';
import Home from './components/Home';
import Setup from './components/Setup';
import Layout from './components/Layout';
import { StatusIndicator } from './components/StatusIndicator';
import { useServiceWorkerStatus } from './hooks/useServiceWorkerStatus';
import { ShortcutDefinition, isModKeyPressed, useKeyboardShortcuts } from './lib/keyboard';

const History = lazy(() => import('./components/History'));
const Settings = lazy(() => import('./components/Settings'));
const Analytics = lazy(() => import('./components/Analytics'));

export type View = 'home' | 'history' | 'analytics' | 'settings' | 'setup';

export default function App() {
	const shouldReduceMotion = useReducedMotion();
	const { status, hasUpdate } = useServiceWorkerStatus();
	const [state, setState] = useState<AppState>(() => {
		const loaded = loadState();
		// On app startup, prune old entries (>24 months) and clean expired rollback snapshots
		cleanupExpiredMergeRollbackSnapshot();
		const pruned = pruneLogs(loaded);
		// If pruning made changes, persist them immediately
		if (JSON.stringify(pruned.logs) !== JSON.stringify(loaded.logs)) {
			saveState(pruned);
		}
		return pruned;
	});
	const [currentView, setCurrentView] = useState<View>(state.onboarded ? 'home' : 'setup');
	const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

	useEffect(() => {
		saveState(state);
	}, [state]);

	const updateState = (updater: (prev: AppState) => AppState) => {
		setState((prev) => {
			const newState = updater(prev);
			return newState;
		});
	};

	const shortcuts = useMemo<ShortcutDefinition[]>(
		() => [
			{
				id: 'shortcuts-toggle',
				description: 'Toggle shortcut panel',
				combo: '?',
				match: (event) => event.key === '?' || (event.key === '/' && event.shiftKey),
				action: () => setIsShortcutsOpen((prev) => !prev),
			},
			{
				id: 'shortcuts-close',
				description: 'Close shortcut panel',
				combo: 'Esc',
				match: (event) => event.key === 'Escape',
				action: () => setIsShortcutsOpen(false),
				enabled: isShortcutsOpen,
				allowInInput: true,
				preventDefault: false,
			},
			{
				id: 'view-home',
				description: 'Go to Home',
				combo: 'Ctrl/Cmd + 1',
				match: (event) => isModKeyPressed(event) && event.key === '1',
				action: () => setCurrentView('home'),
				enabled: currentView !== 'setup',
			},
			{
				id: 'view-history',
				description: 'Go to History',
				combo: 'Ctrl/Cmd + 2',
				match: (event) => isModKeyPressed(event) && event.key === '2',
				action: () => setCurrentView('history'),
				enabled: currentView !== 'setup',
			},
			{
				id: 'view-analytics',
				description: 'Go to Analytics',
				combo: 'Ctrl/Cmd + 3',
				match: (event) => isModKeyPressed(event) && event.key === '3',
				action: () => setCurrentView('analytics'),
				enabled: currentView !== 'setup',
			},
			{
				id: 'view-settings',
				description: 'Go to Settings',
				combo: 'Ctrl/Cmd + 4',
				match: (event) => isModKeyPressed(event) && event.key === '4',
				action: () => setCurrentView('settings'),
				enabled: currentView !== 'setup',
			},
			{
				id: 'home-add',
				description: 'Add next dose (Home)',
				combo: 'Ctrl/Cmd + Enter',
				match: (event) => isModKeyPressed(event) && event.key === 'Enter',
				action: () => window.dispatchEvent(new Event('ct:home-add')),
				enabled: currentView === 'home',
			},
			{
				id: 'home-undo',
				description: 'Undo last entry (Home)',
				combo: 'Ctrl/Cmd + Backspace',
				match: (event) => isModKeyPressed(event) && event.key === 'Backspace',
				action: () => window.dispatchEvent(new Event('ct:home-undo')),
				enabled: currentView === 'home',
			},
			{
				id: 'settings-export',
				description: 'Export backup (Settings)',
				combo: 'Ctrl/Cmd + E',
				match: (event) => isModKeyPressed(event) && event.key.toLowerCase() === 'e',
				action: () => window.dispatchEvent(new Event('ct:settings-export')),
				enabled: currentView === 'settings',
			},
		],
		[currentView, isShortcutsOpen],
	);

	useKeyboardShortcuts(shortcuts);

	useEffect(() => {
		if (currentView === 'setup') {
			setIsShortcutsOpen(false);
		}
	}, [currentView]);

	const renderView = () => {
		switch (currentView) {
			case 'setup':
				return (
					<Setup
						onComplete={(settings) => {
							updateState((prev) => ({ ...prev, settings, onboarded: true }));
							setCurrentView('home');
						}}
					/>
				);
			case 'home':
				return <Home state={state} updateState={updateState} setView={setCurrentView} />;
			case 'history':
				return (
					<Suspense fallback={<ViewFallback title='Loading history...' />}>
						<History state={state} updateState={updateState} />
					</Suspense>
				);
			case 'analytics':
				return (
					<Suspense fallback={<ViewFallback title='Loading analytics...' />}>
						<Analytics state={state} setView={setCurrentView} />
					</Suspense>
				);
			case 'settings':
				return (
					<Suspense fallback={<ViewFallback title='Loading settings...' />}>
						<Settings
							state={state}
							updateState={updateState}
							onReset={() => {
								updateState((prev) => ({ ...prev, onboarded: false, logs: {} }));
								setCurrentView('setup');
							}}
						/>
					</Suspense>
				);
			default:
				return <Home state={state} updateState={updateState} setView={setCurrentView} />;
		}
	};

	return (
		<div className='min-h-screen bg-[#0e0e0e] text-white font-sans selection:bg-[#00fdc1]/30 overflow-x-hidden'>
			<AnimatePresence mode='wait'>
				{currentView === 'setup' ? (
					<motion.div
						key='setup'
						initial={shouldReduceMotion ? false : { opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={shouldReduceMotion ? undefined : { opacity: 0 }}
						transition={{ duration: shouldReduceMotion ? 0 : 0.3 }}
					>
						{renderView()}
					</motion.div>
				) : (
					<Layout
						currentView={currentView}
						setView={setCurrentView}
						onToggleShortcuts={() => setIsShortcutsOpen((prev) => !prev)}
						isShortcutsOpen={isShortcutsOpen}
					>
						<motion.div
							key={currentView}
							initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							exit={shouldReduceMotion ? undefined : { opacity: 0, y: -10 }}
							transition={{ duration: shouldReduceMotion ? 0 : 0.3 }}
							className='pb-32'
						>
							{renderView()}
						</motion.div>
					</Layout>
				)}
			</AnimatePresence>

			<AnimatePresence>
				{isShortcutsOpen && currentView !== 'setup' && (
					<motion.div
						initial={shouldReduceMotion ? false : { opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={shouldReduceMotion ? undefined : { opacity: 0 }}
						className='fixed inset-0 z-[90]'
					>
						<button
							type='button'
							onClick={() => setIsShortcutsOpen(false)}
							className='absolute inset-0 bg-black/70 backdrop-blur-sm'
							aria-label='Close shortcut panel'
						/>
						<motion.section
							initial={shouldReduceMotion ? false : { opacity: 0, y: 20, scale: 0.98 }}
							animate={{ opacity: 1, y: 0, scale: 1 }}
							exit={shouldReduceMotion ? undefined : { opacity: 0, y: 10, scale: 0.98 }}
							transition={{ duration: shouldReduceMotion ? 0 : 0.18 }}
							className='relative mx-auto mt-20 w-[min(92vw,760px)] rounded-[2rem] border border-white/10 bg-[#101010]/95 p-6 md:p-8 shadow-2xl'
						>
							<div className='flex items-center gap-3 mb-5'>
								<div className='w-10 h-10 rounded-xl bg-[#7f98ff]/15 border border-[#7f98ff]/20 flex items-center justify-center'>
									<Keyboard className='w-5 h-5 text-[#00fdc1]' />
								</div>
								<div>
									<h2 className='font-headline text-2xl font-black tracking-tight'>
										Keyboard Shortcuts
									</h2>
									<p className='text-sm text-[#9f9f9f]'>Power controls for desktop flow.</p>
								</div>
							</div>

							<div className='grid gap-6 md:grid-cols-2'>
								<div className='space-y-2'>
									<div className='text-[10px] uppercase tracking-[0.2em] font-bold text-[#666666]'>
										Navigation
									</div>
									<div className='space-y-2'>
										<div className='flex items-center justify-between rounded-xl border border-white/10 bg-[#171717] px-3 py-2'>
											<span className='text-sm text-[#ababab]'>Go to Home</span>
											<kbd className='rounded-md bg-[#0f0f0f] px-2 py-1 text-xs font-bold text-white'>
												Ctrl/Cmd + 1
											</kbd>
										</div>
										<div className='flex items-center justify-between rounded-xl border border-white/10 bg-[#171717] px-3 py-2'>
											<span className='text-sm text-[#ababab]'>Go to History</span>
											<kbd className='rounded-md bg-[#0f0f0f] px-2 py-1 text-xs font-bold text-white'>
												Ctrl/Cmd + 2
											</kbd>
										</div>
										<div className='flex items-center justify-between rounded-xl border border-white/10 bg-[#171717] px-3 py-2'>
											<span className='text-sm text-[#ababab]'>Go to Analytics</span>
											<kbd className='rounded-md bg-[#0f0f0f] px-2 py-1 text-xs font-bold text-white'>
												Ctrl/Cmd + 3
											</kbd>
										</div>
										<div className='flex items-center justify-between rounded-xl border border-white/10 bg-[#171717] px-3 py-2'>
											<span className='text-sm text-[#ababab]'>Go to Settings</span>
											<kbd className='rounded-md bg-[#0f0f0f] px-2 py-1 text-xs font-bold text-white'>
												Ctrl/Cmd + 4
											</kbd>
										</div>
									</div>
								</div>

								<div className='space-y-2'>
									<div className='text-[10px] uppercase tracking-[0.2em] font-bold text-[#666666]'>
										Actions
									</div>
									<div className='space-y-2'>
										<div className='flex items-center justify-between rounded-xl border border-white/10 bg-[#171717] px-3 py-2'>
											<span className='text-sm text-[#ababab]'>Add dose (Home)</span>
											<kbd className='rounded-md bg-[#0f0f0f] px-2 py-1 text-xs font-bold text-white'>
												Ctrl/Cmd + Enter
											</kbd>
										</div>
										<div className='flex items-center justify-between rounded-xl border border-white/10 bg-[#171717] px-3 py-2'>
											<span className='text-sm text-[#ababab]'>Undo entry (Home)</span>
											<kbd className='rounded-md bg-[#0f0f0f] px-2 py-1 text-xs font-bold text-white'>
												Ctrl/Cmd + Backspace
											</kbd>
										</div>
										<div className='flex items-center justify-between rounded-xl border border-white/10 bg-[#171717] px-3 py-2'>
											<span className='text-sm text-[#ababab]'>Export backup (Settings)</span>
											<kbd className='rounded-md bg-[#0f0f0f] px-2 py-1 text-xs font-bold text-white'>
												Ctrl/Cmd + E
											</kbd>
										</div>
										<div className='flex items-center justify-between rounded-xl border border-white/10 bg-[#171717] px-3 py-2'>
											<span className='text-sm text-[#ababab]'>Toggle this panel</span>
											<kbd className='rounded-md bg-[#0f0f0f] px-2 py-1 text-xs font-bold text-white'>
												?
											</kbd>
										</div>
									</div>
								</div>
							</div>

							<div className='mt-6 text-xs text-[#777777]'>
								Shortcuts are disabled while typing in inputs and textareas.
							</div>
						</motion.section>
					</motion.div>
				)}
			</AnimatePresence>

			<StatusIndicator status={status} hasUpdate={hasUpdate} />
		</div>
	);
}

function ViewFallback({ title }: { title: string }) {
	return (
		<div className='rounded-[2rem] border border-white/10 bg-[#121212]/80 p-6 text-sm text-[#9b9b9b]'>{title}</div>
	);
}
