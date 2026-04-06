import { useState, useMemo, useEffect } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
	Plus,
	Minus,
	Undo2,
	Zap,
	Target,
	TrendingUp,
	Pencil,
	Check,
	X,
	Flame,
	Trophy,
	CheckCircle2,
	Calendar,
	Activity,
	ChevronRight,
} from 'lucide-react';
import { AppState, getEffectiveDate, getLogForDate, addEntry, undoLastEntry, updateDayLog } from '../lib/storage';
import { cn } from '../lib/utils';
import { addDays, format, differenceInHours, parseISO, startOfWeek, subDays } from 'date-fns';
import { View } from '../App';

interface HomeProps {
	state: AppState;
	updateState: (updater: (prev: AppState) => AppState) => void;
	setView: (view: View) => void;
}

export default function Home({ state, updateState, setView }: HomeProps) {
	const GRAM_STEP = 0.5;
	const formatGrams = (value: number) => (Number.isInteger(value) ? value.toString() : value.toFixed(1));
	const snapToHalfStep = (value: number) => Math.round(value / GRAM_STEP) * GRAM_STEP;
	const prefersReducedMotion = useReducedMotion();
	const dateStr = getEffectiveDate(new Date(), state.settings.resetTime);
	const log = getLogForDate(state, dateStr);
	const [portionModifier, setPortionModifier] = useState(0);
	const [isCorrectingToday, setIsCorrectingToday] = useState(false);
	const [correctValue, setCorrectValue] = useState(0);

	const progress = Math.min(1, log.total / state.settings.dailyGoal);
	const isGoalReached = log.total >= state.settings.dailyGoal;
	const remaining = Math.max(0, state.settings.dailyGoal - log.total);

	const basePortion =
		remaining > 0 && remaining < state.settings.portionSize ? remaining : state.settings.portionSize;
	const effectivePortion = basePortion + portionModifier;
	const isSmartCapped = remaining > 0 && remaining < state.settings.portionSize && portionModifier === 0;

	const lastEntry = log.entries[log.entries.length - 1];
	const lastLoggedTime = lastEntry ? format(new Date(lastEntry.time), 'hh:mm a') : 'No logs';
	const timeAgo = lastEntry ? `${differenceInHours(new Date(), new Date(lastEntry.time))}h ago` : 'Start now';

	const stats = useMemo(() => {
		const logDates = Object.keys(state.logs).sort().reverse();
		if (logDates.length === 0) return { currentStreak: 0, bestStreak: 0, finished: 0, active: 0, avg: '0' };

		let currentStreak = 0;
		let bestStreak = 0;
		let tempStreak = 0;
		let finished = 0;
		let totalGrams = 0;

		const today = getEffectiveDate(new Date(), state.settings.resetTime);
		const yesterday = getEffectiveDate(subDays(new Date(), 1), state.settings.resetTime);

		const sortedDates = Object.keys(state.logs).sort();
		const earliestDate = parseISO(sortedDates[0]);
		const latestDate = parseISO(today);

		let checkDate = today;
		if (getLogForDate(state, today).total < state.settings.dailyGoal) {
			checkDate = yesterday;
		}

		let streakActive = true;
		let d = new Date();
		if (checkDate === yesterday) d = subDays(d, 1);

		while (streakActive) {
			const dStr = getEffectiveDate(d, state.settings.resetTime);
			const dLog = getLogForDate(state, dStr);
			if (dLog.total >= state.settings.dailyGoal) {
				currentStreak++;
				d = subDays(d, 1);
			} else {
				streakActive = false;
			}
		}

		sortedDates.forEach((loggedDate) => {
			totalGrams += state.logs[loggedDate].total;
			if (state.logs[loggedDate].total >= state.settings.dailyGoal) {
				finished++;
			}
		});

		for (let day = earliestDate; day <= latestDate; day = addDays(day, 1)) {
			const dayKey = format(day, 'yyyy-MM-dd');
			const dLog = getLogForDate(state, dayKey);

			if (dLog.total >= state.settings.dailyGoal) {
				tempStreak++;
				bestStreak = Math.max(bestStreak, tempStreak);
			} else {
				tempStreak = 0;
			}
		}

		return {
			currentStreak,
			bestStreak,
			finished,
			active: sortedDates.length,
			avg: sortedDates.length > 0 ? formatGrams(snapToHalfStep(totalGrams / sortedDates.length)) : '0',
		};
	}, [state.logs, state.settings.dailyGoal]);

	const handleAdd = () => {
		updateState((prev) => addEntry(prev, effectivePortion));
		setPortionModifier(0);
	};

	const handleUndo = () => {
		updateState((prev) => undoLastEntry(prev));
	};

	const handleStartCorrectToday = () => {
		setCorrectValue(snapToHalfStep(log.total));
		setIsCorrectingToday(true);
	};

	const handleApplyCorrectToday = () => {
		updateState((prev) => updateDayLog(prev, dateStr, Math.max(0, snapToHalfStep(correctValue))));
		setIsCorrectingToday(false);
	};

	useEffect(() => {
		const onShortcutAdd = () => {
			if (effectivePortion <= 0) {
				return;
			}
			updateState((prev) => addEntry(prev, effectivePortion));
			setPortionModifier(0);
		};

		const onShortcutUndo = () => {
			updateState((prev) => undoLastEntry(prev));
		};

		window.addEventListener('ct:home-add', onShortcutAdd as EventListener);
		window.addEventListener('ct:home-undo', onShortcutUndo as EventListener);

		return () => {
			window.removeEventListener('ct:home-add', onShortcutAdd as EventListener);
			window.removeEventListener('ct:home-undo', onShortcutUndo as EventListener);
		};
	}, [effectivePortion, updateState]);

	const weeklyChartCarousel = state.settings.weeklyChartCarousel ?? true;

	const weeklyData = useMemo(() => {
		const effectiveToday = parseISO(dateStr);

		if (weeklyChartCarousel) {
			return Array.from({ length: 7 }).map((_, i) => {
				const dayDate = subDays(effectiveToday, 6 - i);
				const dayKey = format(dayDate, 'yyyy-MM-dd');
				const dLog = getLogForDate(state, dayKey);
				return {
					day: format(dayDate, 'EEE'),
					total: dLog.total,
					isToday: dayKey === dateStr,
				};
			});
		}

		const monday = startOfWeek(effectiveToday, { weekStartsOn: 1 });
		return Array.from({ length: 7 }).map((_, i) => {
			const dayDate = addDays(monday, i);
			const dayKey = format(dayDate, 'yyyy-MM-dd');
			const dLog = getLogForDate(state, dayKey);
			return {
				day: format(dayDate, 'EEE'),
				total: dLog.total,
				isToday: dayKey === dateStr,
			};
		});
	}, [state.logs, dateStr, weeklyChartCarousel]);

	const weeklyChartMax = useMemo(() => {
		const maxTotal = weeklyData.reduce((max, day) => Math.max(max, day.total), 0);
		if (maxTotal <= 10) return 10;
		return Math.min(25, Math.ceil(maxTotal / 5) * 5);
	}, [weeklyData]);

	const weeklyAxisTicks = useMemo(() => [weeklyChartMax, Math.round(weeklyChartMax / 2), 0], [weeklyChartMax]);

	return (
		<div className='grid w-full gap-6 pb-24 pt-4 xl:grid-cols-12 xl:items-start'>
			{/* Hero Progress - Bento Style */}
			<section className='w-full xl:col-span-8'>
				<div className='w-full bg-[#111111] rounded-[2.5rem] p-8 border border-white/5 shadow-2xl relative overflow-hidden'>
					<div className='absolute -right-20 -top-20 w-64 h-64 bg-[#00fdc1]/6 blur-[90px] rounded-full pointer-events-none' />
					<div className='absolute -left-14 -bottom-16 w-52 h-52 bg-[#4a3b30]/14 blur-[90px] rounded-full pointer-events-none' />

					<div className='flex flex-col items-center text-center relative z-10'>
						<div className='flex items-center gap-2 mb-6'>
							<div className='w-1.5 h-1.5 rounded-full bg-[#00fdc1] animate-pulse' />
							<span className='text-[10px] uppercase tracking-[0.4em] font-black text-[#444444]'>
								Daily Amount
							</span>
						</div>

						<div className='relative mb-8'>
							<div className='flex items-baseline justify-center'>
								<motion.span
									key={log.total}
									initial={{ opacity: 0, y: 10 }}
									animate={{ opacity: 1, y: 0 }}
									className='font-headline font-black text-8xl text-white tracking-tighter'
								>
									{log.total}
								</motion.span>
								<span className='text-2xl font-bold text-[#333333] ml-2'>
									/ {state.settings.dailyGoal}g
								</span>
							</div>
							<div className='text-[10px] font-bold text-[#555555] uppercase tracking-widest mt-1'>
								Daily Intake
							</div>
						</div>

						{/* Progress Beam */}
						<div className='w-full h-1.5 bg-[#1a1a1a] rounded-full mb-4 overflow-hidden'>
							<motion.div
								initial={false}
								animate={{ width: `${progress * 100}%` }}
								transition={{ duration: prefersReducedMotion ? 0 : 0.22, ease: 'easeOut' }}
								className={cn(
									'h-full',
									isGoalReached
										? 'bg-[#4a3b30] shadow-[0_0_25px_rgba(74,59,48,0.6)]'
										: 'bg-[#7f98ff]',
								)}
							/>
						</div>

						<div className='flex justify-between w-full px-1'>
							<div className='flex items-center gap-1.5'>
								<Target
									className={cn('w-3.5 h-3.5', isGoalReached ? 'text-tertiary' : 'text-[#444444]')}
								/>
								<span
									className={cn(
										'text-[10px] font-bold uppercase tracking-widest',
										isGoalReached ? 'text-tertiary' : 'text-[#666666]',
									)}
								>
									{isGoalReached ? 'Complete' : `${Math.round(progress * 100)}% Amount`}
								</span>
							</div>
							<div className='flex items-center gap-1.5'>
								<TrendingUp className='w-3.5 h-3.5 text-[#7f98ff]' />
								<span className='text-[10px] font-bold text-[#666666] uppercase tracking-widest'>
									{stats.currentStreak} Day Streak
								</span>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Control Panel */}
			<div className='w-full grid grid-cols-1 gap-4 xl:col-span-8'>
				<div className='bg-[#111111] rounded-[2rem] p-8 border border-white/5 relative overflow-hidden'>
					<div className='absolute -right-16 -top-20 w-56 h-56 bg-[#00fdc1]/8 blur-[90px] rounded-full pointer-events-none' />
					<div className='absolute -left-16 -bottom-20 w-56 h-56 bg-[#4a3b30]/14 blur-[90px] rounded-full pointer-events-none' />
					<div className='relative z-10 flex flex-col items-center gap-6 w-full'>
						<div className='flex items-center justify-between w-full px-4'>
							<button
								aria-label='Decrease next dose amount'
								title='Decrease next dose amount'
								onClick={() => setPortionModifier((prev) => snapToHalfStep(prev - GRAM_STEP))}
								className='w-12 h-12 rounded-full bg-[#1a1a1a] flex items-center justify-center text-[#666666] active:scale-90 transition-[color,background-color,transform] duration-150 hover:text-white border border-white/5'
							>
								<Minus className='w-5 h-5' />
							</button>

							<div className='flex flex-col items-center'>
								<div className='flex items-baseline relative'>
									<span className='text-4xl font-headline font-black text-white'>
										{formatGrams(Math.max(0, snapToHalfStep(effectivePortion)))}
									</span>
									<span className='text-sm font-bold text-[#444444] ml-1'>g</span>
									{isSmartCapped && (
										<div className='absolute top-13 left-1/2 -translate-x-1/2 whitespace-nowrap'>
											<span className='text-[8px] font-black text-[#00fdc1] uppercase tracking-widest bg-[#00fdc1]/10 px-1.5 py-0.5 rounded-full border border-[#00fdc1]/20'>
												Smart Cap
											</span>
										</div>
									)}
								</div>
								<span className='text-[9px] font-bold text-primary tracking-[0.3em] uppercase mt-1'>
									Next Dose
								</span>
							</div>

							<button
								aria-label='Increase next dose amount'
								title='Increase next dose amount'
								onClick={() => setPortionModifier((prev) => snapToHalfStep(prev + GRAM_STEP))}
								className='w-12 h-12 rounded-full bg-[#1a1a1a] flex items-center justify-center text-[#666666] active:scale-90 transition-[color,background-color,transform] duration-150 hover:text-white border border-white/5'
							>
								<Plus className='w-5 h-5' />
							</button>
						</div>

						<button
							onClick={handleAdd}
							disabled={effectivePortion <= 0}
							className={cn(
								'w-full min-h-[52px] py-4 rounded-[1.5rem] font-headline font-black text-sm uppercase tracking-[0.2em] transition-[background-color,color,opacity,transform] duration-150 active:scale-[0.97] shadow-xl',
								effectivePortion <= 0
									? 'bg-[#1a1a1a] text-[#444444] cursor-not-allowed'
									: isGoalReached
										? 'bg-[#4a3b30] text-[#f1e8df] hover:opacity-90'
										: 'bg-white text-black hover:bg-[#f0f0f0]',
							)}
						>
							Add Creatine
						</button>

						{!isCorrectingToday && (
							<div className='grid grid-cols-2 gap-3 w-full'>
								<button
									onClick={handleUndo}
									className='min-h-[46px] rounded-xl border border-white/10 bg-[#171717] flex items-center justify-center gap-2 text-[#ababab] hover:text-[#ff716c] hover:border-[#ff716c]/30 transition-colors'
								>
									<Undo2 className='w-4 h-4' />
									<span className='text-[10px] font-bold tracking-widest uppercase'>Rollback</span>
								</button>
								<button
									onClick={handleStartCorrectToday}
									className='min-h-[46px] rounded-xl border border-white/10 bg-[#171717] flex items-center justify-center gap-2 text-[#ababab] hover:text-[#00fdc1] hover:border-[#00fdc1]/30 transition-colors'
								>
									<Pencil className='w-4 h-4' />
									<span className='text-[10px] font-bold tracking-widest uppercase'>
										Correct Today
									</span>
								</button>
							</div>
						)}

						{isCorrectingToday && (
							<motion.div
								initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: prefersReducedMotion ? 0 : 0.18, ease: 'easeOut' }}
								className='w-full p-4 rounded-2xl bg-[#0f0f0f] border border-white/10 flex items-center justify-between gap-3'
							>
								<div className='flex items-center gap-2'>
									<button
										onClick={() =>
											setCorrectValue((prev) => Math.max(0, snapToHalfStep(prev - GRAM_STEP)))
										}
										aria-label='Decrease today total'
										title='Decrease today total'
										className='w-11 h-11 rounded-full bg-[#1a1a1a] border border-white/10 text-white flex items-center justify-center transition-[background-color,border-color,transform] duration-150 active:scale-90'
									>
										<Minus className='w-4 h-4' />
									</button>
									<span className='text-lg font-headline font-bold text-white w-14 text-center'>
										{formatGrams(correctValue)}g
									</span>
									<button
										onClick={() => setCorrectValue((prev) => snapToHalfStep(prev + GRAM_STEP))}
										aria-label='Increase today total'
										title='Increase today total'
										className='w-11 h-11 rounded-full bg-[#1a1a1a] border border-white/10 text-white flex items-center justify-center transition-[background-color,border-color,transform] duration-150 active:scale-90'
									>
										<Plus className='w-4 h-4' />
									</button>
								</div>
								<div className='flex items-center gap-2'>
									<button
										onClick={() => setIsCorrectingToday(false)}
										aria-label='Cancel correction'
										title='Cancel correction'
										className='w-11 h-11 rounded-full bg-[#1a1a1a] border border-white/10 text-[#ababab] flex items-center justify-center transition-[background-color,border-color,color,transform] duration-150 active:scale-90'
									>
										<X className='w-4 h-4' />
									</button>
									<button
										onClick={handleApplyCorrectToday}
										aria-label='Apply today correction'
										title='Apply today correction'
										className='w-11 h-11 rounded-full bg-[#00fdc1] text-[#004734] flex items-center justify-center transition-[opacity,transform] duration-150 active:scale-90'
									>
										<Check className='w-4 h-4' />
									</button>
								</div>
							</motion.div>
						)}
					</div>
				</div>
			</div>

			{/* Activity Chart */}
			<section className='w-full bg-[#111111] rounded-[2rem] p-6 border border-white/5 relative overflow-hidden xl:col-span-8'>
				<div className='absolute -right-16 -top-16 w-52 h-52 bg-[#00fdc1]/8 blur-[90px] rounded-full pointer-events-none' />
				<div className='absolute -left-16 -bottom-20 w-56 h-56 bg-[#4a3b30]/14 blur-[90px] rounded-full pointer-events-none' />
				<div className='relative z-10'>
					<div className='flex items-center justify-between mb-6'>
						<button
							onClick={() => setView('history')}
							className='flex items-center gap-2 group transition-[color,opacity,transform] duration-150 active:scale-[0.98]'
						>
							<Activity className='w-4 h-4 text-[#7f98ff]' />
							<span className='text-[10px] font-bold text-[#666666] uppercase tracking-widest group-hover:text-white transition-colors'>
								Last 7 Days
							</span>
							<ChevronRight className='w-4 h-4 text-[#333333] group-hover:text-white transition-colors' />
						</button>
						<div className='md:hidden w-[3.5rem]' aria-hidden='true' />
					</div>
					<div className='relative px-2'>
						<div className='relative h-28 w-full max-w-[420px] md:max-w-[720px] lg:max-w-full mx-auto'>
							<div className='absolute -left-6 top-0 h-[calc(100%-2rem)] flex flex-col justify-between items-end'>
								{weeklyAxisTicks.map((tick) => (
									<span key={tick} className='text-[8px] font-bold text-[#4a4a4a] leading-none'>
										{tick}g
									</span>
								))}
							</div>
							<div className='relative h-full flex items-end justify-between gap-2'>
								{weeklyData.map((d, i) => {
									const relativeHeight = (d.total / weeklyChartMax) * 100;
									const barHeight = d.total > 0 ? Math.max(12, relativeHeight) : 2;
									return (
										<div key={i} className='h-full flex flex-col items-center justify-end flex-1'>
											<div className='w-full h-[calc(100%-2.25rem)] flex items-end'>
												<motion.div
													initial={false}
													animate={{ height: `${Math.min(100, barHeight)}%` }}
													transition={{
														duration: prefersReducedMotion ? 0 : 0.24,
														ease: 'easeOut',
													}}
													className={cn(
														'w-full rounded-md flex items-start justify-center pt-1',
														d.isToday
															? 'bg-[#00fdc1] shadow-[0_0_8px_rgba(0,253,193,0.35)]'
															: d.total > 0
																? 'bg-[#8a837c]'
																: 'bg-[#6a6560]/40',
													)}
												>
													{d.total > 0 && (
														<span
															className={cn(
																'text-[8px] font-bold leading-none',
																d.isToday ? 'text-[#063f32]' : 'text-[#f0ece8]',
															)}
														>
															{d.total}
														</span>
													)}
												</motion.div>
											</div>
											<span
												className={cn(
													'text-[10px] font-semibold tracking-tight mt-2',
													d.isToday ? 'text-white' : 'text-[#55514c]',
												)}
											>
												{d.day}
											</span>
										</div>
									);
								})}
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Stats Bento Grid */}
			<div className='grid grid-cols-2 xl:grid-cols-1 gap-4 w-full relative xl:col-span-4 xl:col-start-9 xl:row-start-1 xl:row-span-3 xl:sticky xl:top-24'>
				<div className='absolute -right-12 -top-10 w-48 h-48 bg-[#00fdc1]/7 blur-[90px] rounded-full pointer-events-none' />
				<div className='absolute -left-12 -bottom-10 w-48 h-48 bg-[#4a3b30]/20 blur-[90px] rounded-full pointer-events-none' />
				<div className='col-span-2 xl:col-span-1 bg-[#111111] rounded-[1.5rem] p-5 border border-white/5 relative overflow-hidden'>
					<div className='absolute -right-10 -top-10 w-32 h-32 bg-[#00fdc1]/8 blur-[75px] rounded-full pointer-events-none' />
					<div className='text-[9px] font-bold uppercase tracking-widest text-[#666666] mb-3'>
						Quick Status
					</div>
					<div className='grid grid-cols-2 gap-3'>
						<div className='rounded-xl bg-[#171717] border border-white/5 p-3'>
							<div className='text-[8px] font-bold uppercase tracking-widest text-[#666666]'>
								Last Log
							</div>
							<div className='text-sm font-bold text-white mt-1'>{lastLoggedTime}</div>
						</div>
						<div className='rounded-xl bg-[#171717] border border-white/5 p-3'>
							<div className='text-[8px] font-bold uppercase tracking-widest text-[#666666]'>Elapsed</div>
							<div className='text-sm font-bold text-white mt-1'>{timeAgo}</div>
						</div>
					</div>
				</div>
				<div className='bg-[#111111] rounded-[1.5rem] p-5 flex flex-col border border-white/5'>
					<div className='flex items-center gap-2 mb-3'>
						<Flame className='w-3.5 h-3.5 text-[#ff716c]' />
						<span className='text-[9px] font-bold uppercase tracking-widest text-[#666666]'>
							Current Streak
						</span>
					</div>
					<span className='text-2xl font-headline font-black text-white mb-0.5'>{stats.currentStreak}d</span>
					<span className='text-[9px] font-bold text-tertiary uppercase tracking-wider'>Consecutive</span>
				</div>
				<div className='bg-[#111111] rounded-[1.5rem] p-5 flex flex-col border border-[#4a3b30]/35'>
					<div className='flex items-center gap-2 mb-3'>
						<Trophy className='text-[#ffcc00] w-3.5 h-3.5' />
						<span className='text-[9px] font-bold uppercase tracking-widest text-[#666666]'>
							Best Streak
						</span>
					</div>
					<span className='text-2xl font-headline font-black text-white mb-0.5'>{stats.bestStreak}d</span>
					<span className='text-[9px] font-bold text-tertiary uppercase tracking-wider'>All-time record</span>
				</div>
				<div className='bg-[#111111] rounded-[1.5rem] p-5 flex flex-col border border-white/5'>
					<div className='flex items-center gap-2 mb-3'>
						<CheckCircle2 className='text-[#00fdc1] w-3.5 h-3.5' />
						<span className='text-[9px] font-bold uppercase tracking-widest text-[#666666]'>Finished</span>
					</div>
					<span className='text-2xl font-headline font-black text-white mb-0.5'>{stats.finished}</span>
					<span className='text-[9px] font-bold text-tertiary uppercase tracking-wider'>Days completed</span>
				</div>
				<div className='bg-[#111111] rounded-[1.5rem] p-5 flex flex-col border border-white/5'>
					<div className='flex items-center gap-2 mb-3'>
						<Calendar className='text-[#7f98ff] w-3.5 h-3.5' />
						<span className='text-[9px] font-bold uppercase tracking-widest text-[#666666]'>
							Days Active
						</span>
					</div>
					<span className='text-2xl font-headline font-black text-white mb-0.5'>{stats.active}</span>
					<span className='text-[9px] font-bold text-tertiary uppercase tracking-wider'>
						Total days logged
					</span>
				</div>
				<div className='col-span-2 xl:col-span-1 bg-[#111111] rounded-[1.5rem] p-5 flex items-center justify-between border border-[#4a3b30]/35'>
					<div className='flex flex-col'>
						<div className='flex items-center gap-2 mb-1'>
							<Zap className='text-[#00fdc1] w-3.5 h-3.5' />
							<span className='text-[9px] font-bold uppercase tracking-widest text-[#666666]'>
								Daily Average
							</span>
						</div>
						<span className='text-2xl font-headline font-black text-white'>{stats.avg}g</span>
					</div>
					<div className='text-right'>
						<span className='text-[9px] font-bold text-tertiary uppercase tracking-wider block'>
							Remaining Today
						</span>
						<span className='text-xl font-headline font-black text-[#00fdc1]'>{remaining}g</span>
					</div>
				</div>
			</div>
		</div>
	);
}
