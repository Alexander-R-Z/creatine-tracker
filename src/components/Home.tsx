import { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import {
	Plus,
	Minus,
	Undo2,
	History as HistoryIcon,
	Zap,
	Target,
	TrendingUp,
	Flame,
	Trophy,
	CheckCircle2,
	Calendar,
	Activity,
	ChevronRight,
} from 'lucide-react';
import { AppState, getEffectiveDate, getLogForDate, addEntry, undoLastEntry } from '../lib/storage';
import { cn } from '../lib/utils';
import { format, differenceInHours, subDays } from 'date-fns';
import { View } from '../App';

interface HomeProps {
	state: AppState;
	updateState: (updater: (prev: AppState) => AppState) => void;
	setView: (view: View) => void;
}

export default function Home({ state, updateState, setView }: HomeProps) {
	const dateStr = getEffectiveDate(new Date(), state.settings.resetTime);
	const log = getLogForDate(state, dateStr);
	const [portionModifier, setPortionModifier] = useState(0);

	const progress = Math.min(1, log.total / state.settings.dailyGoal);
	const isGoalReached = log.total >= state.settings.dailyGoal;
	const remaining = Math.max(0, state.settings.dailyGoal - log.total);

	// Smart portion logic: if remaining is less than the intended portion, cap it
	// But allow going beyond if manually adjusted via + button
	const basePortion =
		remaining > 0 && remaining < state.settings.portionSize ? remaining : state.settings.portionSize;
	const effectivePortion = basePortion + portionModifier;
	const isSmartCapped = remaining > 0 && remaining < state.settings.portionSize && portionModifier === 0;

	const lastEntry = log.entries[log.entries.length - 1];
	const lastLoggedTime = lastEntry ? format(new Date(lastEntry.time), 'hh:mm a') : 'No logs';
	const timeAgo = lastEntry ? `${differenceInHours(new Date(), new Date(lastEntry.time))}h ago` : 'Start now';

	// Advanced Stats Calculation
	const stats = useMemo(() => {
		const logDates = Object.keys(state.logs).sort().reverse();
		if (logDates.length === 0) return { currentStreak: 0, bestStreak: 0, finished: 0, active: 0, avg: 0 };

		let currentStreak = 0;
		let bestStreak = 0;
		let tempStreak = 0;
		let finished = 0;
		let totalGrams = 0;

		const today = getEffectiveDate(new Date(), state.settings.resetTime);
		const yesterday = getEffectiveDate(subDays(new Date(), 1), state.settings.resetTime);

		// Calculate streaks and totals
		const sortedDates = Object.keys(state.logs).sort();

		// For current streak, we need to check from today backwards
		let checkDate = today;
		if (getLogForDate(state, today).total < state.settings.dailyGoal) {
			checkDate = yesterday;
		}

		let streakActive = true;
		let d = new Date();
		// Adjust d to the effective checkDate
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

		// Best streak and other totals
		sortedDates.forEach((dateStr, index) => {
			const dLog = state.logs[dateStr];
			totalGrams += dLog.total;

			if (dLog.total >= state.settings.dailyGoal) {
				finished++;
				tempStreak++;
				bestStreak = Math.max(bestStreak, tempStreak);
			} else {
				tempStreak = 0;
			}
		});

		return {
			currentStreak,
			bestStreak,
			finished,
			active: sortedDates.length,
			avg: sortedDates.length > 0 ? (totalGrams / sortedDates.length).toFixed(1) : 0,
		};
	}, [state.logs, state.settings.dailyGoal]);

	const handleAdd = () => {
		updateState((prev) => addEntry(prev, effectivePortion));
		setPortionModifier(0);
	};

	const handleUndo = () => {
		updateState((prev) => undoLastEntry(prev));
	};

	// Weekly Data for the chart
	const weeklyData = Array.from({ length: 7 }).map((_, i) => {
		const d = subDays(new Date(), 6 - i);
		const dStr = getEffectiveDate(d, state.settings.resetTime);
		const dLog = getLogForDate(state, dStr);
		return {
			day: format(d, 'EEE'),
			total: dLog.total,
			goal: state.settings.dailyGoal,
			isToday: i === 6,
		};
	});

	return (
		<div className='flex flex-col items-center w-full space-y-6 pb-24'>
			{/* Hero Progress - Bento Style */}
			<section className='w-full mt-4'>
				<div className='w-full bg-[#111111] rounded-[2.5rem] p-8 border border-white/5 shadow-2xl relative overflow-hidden'>
					<div className='absolute -right-20 -top-20 w-64 h-64 bg-[#00fdc1]/5 blur-[100px] rounded-full' />

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
								initial={{ width: 0 }}
								animate={{ width: `${progress * 100}%` }}
								transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
								className={cn(
									'h-full transition-all duration-700',
									isGoalReached
										? 'bg-secondary shadow-[0_0_25px_rgba(74,59,48,0.5)]'
										: 'bg-[#7f98ff]',
								)}
							/>
						</div>

						<div className='flex justify-between w-full px-1'>
							<div className='flex items-center gap-1.5'>
								<Target
									className={cn('w-3.5 h-3.5', isGoalReached ? 'text-secondary' : 'text-[#444444]')}
								/>
								<span
									className={cn(
										'text-[10px] font-bold uppercase tracking-widest',
										isGoalReached ? 'text-secondary' : 'text-[#666666]',
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
			<div className='w-full grid grid-cols-1 gap-4'>
				<div className='bg-[#111111] rounded-[2rem] p-6 border border-white/5 flex flex-col items-center gap-6'>
					<div className='flex items-center justify-between w-full px-4'>
						<button
							aria-label='Decrease next dose amount'
							title='Decrease next dose amount'
							onClick={() => setPortionModifier((prev) => prev - 1)}
							className='w-12 h-12 rounded-full bg-[#1a1a1a] flex items-center justify-center text-[#666666] active:scale-90 transition-all hover:text-white border border-white/5'
						>
							<Minus className='w-5 h-5' />
						</button>

						<div className='flex flex-col items-center'>
							<div className='flex items-baseline relative'>
								<span className='text-4xl font-headline font-black text-white'>{effectivePortion}</span>
								<span className='text-sm font-bold text-[#444444] ml-1'>g</span>
								{isSmartCapped && (
									<div className='absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap'>
										<span className='text-[8px] font-black text-[#00fdc1] uppercase tracking-widest bg-[#00fdc1]/10 px-1.5 py-0.5 rounded-full border border-[#00fdc1]/20'>
											Smart Cap
										</span>
									</div>
								)}
							</div>
							<span className='text-[9px] font-bold text-[#00fdc1] tracking-[0.3em] uppercase mt-1'>
								Next Dose
							</span>
						</div>

						<button
							aria-label='Increase next dose amount'
							title='Increase next dose amount'
							onClick={() => setPortionModifier((prev) => prev + 1)}
							className='w-12 h-12 rounded-full bg-[#1a1a1a] flex items-center justify-center text-[#666666] active:scale-90 transition-all hover:text-white border border-white/5'
						>
							<Plus className='w-5 h-5' />
						</button>
					</div>

					<button
						onClick={handleAdd}
						disabled={effectivePortion <= 0}
						className={cn(
							'w-full py-5 rounded-2xl font-headline font-black text-sm uppercase tracking-[0.2em] transition-all active:scale-[0.97] shadow-xl',
							effectivePortion <= 0
								? 'bg-[#1a1a1a] text-[#444444] cursor-not-allowed'
								: isGoalReached
									? 'bg-secondary text-white hover:opacity-90'
									: 'bg-white text-black hover:bg-[#f0f0f0]',
						)}
					>
						{isGoalReached ? 'Add Creative' : 'Add Creatine'}
					</button>

					<div className='flex items-center gap-8'>
						<button
							onClick={handleUndo}
							className='flex items-center gap-2 text-[#444444] hover:text-[#ff716c] transition-colors'
						>
							<Undo2 className='w-4 h-4' />
							<span className='text-[10px] font-bold tracking-widest uppercase'>Rollback</span>
						</button>
						<div className='w-px h-3 bg-white/5' />
						<button
							onClick={() => updateState((prev) => addEntry(prev, state.settings.portionSize))}
							className='flex items-center gap-2 text-[#444444] hover:text-white transition-colors'
						>
							<HistoryIcon className='w-4 h-4' />
							<span className='text-[10px] font-bold tracking-widest uppercase'>Quick Add</span>
						</button>
					</div>
				</div>
			</div>

			{/* Activity Chart */}
			<section className='w-full bg-[#111111] rounded-[2rem] p-6 border border-white/5'>
				<button
					onClick={() => setView('history')}
					className='flex items-center justify-between w-full mb-6 group'
				>
					<div className='flex items-center gap-2'>
						<Activity className='w-4 h-4 text-[#7f98ff]' />
						<span className='text-[10px] font-bold text-[#666666] uppercase tracking-widest group-hover:text-white transition-colors'>
							Last 7 Days
						</span>
					</div>
					<ChevronRight className='w-4 h-4 text-[#333333] group-hover:text-white transition-colors' />
				</button>
				<div className='flex items-end justify-between h-28 px-2 gap-2'>
					{weeklyData.map((d, i) => {
						const barHeight = Math.max(8, (d.total / d.goal) * 100);
						return (
							<div key={i} className='flex flex-col items-center gap-3 flex-1'>
								<div className='w-full h-full flex items-end bg-[#1a1a1a]/50 rounded-full overflow-hidden'>
									<motion.div
										initial={{ height: 0 }}
										animate={{ height: `${Math.min(100, barHeight)}%` }}
										className={cn(
											'w-full rounded-full transition-all',
											d.isToday
												? 'bg-[#00fdc1]'
												: d.total >= d.goal
													? 'bg-[#00fdc1]/30'
													: 'bg-[#262626]',
										)}
									/>
								</div>
								<span
									className={cn(
										'text-[9px] font-bold uppercase tracking-tighter',
										d.isToday ? 'text-[#00fdc1]' : 'text-[#444444]',
									)}
								>
									{d.day}
								</span>
							</div>
						);
					})}
				</div>
			</section>

			{/* Stats Bento Grid */}
			<div className='grid grid-cols-2 gap-4 w-full'>
				<div className='bg-[#111111] rounded-[1.5rem] p-5 flex flex-col border border-white/5'>
					<div className='flex items-center gap-2 mb-3'>
						<Flame className='w-3.5 h-3.5 text-[#ff716c]' />
						<span className='text-[9px] font-bold uppercase tracking-widest text-[#666666]'>
							Current Streak
						</span>
					</div>
					<span className='text-2xl font-headline font-black text-white mb-0.5'>{stats.currentStreak}d</span>
					<span className='text-[9px] font-bold text-[#444444] uppercase tracking-wider'>Consecutive</span>
				</div>
				<div className='bg-[#111111] rounded-[1.5rem] p-5 flex flex-col border border-white/5'>
					<div className='flex items-center gap-2 mb-3'>
						<Trophy className='text-[#ffcc00] w-3.5 h-3.5' />
						<span className='text-[9px] font-bold uppercase tracking-widest text-[#666666]'>
							Best Streak
						</span>
					</div>
					<span className='text-2xl font-headline font-black text-white mb-0.5'>{stats.bestStreak}d</span>
					<span className='text-[9px] font-bold text-[#444444] uppercase tracking-wider'>
						All-time record
					</span>
				</div>
				<div className='bg-[#111111] rounded-[1.5rem] p-5 flex flex-col border border-white/5'>
					<div className='flex items-center gap-2 mb-3'>
						<CheckCircle2 className='text-[#00fdc1] w-3.5 h-3.5' />
						<span className='text-[9px] font-bold uppercase tracking-widest text-[#666666]'>Finished</span>
					</div>
					<span className='text-2xl font-headline font-black text-white mb-0.5'>{stats.finished}</span>
					<span className='text-[9px] font-bold text-[#444444] uppercase tracking-wider'>Days completed</span>
				</div>
				<div className='bg-[#111111] rounded-[1.5rem] p-5 flex flex-col border border-white/5'>
					<div className='flex items-center gap-2 mb-3'>
						<Calendar className='text-[#7f98ff] w-3.5 h-3.5' />
						<span className='text-[9px] font-bold uppercase tracking-widest text-[#666666]'>
							Days Active
						</span>
					</div>
					<span className='text-2xl font-headline font-black text-white mb-0.5'>{stats.active}</span>
					<span className='text-[9px] font-bold text-[#444444] uppercase tracking-wider'>
						Total days logged
					</span>
				</div>
				<div className='col-span-2 bg-[#111111] rounded-[1.5rem] p-5 flex items-center justify-between border border-white/5'>
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
						<span className='text-[9px] font-bold text-[#444444] uppercase tracking-wider block'>
							Remaining Today
						</span>
						<span className='text-xl font-headline font-black text-[#00fdc1]'>{remaining}g</span>
					</div>
				</div>
			</div>
		</div>
	);
}
