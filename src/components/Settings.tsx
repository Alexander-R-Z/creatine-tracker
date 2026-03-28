import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Minus, Calculator, X, Settings as SettingsIcon, Trash2, ChevronRight, CheckCircle2 } from 'lucide-react';
import { AppState, Settings as SettingsType } from '../lib/storage';
import { cn } from '../lib/utils';

interface SettingsProps {
	state: AppState;
	updateState: (updater: (prev: AppState) => AppState) => void;
	onReset: () => void;
}

export default function Settings({ state, updateState, onReset }: SettingsProps) {
	const [isCalibrating, setIsCalibrating] = useState(false);
	const [weight, setWeight] = useState(state.settings.weight || 70);
	const [perfGoal, setPerfGoal] = useState<'gym' | 'gym_more'>(state.settings.goal || 'gym');
	const canDecreaseDailyGoal = state.settings.dailyGoal > 1;
	const canDecreasePortionSize = state.settings.portionSize > 1;
	const canIncreasePortionSize = state.settings.portionSize < state.settings.dailyGoal;
	const canDecreaseWeight = weight > 20;
	const canIncreaseWeight = weight < 250;

	const recommendedDose = useMemo(() => {
		const ratio = perfGoal === 'gym' ? 0.1 : 0.2;
		const max = perfGoal === 'gym' ? 10 : 22;
		const dose = Math.floor(weight * ratio);
		return Math.min(dose, max);
	}, [weight, perfGoal]);

	const handleApplyCalibration = () => {
		updateState((prev) => {
			const newDailyGoal = recommendedDose;
			// Ensure portion size doesn't exceed new daily goal
			const newPortionSize = Math.min(prev.settings.portionSize, newDailyGoal);
			return {
				...prev,
				settings: {
					...prev.settings,
					dailyGoal: newDailyGoal,
					portionSize: newPortionSize,
					weight,
					goal: perfGoal,
				},
			};
		});
		setIsCalibrating(false);
	};

	const updateDailyGoal = (val: number) => {
		updateState((prev) => {
			const newGoal = Math.max(1, val);
			const newPortion = Math.min(prev.settings.portionSize, newGoal);
			return {
				...prev,
				settings: { ...prev.settings, dailyGoal: newGoal, portionSize: newPortion },
			};
		});
	};

	const updatePortionSize = (val: number) => {
		updateState((prev) => ({
			...prev,
			settings: { ...prev.settings, portionSize: Math.min(Math.max(1, val), prev.settings.dailyGoal) },
		}));
	};

	const updateResetTime = (val: string) => {
		updateState((prev) => ({
			...prev,
			settings: { ...prev.settings, resetTime: val },
		}));
	};

	return (
		<div className='space-y-8'>
			<section>
				<h2 className='font-headline text-3xl font-extrabold tracking-tight mb-1'>Settings</h2>
				<p className='text-[#ababab] text-sm'>Fine-tune your parameters.</p>
			</section>

			{/* Performance Goals Section */}
			<section className='space-y-4'>
				<div className='flex items-center gap-2 mb-2'>
					<SettingsIcon className='text-[#00fdc1] w-4 h-4' />
					<span className='text-xs font-headline font-bold tracking-widest text-[#ababab] uppercase'>
						Performance Goals
					</span>
				</div>
				<p className='text-[11px] text-[#7e7e7e]'>Values save instantly. Use +/- to adjust your targets.</p>

				<div className='space-y-3'>
					{/* Daily Amount Card */}
					<div className='bg-[#262626]/40 backdrop-blur-xl p-5 rounded-2xl flex items-center justify-between border border-white/5'>
						<div className='flex flex-col'>
							<span className='text-xs font-semibold text-[#ababab] uppercase tracking-wider mb-1'>
								Daily Amount
							</span>
							<div className='flex items-baseline gap-1'>
								<span className='text-2xl font-headline font-extrabold text-[#00fdc1]'>
									{state.settings.dailyGoal}
								</span>
								<span className='text-[#ababab] text-sm'>grams</span>
							</div>
						</div>
						<div className='flex items-center gap-2'>
							<button
								onClick={() => updateDailyGoal(state.settings.dailyGoal - 1)}
								disabled={!canDecreaseDailyGoal}
								aria-label='Decrease daily amount'
								title='Decrease daily amount'
								className={cn(
									'w-8 h-8 rounded-full border flex items-center justify-center transition-all',
									canDecreaseDailyGoal
										? 'border-white/10 text-white active:scale-90 hover:bg-white/10'
										: 'border-white/5 text-white/30 cursor-not-allowed',
								)}
							>
								<Minus className='w-4 h-4' />
							</button>
							<button
								onClick={() => updateDailyGoal(state.settings.dailyGoal + 1)}
								aria-label='Increase daily amount'
								title='Increase daily amount'
								className='w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-white active:scale-90 hover:bg-white/10 transition-all'
							>
								<Plus className='w-4 h-4' />
							</button>
						</div>
					</div>

					{/* Portion Size Card */}
					<div className='bg-[#262626]/40 backdrop-blur-xl p-5 rounded-2xl flex items-center justify-between border border-white/5'>
						<div className='flex flex-col'>
							<span className='text-xs font-semibold text-[#ababab] uppercase tracking-wider mb-1'>
								Portion Size
							</span>
							<div className='flex items-baseline gap-1'>
								<span className='text-2xl font-headline font-extrabold text-[#7f98ff]'>
									{state.settings.portionSize}
								</span>
								<span className='text-[#ababab] text-sm'>grams</span>
							</div>
						</div>
						<div className='flex items-center gap-2'>
							<button
								onClick={() => updatePortionSize(state.settings.portionSize - 1)}
								disabled={!canDecreasePortionSize}
								aria-label='Decrease portion size'
								title='Decrease portion size'
								className={cn(
									'w-8 h-8 rounded-full border flex items-center justify-center transition-all',
									canDecreasePortionSize
										? 'border-white/10 text-white active:scale-90 hover:bg-white/10'
										: 'border-white/5 text-white/30 cursor-not-allowed',
								)}
							>
								<Minus className='w-4 h-4' />
							</button>
							<button
								onClick={() => updatePortionSize(state.settings.portionSize + 1)}
								disabled={!canIncreasePortionSize}
								aria-label='Increase portion size'
								title='Increase portion size'
								className={cn(
									'w-8 h-8 rounded-full border flex items-center justify-center transition-all',
									canIncreasePortionSize
										? 'border-white/10 text-white active:scale-90 hover:bg-white/10'
										: 'border-white/5 text-white/30 cursor-not-allowed',
								)}
							>
								<Plus className='w-4 h-4' />
							</button>
						</div>
					</div>
				</div>
			</section>

			{/* Smart Calculator Section */}
			<section className='space-y-4'>
				<div className='flex items-center gap-2 mb-2'>
					<Calculator className='text-[#7f98ff] w-4 h-4' />
					<span className='text-xs font-headline font-bold tracking-widest text-[#ababab] uppercase'>
						Smart Calibration
					</span>
				</div>
				<div className='bg-[#131313] p-6 rounded-2xl border border-white/5 relative overflow-hidden'>
					<div className='absolute -right-4 -top-4 w-24 h-24 bg-[#00fdc1]/5 blur-3xl rounded-full' />
					<div className='relative z-10'>
						<h3 className='font-headline font-bold text-lg mb-2'>Calculate by Weight</h3>
						<p className='text-[#ababab] text-sm mb-6 leading-relaxed'>
							Our algorithm utilizes a precision ratio based on your mass and goals to optimize ATP
							regeneration.
						</p>
						<button
							onClick={() => setIsCalibrating(true)}
							className='w-full bg-gradient-to-r from-[#00edb4] to-[#aaffdc] text-[#004734] py-4 rounded-full font-headline font-extrabold text-sm uppercase tracking-widest shadow-lg shadow-[#00fdc1]/10 active:scale-95 md:hover:scale-[1.02] md:hover:shadow-[0_14px_36px_rgba(0,253,193,0.22)] md:hover:from-[#10f9c6] md:hover:to-[#c3ffe9] transition-all'
						>
							Launch Calculator
						</button>
					</div>
				</div>
			</section>

			{/* System Section */}
			<section className='space-y-4'>
				<div className='flex items-center gap-2 mb-2'>
					<SettingsIcon className='text-[#ababab] w-4 h-4' />
					<span className='text-xs font-headline font-bold tracking-widest text-[#ababab] uppercase'>
						System
					</span>
				</div>
				<div className='space-y-4'>
					<div className='p-5 bg-[#131313] rounded-2xl border border-white/5 space-y-4'>
						<div className='flex justify-between items-center'>
							<div className='flex flex-col'>
								<span className='text-sm font-bold text-white'>Daily Reset Time</span>
								<span className='text-[10px] text-[#666666] uppercase tracking-wider'>
									Current: {state.settings.resetTime || '04:30'}
								</span>
							</div>
							<span className='text-xl font-headline font-black text-[#00fdc1]'>
								{state.settings.resetTime || '04:30'}
							</span>
						</div>
						<input
							id='settings-reset-time'
							type='range'
							min='0'
							max='6'
							step='0.5'
							value={(() => {
								const [h, m] = (state.settings.resetTime || '04:30').split(':').map(Number);
								return h + m / 60;
							})()}
							onChange={(e) => {
								const val = parseFloat(e.target.value);
								const h = Math.floor(val);
								const m = (val % 1) * 60;
								const timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
								updateResetTime(timeStr);
							}}
							aria-label='Daily reset time'
							className='w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-[#00fdc1]'
						/>
						<p className='text-[10px] text-[#ababab] leading-relaxed italic'>
							Creatine intake does not carry over to the next day.
						</p>
					</div>

					<div className='flex items-center justify-between py-4 border-b border-white/5 opacity-40 grayscale pointer-events-none'>
						<span className='text-white font-medium'>Notifications</span>
						<div className='w-10 h-5 bg-[#262626] rounded-full relative'>
							<div className='absolute left-0.5 top-0.5 w-4 h-4 bg-[#444444] rounded-full shadow-sm' />
						</div>
					</div>

					<div className='pt-4'>
						<button
							onClick={onReset}
							className='w-full h-14 rounded-xl bg-[#1a1a1a] border border-[#ff716c]/20 flex items-center justify-center gap-3 text-[#ff716c] font-bold text-sm hover:bg-[#ff716c]/5 transition-all active:scale-[0.98]'
						>
							<Trash2 className='w-4 h-4' />
							Clear All Data
						</button>
					</div>
				</div>
			</section>

			{/* Calibration Modal */}
			<AnimatePresence>
				{isCalibrating && (
					<div className='fixed inset-0 z-[60] flex items-end justify-center px-4 pb-10 bg-black/80 backdrop-blur-sm'>
						<motion.div
							initial={{ y: 100, opacity: 0 }}
							animate={{ y: 0, opacity: 1 }}
							exit={{ y: 100, opacity: 0 }}
							className='w-full max-w-md bg-[#262626]/80 backdrop-blur-2xl rounded-3xl p-8 border border-white/10 shadow-2xl'
						>
							<div className='flex justify-between items-center mb-8'>
								<h3 className='font-headline text-2xl font-extrabold'>Calibration</h3>
								<button
									onClick={() => setIsCalibrating(false)}
									aria-label='Close calibration'
									title='Close calibration'
									className='text-[#ababab] hover:text-white'
								>
									<X className='w-6 h-6' />
								</button>
							</div>

							<div className='space-y-8'>
								<div className='space-y-2'>
									<label className='text-xs font-headline font-bold tracking-widest text-[#ababab] uppercase'>
										Current Weight Calibration
									</label>
									<div className='flex items-center justify-between border-b border-[#00fdc1]/30 py-4'>
										<div className='flex items-center gap-4'>
											<span className='text-5xl font-headline font-black text-[#00fdc1] w-24'>
												{weight}
											</span>
											<span className='text-xl font-headline font-bold text-[#ababab]'>kg</span>
										</div>
										<div className='flex items-center gap-2'>
											<button
												onClick={() => setWeight((prev) => Math.max(20, prev - 1))}
												disabled={!canDecreaseWeight}
												aria-label='Decrease weight'
												title='Decrease weight'
												className={cn(
													'w-12 h-12 rounded-full border flex items-center justify-center transition-all bg-[#131313]/50',
													canDecreaseWeight
														? 'border-white/10 text-white active:scale-90 hover:bg-[#1c1c1c]'
														: 'border-white/5 text-white/30 cursor-not-allowed',
												)}
											>
												<Minus className='w-5 h-5' />
											</button>
											<button
												onClick={() => setWeight((prev) => Math.min(250, prev + 1))}
												disabled={!canIncreaseWeight}
												aria-label='Increase weight'
												title='Increase weight'
												className={cn(
													'w-12 h-12 rounded-full border flex items-center justify-center transition-all bg-[#131313]/50',
													canIncreaseWeight
														? 'border-white/10 text-white active:scale-90 hover:bg-[#1c1c1c]'
														: 'border-white/5 text-white/30 cursor-not-allowed',
												)}
											>
												<Plus className='w-5 h-5' />
											</button>
										</div>
									</div>
								</div>

								<div className='space-y-4'>
									<label className='text-xs font-headline font-bold tracking-widest text-[#ababab] uppercase'>
										Performance Level
									</label>
									<div className='grid grid-cols-2 gap-3'>
										<button
											onClick={() => setPerfGoal('gym')}
											className={cn(
												'rounded-xl p-4 text-left transition-all border',
												perfGoal === 'gym'
													? 'bg-[#00fdc1]/20 border-[#00fdc1]/40 ring-2 ring-[#00fdc1]'
													: 'bg-[#262626]/40 border-white/5 grayscale opacity-70',
											)}
										>
											<span
												className={cn(
													'block font-bold mb-1',
													perfGoal === 'gym' ? 'text-[#00fdc1]' : 'text-white',
												)}
											>
												Gym
											</span>
											<span className='text-[10px] text-[#ababab] leading-tight'>
												Standard maintenance (0.1g/kg, max 10g).
											</span>
										</button>
										<button
											onClick={() => setPerfGoal('gym_more')}
											className={cn(
												'rounded-xl p-4 text-left transition-all border',
												perfGoal === 'gym_more'
													? 'bg-[#00fdc1]/20 border-[#00fdc1]/40 ring-2 ring-[#00fdc1]'
													: 'bg-[#262626]/40 border-white/5 grayscale opacity-70',
											)}
										>
											<span
												className={cn(
													'block font-bold mb-1',
													perfGoal === 'gym_more' ? 'text-[#00fdc1]' : 'text-white',
												)}
											>
												Gym & More
											</span>
											<span className='text-[10px] text-[#ababab] leading-tight'>
												High intensity (0.2g/kg, max 22g).
											</span>
										</button>
									</div>
								</div>

								<div className='pt-4'>
									<div className='flex justify-between items-center mb-6 px-2'>
										<span className='text-[#ababab] text-sm italic'>Recommended Dose:</span>
										<span className='text-2xl font-headline font-extrabold text-[#00fdc1]'>
											{recommendedDose}g
										</span>
									</div>
									<button
										onClick={handleApplyCalibration}
										className='w-full bg-white text-black py-4 rounded-full font-headline font-extrabold text-sm uppercase tracking-widest active:scale-95 transition-all shadow-xl'
									>
										Apply Result
									</button>
								</div>
							</div>
						</motion.div>
					</div>
				)}
			</AnimatePresence>
		</div>
	);
}
