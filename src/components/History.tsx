import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { format, subDays, subMonths, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { AppState, getLogForDate, updateDayLog } from '../lib/storage';
import { cn } from '../lib/utils';
import { Plus, Minus, Check, Calendar, FolderArchive, Pencil } from 'lucide-react';

interface HistoryProps {
	state: AppState;
	updateState: (updater: (prev: AppState) => AppState) => void;
}

export default function History({ state, updateState }: HistoryProps) {
	const last7Days = useMemo(() => {
		const now = new Date();
		return Array.from({ length: 7 }).map((_, i) => subDays(now, i));
	}, []);

	const last24Months = useMemo(() => {
		const now = new Date();
		return Array.from({ length: 24 }).map((_, i) => subMonths(now, i));
	}, []);

	const [editingDate, setEditingDate] = useState<string | null>(null);
	const [editValue, setEditValue] = useState<number>(0);

	const startEditing = (dateStr: string, currentTotal: number) => {
		setEditingDate(dateStr);
		setEditValue(currentTotal);
	};

	const saveEdit = () => {
		if (editingDate) {
			updateState((prev) => updateDayLog(prev, editingDate, editValue));
			setEditingDate(null);
		}
	};

	return (
		<div className='space-y-10 pt-4 pb-20'>
			{/* Recent Activity */}
			<section className='space-y-4 relative'>
				<div className='pointer-events-none absolute -right-10 -top-10 w-48 h-48 bg-[#00fdc1]/6 blur-[90px] rounded-full' />
				<div className='pointer-events-none absolute -left-10 top-20 w-44 h-44 bg-[#4a3b30]/14 blur-[95px] rounded-full' />
				<div className='flex items-center gap-2 mb-2'>
					<Calendar className='text-[#00fdc1] w-4 h-4' />
					<span className='text-xs font-headline font-bold tracking-widest text-[#ababab] uppercase'>
						Recent Activity
					</span>
				</div>

				<div className='space-y-3 relative z-10'>
					{last7Days.map((date, idx) => {
						const dateStr = format(date, 'yyyy-MM-dd');
						const log = getLogForDate(state, dateStr);
						const isToday = idx === 0;
						const isEditing = editingDate === dateStr;
						const isCompleted = log.total >= state.settings.dailyGoal;
						const hasIntake = log.total > 0;
						const isPartial = hasIntake && !isCompleted;

						return (
							<div
								key={dateStr}
								className={cn(
									'bg-[#171717]/90 backdrop-blur-xl rounded-[1.5rem] p-4 border transition-all relative overflow-hidden',
									(isToday || isEditing) && 'min-h-[7.5rem] flex items-center',
									isEditing ? 'border-[#00fdc1]/50' : 'border-white/5',
								)}
							>
								<div
									className={cn(
										'pointer-events-none absolute -right-14 -top-14 w-40 h-40 rounded-full blur-3xl transition-opacity',
										isCompleted
											? 'bg-[#00fdc1]/12 opacity-100'
											: isPartial
												? 'bg-secondary/18 opacity-100'
												: 'opacity-0',
									)}
								/>
								<div
									className={cn(
										'pointer-events-none absolute -left-10 -bottom-12 w-32 h-32 rounded-full blur-3xl',
										isPartial ? 'bg-[#4a3b30]/20' : 'bg-[#4a3b30]/16',
									)}
								/>
								<div className='flex items-center justify-between relative z-10 w-full'>
									<div className='flex flex-col'>
										<span
											className={cn(
												'text-xs font-bold uppercase tracking-wider',
												isToday ? 'text-[#00fdc1]' : 'text-[#ababab]',
											)}
										>
											{isToday ? 'Today' : format(date, 'EEEE')}
										</span>
										<span className='text-[10px] text-[#ababab]/60'>
											{format(date, 'MMM dd, yyyy')}
										</span>
									</div>

									{isEditing ? (
										<div className='flex items-center gap-4'>
											<div className='flex items-center gap-3'>
												<button
													aria-label='Decrease logged amount'
													title='Decrease logged amount'
													onClick={() => setEditValue((prev) => Math.max(0, prev - 1))}
													className='w-10 h-10 rounded-xl bg-[#131313] border border-white/10 flex items-center justify-center text-white'
												>
													<Minus className='w-4 h-4' />
												</button>
												<span className='text-xl font-headline font-bold text-white w-14 text-center'>
													{editValue}g
												</span>
												<button
													aria-label='Increase logged amount'
													title='Increase logged amount'
													onClick={() => setEditValue((prev) => prev + 1)}
													className='w-10 h-10 rounded-xl bg-[#131313] border border-white/10 flex items-center justify-center text-white'
												>
													<Plus className='w-4 h-4' />
												</button>
											</div>
											<button
												aria-label='Save logged amount'
												title='Save logged amount'
												onClick={saveEdit}
												className='w-10 h-10 rounded-xl bg-[#00fdc1] border border-[#00fdc1]/30 flex items-center justify-center text-[#004734]'
											>
												<Check className='w-5 h-5' />
											</button>
										</div>
									) : (
										<button
											onClick={() => startEditing(dateStr, log.total)}
											aria-label={`Edit logged amount for ${isToday ? 'today' : format(date, 'EEEE')}`}
											title='Edit logged amount'
											className='flex items-center gap-4 cursor-pointer group rounded-2xl px-3 py-2.5 -mr-1 min-h-[3.25rem] hover:border-white/20 hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00fdc1]/60 transition-all'
										>
											<div className='flex flex-col items-end'>
												<span
													className={cn(
														'text-xl font-headline font-bold',
														isCompleted ? 'text-[#00fdc1]' : 'text-white',
													)}
												>
													{log.total}
													<span className='text-xs font-medium text-[#ababab] ml-0.5'>
														/ {state.settings.dailyGoal}g
													</span>
												</span>
												<div className='w-24 h-1 bg-white/5 rounded-full mt-1 overflow-hidden'>
													<motion.div
														initial={false}
														animate={{
															scaleX: Math.min(1, log.total / state.settings.dailyGoal),
														}}
														transition={{ duration: 0.28, ease: 'easeOut' }}
														className={cn(
															'h-full transition-all duration-500 origin-left',
															isCompleted ? 'bg-[#00fdc1]' : 'bg-[#7f98ff]',
														)}
													/>
												</div>
											</div>
											<div className='text-[#8d8d8d] group-hover:text-secondary group-hover:translate-x-0.5 transition-all'>
												<Pencil className='w-4 h-4' />
											</div>
										</button>
									)}
								</div>
							</div>
						);
					})}
				</div>
			</section>

			{/* Historical Archive */}
			<section className='space-y-6 relative'>
				<div className='pointer-events-none absolute -right-14 -top-8 w-52 h-52 bg-[#00fdc1]/6 blur-[100px] rounded-full' />
				<div className='pointer-events-none absolute -left-14 top-16 w-48 h-48 bg-[#4a3b30]/14 blur-[95px] rounded-full' />
				<div className='flex items-center gap-2 mb-2'>
					<FolderArchive className='text-[#7f98ff] w-4 h-4' />
					<span className='text-xs font-headline font-bold tracking-widest text-[#ababab] uppercase'>
						Historical Archive
					</span>
				</div>

				<div className='space-y-6 relative z-10'>
					{last24Months.map((monthDate, idx) => {
						const monthName = format(monthDate, 'MMMM');
						const year = format(monthDate, 'yyyy');
						const days = eachDayOfInterval({
							start: startOfMonth(monthDate),
							end: endOfMonth(monthDate),
						});

						const completedDays = days.filter((d) => {
							const log = getLogForDate(state, format(d, 'yyyy-MM-dd'));
							return log.total >= state.settings.dailyGoal;
						}).length;

						// Only show months that have data or are recent (last 3 months)
						const hasData = completedDays > 0;
						const isRecent = idx < 3;
						if (!hasData && !isRecent) return null;

						return (
							<div
								key={idx}
								className='bg-[#131313]/80 backdrop-blur-xl rounded-[1.5rem] p-5 border border-[#4a3b30]/25 relative overflow-hidden'
							>
								<div className='pointer-events-none absolute -right-16 -top-16 w-44 h-44 bg-[#00fdc1]/6 blur-3xl rounded-full' />
								<div className='pointer-events-none absolute -left-16 -bottom-16 w-40 h-40 bg-[#4a3b30]/16 blur-3xl rounded-full' />
								<div className='flex justify-between items-start mb-4 relative z-10'>
									<div>
										<h3 className='font-headline font-bold text-lg text-white'>{monthName}</h3>
										<p className='text-[#a99280] text-[10px] font-bold uppercase tracking-widest'>
											{year}
										</p>
									</div>
									<div className='text-right'>
										<span className='block text-xl font-headline font-black text-withe'>
											{completedDays}
											<span className='text-xs text-[#ababab] ml-0.5'>/{days.length}</span>
										</span>
									</div>
								</div>

								<div className='grid grid-cols-7 gap-1.5 relative z-10'>
									{days.map((day, dIdx) => {
										const dateStr = format(day, 'yyyy-MM-dd');
										const log = getLogForDate(state, dateStr);
										const isCompleted = log.total >= state.settings.dailyGoal;
										const hasLog = log.total > 0;

										return (
											<div
												key={dIdx}
												className={cn(
													'aspect-square rounded-md flex items-center justify-center border transition-all',
													isCompleted
														? 'bg-[#00fdc1]/20 border-[#00fdc1]/20'
														: hasLog
															? 'bg-[#7f98ff]/20 border-[#7f98ff]/20'
															: 'bg-[#262626]/40 border-white/5',
												)}
											>
												{hasLog && (
													<div
														className={cn(
															'w-1.5 h-1.5 rounded-full',
															isCompleted
																? 'bg-[#00fdc1] shadow-[0_0_8px_rgba(0,253,193,0.6)]'
																: 'bg-[#7f98ff]',
														)}
													/>
												)}
											</div>
										);
									})}
								</div>
							</div>
						);
					})}
				</div>
			</section>
		</div>
	);
}
