import { ReactNode } from 'react';
import {
	Settings as SettingsIcon,
	ChevronLeft,
	House,
	CalendarDays,
	ChartNoAxesCombined,
	Keyboard,
	Download,
	Ellipsis,
	X,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { View } from '../App';
import { Glow } from './ui';
import { useInstallPrompt } from '../hooks/useInstallPrompt.ts';
import { useEffect, useMemo, useState } from 'react';

interface LayoutProps {
	children: ReactNode;
	currentView: View;
	setView: (view: View) => void;
	onToggleShortcuts: () => void;
	isShortcutsOpen: boolean;
}

const navItems: Array<{
	view: Exclude<View, 'setup'>;
	label: string;
	icon: React.ComponentType<{ className?: string }>;
}> = [
	{ view: 'home', label: 'Home', icon: House },
	{ view: 'history', label: 'History', icon: CalendarDays },
	{ view: 'analytics', label: 'Analytics', icon: ChartNoAxesCombined },
	{ view: 'settings', label: 'Settings', icon: SettingsIcon },
];

export default function Layout({ children, currentView, setView, onToggleShortcuts, isShortcutsOpen }: LayoutProps) {
	const { canInstall, install } = useInstallPrompt();
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

	useEffect(() => {
		setIsMobileMenuOpen(false);
	}, [currentView]);

	const mobileNavItems = useMemo(
		() => [
			{ view: 'history' as const, label: 'History', icon: CalendarDays },
			{ view: 'analytics' as const, label: 'Analytics', icon: ChartNoAxesCombined },
			{ view: 'settings' as const, label: 'Settings', icon: SettingsIcon },
		],
		[],
	);

	return (
		<div className='relative min-h-screen w-full max-w-md md:max-w-5xl lg:max-w-6xl xl:max-w-[88rem] 2xl:max-w-[104rem] mx-auto'>
			<header className='fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-[#0e0e0e] to-transparent h-[calc(4rem+env(safe-area-inset-top))] pt-[env(safe-area-inset-top)]'>
				<div className='w-full max-w-md md:max-w-5xl lg:max-w-6xl xl:max-w-[88rem] 2xl:max-w-[104rem] mx-auto px-6 md:px-8 h-full'>
					<div className='grid h-full grid-cols-[3rem_1fr_auto] items-center'>
						<div className='flex items-center justify-start'>
							<div className='w-11 h-11 md:w-10 md:h-10 flex items-center justify-center'>
								{currentView !== 'home' && (
									<button
										onClick={() => setView('home')}
										aria-label='Go back to home'
										title='Go back to home'
										className='flex items-center justify-center w-11 h-11 md:w-10 md:h-10 rounded-full text-[#ababab] hover:bg-white/5 transition-[background-color,color,transform] duration-150 active:scale-90'
									>
										<ChevronLeft className='w-6 h-6' />
									</button>
								)}
							</div>
						</div>

						<div className='hidden md:flex items-center justify-center'>
							{currentView === 'home' && (
								<div className='flex items-center gap-2 rounded-full border border-white/10 px-3 h-9 bg-[#121212]/70 backdrop-blur'>
									<div className='w-1.5 h-1.5 rounded-full bg-[#00fdc1]' />
									<span className='text-[10px] font-bold uppercase tracking-[0.2em] text-[#7f98ff]'>
										Desktop Mode
									</span>
								</div>
							)}
						</div>

						<div className='flex items-center justify-end'>
							<div className='flex items-center gap-1 md:hidden'>
								{mobileNavItems.map((item) => {
									const Icon = item.icon;
									const isActive = currentView === item.view;
									return (
										<button
											key={item.view}
											onClick={() => setView(item.view)}
											aria-label={item.label}
											title={item.label}
											className={cn(
												'w-11 h-11 rounded-full flex items-center justify-center transition-[background-color,color,transform] duration-150 active:scale-90',
												isActive
													? 'bg-[#7f98ff]/16 text-white'
													: 'text-[#ababab] hover:bg-white/5',
											)}
										>
											<Icon className={cn('w-5 h-5', isActive && 'text-[#00fdc1]')} />
										</button>
									);
								})}
								<button
									onClick={() => setIsMobileMenuOpen((prev) => !prev)}
									aria-label='More actions'
									title='More actions'
									className='w-11 h-11 rounded-full flex items-center justify-center text-[#ababab] hover:bg-white/5 transition-[background-color,color,transform] duration-150 active:scale-90'
								>
									{isMobileMenuOpen ? <X className='w-5 h-5' /> : <Ellipsis className='w-5 h-5' />}
								</button>
							</div>

							<div className='hidden md:flex items-center gap-1'>
								{canInstall && (
									<button
										onClick={install}
										aria-label='Install app'
										title='Install app'
										className='flex items-center justify-center w-10 h-10 rounded-full text-[#ababab] hover:bg-white/5 transition-[background-color,color,transform] duration-150 active:scale-90'
									>
										<Download className='w-5 h-5' />
									</button>
								)}
								{!isShortcutsOpen && (
									<button
										onClick={onToggleShortcuts}
										aria-label='Open keyboard shortcuts'
										title='Open keyboard shortcuts'
										className='flex items-center justify-center w-10 h-10 rounded-full text-[#ababab] hover:bg-white/5 transition-[background-color,color,transform] duration-150 active:scale-90'
									>
										<Keyboard className='w-5 h-5' />
									</button>
								)}
								{currentView !== 'history' && (
									<button
										onClick={() => setView('history')}
										aria-label='Open history'
										title='Open history'
										className='flex items-center justify-center w-10 h-10 rounded-full text-[#ababab] hover:bg-white/5 transition-[background-color,color,transform] duration-150 active:scale-90'
									>
										<CalendarDays className='w-5 h-5' />
									</button>
								)}
								{currentView !== 'analytics' && (
									<button
										onClick={() => setView('analytics')}
										aria-label='Open analytics'
										title='Open analytics'
										className='flex items-center justify-center w-10 h-10 rounded-full text-[#ababab] hover:bg-white/5 transition-[background-color,color,transform] duration-150 active:scale-90'
									>
										<ChartNoAxesCombined className='w-5 h-5' />
									</button>
								)}
								{currentView !== 'home' && (
									<button
										onClick={() => setView('home')}
										aria-label='Go to home'
										title='Go to home'
										className='flex items-center justify-center w-10 h-10 rounded-full text-[#ababab] hover:bg-white/5 transition-[background-color,color,transform] duration-150 active:scale-90'
									>
										<House className='w-5 h-5' />
									</button>
								)}
								{currentView !== 'settings' && (
									<button
										onClick={() => setView('settings')}
										aria-label='Open settings'
										title='Open settings'
										className='flex items-center justify-center w-10 h-10 rounded-full text-[#ababab] hover:bg-white/5 transition-[background-color,color,transform] duration-150 active:scale-90'
									>
										<SettingsIcon className='w-5 h-5' />
									</button>
								)}
							</div>
						</div>
					</div>
				</div>

				{isMobileMenuOpen && (
					<div className='md:hidden absolute top-[calc(4rem+env(safe-area-inset-top)-0.25rem)] right-6 z-50 w-[13rem] rounded-2xl border border-white/10 bg-[#111111]/95 backdrop-blur-xl p-2 shadow-2xl'>
						<button
							onClick={() => {
								setView('home');
								setIsMobileMenuOpen(false);
							}}
							className='w-full h-11 rounded-xl px-3 flex items-center gap-3 text-[#ababab] hover:bg-white/5 transition-[background-color,color,transform] duration-150 active:scale-[0.98]'
							aria-label='Go to home'
							title='Go to home'
						>
							<House className='w-4 h-4' />
							<span className='text-xs font-bold uppercase tracking-[0.16em]'>Home</span>
						</button>
						{canInstall && (
							<button
								onClick={() => {
									install();
									setIsMobileMenuOpen(false);
								}}
								className='w-full h-11 rounded-xl px-3 flex items-center gap-3 text-[#ababab] hover:bg-white/5 transition-[background-color,color,transform] duration-150 active:scale-[0.98]'
								aria-label='Install app'
								title='Install app'
							>
								<Download className='w-4 h-4' />
								<span className='text-xs font-bold uppercase tracking-[0.16em]'>Install</span>
							</button>
						)}
					</div>
				)}
			</header>

			<main className='px-6 md:px-8 pt-[calc(4rem+env(safe-area-inset-top))] pb-[calc(1.5rem+env(safe-area-inset-bottom))] md:pb-[max(0px,env(safe-area-inset-bottom))]'>
				<div className='xl:grid xl:grid-cols-[240px_minmax(0,1fr)] xl:gap-8'>
					<aside className='hidden xl:block pt-6'>
						<div className='sticky top-24 space-y-4'>
							<div className='bg-[#121212]/85 backdrop-blur-xl rounded-[1.75rem] border border-white/10 p-3'>
								<div className='px-2 pb-2 pt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#666666]'>
									Navigation
								</div>
								<nav className='space-y-1.5'>
									{navItems.map((item) => {
										const Icon = item.icon;
										const isActive = currentView === item.view;

										return (
											<button
												key={item.view}
												onClick={() => setView(item.view)}
												className={cn(
													'w-full h-11 rounded-xl px-3 flex items-center gap-3 transition-all text-left',
													isActive
														? 'bg-[#7f98ff]/20 border border-[#7f98ff]/25 text-white'
														: 'text-[#ababab] hover:bg-white/5 border border-transparent',
												)}
												aria-label={
													isActive
														? `${item.label} (current view)`
														: `Open ${item.label.toLowerCase()}`
												}
												title={
													isActive
														? `${item.label} (current view)`
														: `Open ${item.label.toLowerCase()}`
												}
											>
												<Icon className={cn('w-4 h-4', isActive && 'text-[#00fdc1]')} />
												<span className='text-sm font-semibold'>{item.label}</span>
											</button>
										);
									})}
								</nav>
							</div>
						</div>
					</aside>

					<div className='min-w-0'>{children}</div>
				</div>
			</main>

			{/* Ambient Glows */}
			<Glow
				color='primary'
				position='top-right'
				size='w-[500px] h-[500px] md:w-[760px] md:h-[760px] lg:w-[920px] lg:h-[920px] xl:w-[1000px] xl:h-[1000px]'
				blurSize='blur-[120px] md:blur-[190px] lg:blur-[230px] xl:blur-[250px]'
				className='fixed -z-20 translate-x-1/2 -translate-y-1/2 xl:translate-x-[38%]'
			/>
			<Glow
				color='secondary'
				position='bottom-left'
				size='w-[400px] h-[400px] md:w-[640px] md:h-[640px] lg:w-[760px] lg:h-[760px] xl:w-[860px] xl:h-[860px]'
				blurSize='blur-[100px] md:blur-[170px] lg:blur-[200px] xl:blur-[220px]'
				className='fixed -z-20 -translate-x-1/2 translate-y-1/2 xl:-translate-x-[42%]'
			/>
		</div>
	);
}
