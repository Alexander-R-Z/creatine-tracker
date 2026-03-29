import { useMemo } from 'react';
import { format, subDays, subMonths, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { motion } from 'motion/react';
import { ChartNoAxesCombined, Activity, Target, Flame, TrendingUp, CalendarRange, ChevronRight } from 'lucide-react';
import { AppState, getEffectiveDate, getLogForDate } from '../lib/storage';
import { View } from '../App';
import { cn } from '../lib/utils';

interface AnalyticsProps {
	state: AppState;
	setView: (view: View) => void;
}

interface MonthSummary {
	monthLabel: string;
	completion: number;
	daysTracked: number;
	totalGrams: number;
	goalAverage: number;
}

export default function Analytics({ state, setView }: AnalyticsProps) {
	const rollingStats = useMemo(() => {
		let completed = 0;
		let total = 0;

		for (let i = 0; i < 30; i++) {
			const date = getEffectiveDate(subDays(new Date(), i), state.settings.resetTime);
			const log = getLogForDate(state, date);
			total += log.total;
			if (log.total >= state.settings.dailyGoal) {
				completed += 1;
			}
		}

		const compliance = Math.round((completed / 30) * 100);
		const average = (total / 30).toFixed(1);

		return {
			completed,
			compliance,
			average,
		};
	}, [state]);

	const streakStats = useMemo(() => {
		const sorted = Object.keys(state.logs).sort();
		if (sorted.length === 0) {
			return { current: 0, best: 0 };
		}

		let best = 0;
		let running = 0;

		sorted.forEach((dateKey) => {
			const total = state.logs[dateKey].total;
			if (total >= state.settings.dailyGoal) {
				running += 1;
				best = Math.max(best, running);
			} else {
				running = 0;
			}
		});

		let current = 0;
		let dayCursor = new Date();
		while (true) {
			const effective = getEffectiveDate(dayCursor, state.settings.resetTime);
			const log = getLogForDate(state, effective);
			if (log.total >= state.settings.dailyGoal) {
				current += 1;
				dayCursor = subDays(dayCursor, 1);
				continue;
			}
			break;
		}

		return {
			current,
			best,
		};
	}, [state]);

	const monthSummaries = useMemo<MonthSummary[]>(() => {
		return Array.from({ length: 6 }).map((_, idx) => {
			const monthDate = subMonths(new Date(), idx);
			const days = eachDayOfInterval({
				start: startOfMonth(monthDate),
				end: endOfMonth(monthDate),
			});

			let completed = 0;
			let tracked = 0;
			let total = 0;

			days.forEach((day) => {
				const key = format(day, 'yyyy-MM-dd');
				const log = getLogForDate(state, key);
				total += log.total;
				if (log.total > 0) {
					tracked += 1;
				}
				if (log.total >= state.settings.dailyGoal) {
					completed += 1;
				}
			});

			const completion = days.length ? Math.round((completed / days.length) * 100) : 0;
			const goalAverage = days.length ? Number((total / days.length).toFixed(1)) : 0;

			return {
				monthLabel: format(monthDate, 'MMM yyyy'),
				completion,
				daysTracked: tracked,
				totalGrams: total,
				goalAverage,
			};
		});
	}, [state]);

	const monthPeak = useMemo(() => {
		return Math.max(1, ...monthSummaries.map((month) => month.totalGrams));
	}, [monthSummaries]);

	const trendInsights = useMemo(() => {
		const latestMonth = monthSummaries[0];
		const previousMonth = monthSummaries[1];

		const monthDelta = previousMonth ? latestMonth.totalGrams - previousMonth.totalGrams : 0;
		const complianceDirection = monthDelta > 0 ? 'up' : monthDelta < 0 ? 'down' : 'flat';

		return [
			{
				label: '30d compliance',
				value: `${rollingStats.compliance}%`,
				detail: `${rollingStats.completed}/30 goal days`,
			},
			{
				label: 'Current streak',
				value: `${streakStats.current}d`,
				detail: `Best ${streakStats.best}d`,
			},
			{
				label: 'Month over month',
				value:
					complianceDirection === 'up'
						? `+${monthDelta}g`
						: complianceDirection === 'down'
							? `${monthDelta}g`
							: '0g',
				detail: previousMonth
					? `${latestMonth.monthLabel} vs ${previousMonth.monthLabel}`
					: `${latestMonth.monthLabel}`,
			},
		];
	}, [monthSummaries, rollingStats.compliance, rollingStats.completed, streakStats.current, streakStats.best]);

	return (
		<div className='pt-4 pb-20 grid gap-6 xl:grid-cols-12'>
			<section className='xl:col-span-8 bg-[#111111] rounded-[2.2rem] p-7 md:p-8 border border-white/5 relative overflow-hidden'>
				<div className='absolute -right-20 -top-20 w-72 h-72 bg-[#00fdc1]/8 blur-[120px] rounded-full pointer-events-none' />
				<div className='absolute -left-16 -bottom-16 w-56 h-56 bg-[#4a3b30]/20 blur-[100px] rounded-full pointer-events-none' />
				<div className='relative z-10'>
					<div className='flex items-center gap-2 mb-6'>
						<ChartNoAxesCombined className='w-4 h-4 text-[#00fdc1]' />
						<span className='text-[10px] uppercase tracking-[0.2em] font-bold text-[#666666]'>
							Analytics Snapshot
						</span>
					</div>

					<div className='grid gap-4 md:grid-cols-3'>
						<div className='rounded-2xl bg-[#171717] border border-white/5 p-4'>
							<div className='flex items-center gap-2 text-[#ababab] text-[10px] uppercase tracking-widest font-bold'>
								<Target className='w-3.5 h-3.5 text-[#00fdc1]' />
								30d Compliance
							</div>
							<div className='mt-2 text-3xl font-headline font-black text-white'>
								{rollingStats.compliance}%
							</div>
							<div className='mt-2 h-1.5 rounded-full bg-[#0f0f0f] overflow-hidden'>
								<motion.div
									initial={false}
									animate={{ width: `${rollingStats.compliance}%` }}
									className='h-full bg-[#00fdc1]'
								/>
							</div>
						</div>

						<div className='rounded-2xl bg-[#171717] border border-white/5 p-4'>
							<div className='flex items-center gap-2 text-[#ababab] text-[10px] uppercase tracking-widest font-bold'>
								<Activity className='w-3.5 h-3.5 text-[#7f98ff]' />
								30d Average
							</div>
							<div className='mt-2 text-3xl font-headline font-black text-white'>
								{rollingStats.average}g
							</div>
							<p className='mt-2 text-xs text-[#666666]'>Daily mean intake across the last month</p>
						</div>

						<div className='rounded-2xl bg-[#171717] border border-white/5 p-4'>
							<div className='flex items-center gap-2 text-[#ababab] text-[10px] uppercase tracking-widest font-bold'>
								<Flame className='w-3.5 h-3.5 text-[#ff716c]' />
								Streaks
							</div>
							<div className='mt-2 flex items-end justify-between'>
								<div>
									<div className='text-3xl font-headline font-black text-white'>
										{streakStats.current}d
									</div>
									<p className='text-[11px] text-[#666666]'>current</p>
								</div>
								<div className='text-right'>
									<div className='text-xl font-headline font-black text-[#7f98ff]'>
										{streakStats.best}d
									</div>
									<p className='text-[11px] text-[#666666]'>best</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			<section className='xl:col-span-4 space-y-4'>
				<div className='bg-[#111111] rounded-[1.8rem] p-5 border border-white/5'>
					<div className='text-[10px] uppercase tracking-[0.2em] font-bold text-[#666666] mb-3'>
						Trend Insights
					</div>
					<div className='space-y-2'>
						{trendInsights.map((item) => (
							<div key={item.label} className='rounded-xl bg-[#171717] border border-white/5 px-3 py-2.5'>
								<div className='text-[10px] uppercase tracking-wider text-[#8d8d8d] font-bold'>
									{item.label}
								</div>
								<div className='mt-1 text-base font-bold text-white'>{item.value}</div>
								<div className='text-xs text-[#ababab]'>{item.detail}</div>
							</div>
						))}
					</div>
				</div>

				<div className='bg-[#111111] rounded-[1.8rem] p-5 border border-[#4a3b30]/35'>
					<div className='text-[10px] uppercase tracking-[0.2em] font-bold text-[#a99280] mb-3'>Flow</div>
					<button
						onClick={() => setView('history')}
						className='w-full h-12 rounded-xl border border-white/10 bg-[#171717] hover:bg-white/5 transition-all flex items-center justify-between px-4 text-left'
					>
						<div className='flex items-center gap-2'>
							<CalendarRange className='w-4 h-4 text-[#7f98ff]' />
							<span className='text-sm font-semibold text-white'>Open History</span>
						</div>
						<ChevronRight className='w-4 h-4 text-[#666666]' />
					</button>
				</div>
			</section>

			<section className='xl:col-span-12 bg-[#111111] rounded-[2rem] p-6 border border-white/5 relative overflow-hidden'>
				<div className='absolute -right-16 -top-16 w-56 h-56 bg-[#7f98ff]/8 blur-[110px] rounded-full pointer-events-none' />
				<div className='absolute -left-20 -bottom-20 w-60 h-60 bg-[#4a3b30]/18 blur-[110px] rounded-full pointer-events-none' />
				<div className='relative z-10'>
					<div className='flex items-center gap-2 mb-5'>
						<TrendingUp className='w-4 h-4 text-[#7f98ff]' />
						<span className='text-[10px] uppercase tracking-[0.2em] font-bold text-[#666666]'>
							Monthly Trend (6 months)
						</span>
					</div>

					<div className='grid gap-3 md:grid-cols-2 xl:grid-cols-3'>
						{monthSummaries.map((month) => {
							const fill = Math.round((month.totalGrams / monthPeak) * 100);
							return (
								<div
									key={month.monthLabel}
									className='rounded-2xl bg-[#171717]/85 border border-white/5 p-4'
								>
									<div className='flex items-center justify-between'>
										<span className='text-xs font-bold uppercase tracking-wide text-[#ababab]'>
											{month.monthLabel}
										</span>
										<span className='text-xs font-semibold text-[#00fdc1]'>
											{month.completion}%
										</span>
									</div>
									<div className='mt-3 h-2 rounded-full bg-[#0f0f0f] overflow-hidden'>
										<motion.div
											initial={false}
											animate={{ width: `${fill}%` }}
											className={cn(
												'h-full',
												month.completion >= 70 ? 'bg-[#00fdc1]' : 'bg-[#7f98ff]',
											)}
										/>
									</div>
									<div className='mt-3 flex items-center justify-between text-xs text-[#666666]'>
										<span>{month.daysTracked} tracked days</span>
										<span>{month.goalAverage}g/day avg</span>
									</div>
								</div>
							);
						})}
					</div>
				</div>
			</section>
		</div>
	);
}
