import { useState, useMemo, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, ShieldCheck, FlaskConical, Plus, Minus } from 'lucide-react';
import { Settings } from '../lib/storage';
import { cn } from '../lib/utils';

interface SetupProps {
	onComplete: (settings: Settings) => void;
}

export default function Setup({ onComplete }: SetupProps) {
	const [weight, setWeight] = useState(70);
	const [perfGoal, setPerfGoal] = useState<'gym' | 'gym_more'>('gym');

	const recommendedDose = useMemo(() => {
		const ratio = perfGoal === 'gym' ? 0.1 : 0.2;
		const max = perfGoal === 'gym' ? 10 : 22;
		const dose = Math.floor(weight * ratio);
		return Math.min(dose, max);
	}, [weight, perfGoal]);

	const [dailyGoal, setDailyGoal] = useState(5);
	const [portionSize, setPortionSize] = useState(5);

	// Sync daily goal with recommended dose when weight or goal changes
	useEffect(() => {
		setDailyGoal(recommendedDose);
		setPortionSize(recommendedDose);
	}, [recommendedDose]);

	return (
		<div className='min-h-screen flex flex-col items-center justify-center px-6 py-12 max-w-md mx-auto'>
			<header className='fixed top-0 w-full z-50 flex items-center justify-between px-6 h-16 bg-gradient-to-b from-[#0e0e0e] to-transparent'></header>

			<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className='text-center mb-6'>
				<h1 className='font-headline font-extrabold text-4xl tracking-tight mb-2'>Creatine Setup</h1>
				<p className='text-[#ababab] text-xs max-w-[280px] mx-auto leading-relaxed'>
					All data remains encrypted on your device.
				</p>
			</motion.div>

			<motion.div
				initial={{ opacity: 0, scale: 0.95 }}
				animate={{ opacity: 1, scale: 1 }}
				transition={{ delay: 0.1 }}
				className='w-full bg-[#262626]/70 backdrop-blur-xl rounded-2xl p-6 border border-white/10 space-y-8 shadow-2xl'
			>
				<div className='space-y-4'>
					<label className='text-[10px] uppercase tracking-[0.2em] font-bold text-[#ababab]'>
						Body Weight
					</label>
					<div className='flex items-center justify-between bg-[#131313] p-4 rounded-xl border border-white/5'>
						<div className='flex items-baseline gap-1'>
							<span className='text-4xl font-headline font-black text-[#00fdc1]'>{weight}</span>
							<span className='text-sm font-bold text-[#ababab]'>kg</span>
						</div>
						<div className='flex items-center gap-2'>
							<button
								onClick={() => setWeight((prev) => Math.max(20, prev - 1))}
								aria-label='Decrease body weight'
								title='Decrease body weight'
								className='w-10 h-10 rounded-full bg-[#262626] flex items-center justify-center text-white active:scale-90 transition-transform'
							>
								<Minus className='w-4 h-4' />
							</button>
							<button
								onClick={() => setWeight((prev) => Math.min(250, prev + 1))}
								aria-label='Increase body weight'
								title='Increase body weight'
								className='w-10 h-10 rounded-full bg-[#262626] flex items-center justify-center text-white active:scale-90 transition-transform'
							>
								<Plus className='w-4 h-4' />
							</button>
						</div>
					</div>

					<div className='grid grid-cols-2 gap-2'>
						<button
							onClick={() => setPerfGoal('gym')}
							className={cn(
								'rounded-xl p-3 text-left transition-all border text-xs',
								perfGoal === 'gym'
									? 'bg-[#00fdc1]/20 border-[#00fdc1]/40 ring-1 ring-[#00fdc1]'
									: 'bg-[#262626]/40 border-white/5 opacity-50',
							)}
						>
							<span
								className={cn(
									'block font-bold mb-0.5',
									perfGoal === 'gym' ? 'text-[#00fdc1]' : 'text-white',
								)}
							>
								Gym
							</span>
							<span className='text-[9px] text-[#ababab] leading-tight'>0.1g/kg</span>
						</button>
						<button
							onClick={() => setPerfGoal('gym_more')}
							className={cn(
								'rounded-xl p-3 text-left transition-all border text-xs',
								perfGoal === 'gym_more'
									? 'bg-[#00fdc1]/20 border-[#00fdc1]/40 ring-1 ring-[#00fdc1]'
									: 'bg-[#262626]/40 border-white/5 opacity-50',
							)}
						>
							<span
								className={cn(
									'block font-bold mb-0.5',
									perfGoal === 'gym_more' ? 'text-[#00fdc1]' : 'text-white',
								)}
							>
								Gym & More
							</span>
							<span className='text-[9px] text-[#ababab] leading-tight'>0.2g/kg</span>
						</button>
					</div>
				</div>

				<div className='space-y-2'>
					<div className='flex justify-between items-end'>
						<label
							htmlFor='setup-daily-goal'
							className='text-[10px] uppercase tracking-[0.2em] font-bold text-[#ababab]'
						>
							Daily Goal
						</label>
						<span className='text-[#00fdc1] font-headline font-extrabold text-3xl tracking-tighter'>
							{dailyGoal}
							<span className='text-sm font-normal text-[#ababab] ml-1'>g</span>
						</span>
					</div>
					<input
						id='setup-daily-goal'
						type='range'
						min='1'
						max='25'
						step='1'
						value={dailyGoal}
						onChange={(e) => {
							const val = parseFloat(e.target.value);
							setDailyGoal(val);
							setPortionSize(val);
						}}
						aria-label='Daily goal'
						className='w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-[#00fdc1]'
					/>
				</div>

				<div className='space-y-2'>
					<div className='flex justify-between items-end'>
						<label
							htmlFor='setup-portion-size'
							className='text-[10px] uppercase tracking-[0.2em] font-bold text-[#ababab]'
						>
							Portion Size
						</label>
						<span className='text-[#7f98ff] font-headline font-extrabold text-3xl tracking-tighter'>
							{portionSize}
							<span className='text-sm font-normal text-[#ababab] ml-1'>g</span>
						</span>
					</div>
					<input
						id='setup-portion-size'
						type='range'
						min='1'
						max={dailyGoal}
						step='1'
						value={portionSize}
						onChange={(e) => setPortionSize(parseFloat(e.target.value))}
						aria-label='Portion size'
						className='w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-[#7f98ff]'
					/>
				</div>
			</motion.div>

			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ delay: 0.2 }}
				className='w-full mt-8 space-y-4'
			>
				<button
					onClick={() => onComplete({ dailyGoal, portionSize, weight, goal: perfGoal })}
					className='w-full h-16 rounded-full bg-gradient-to-r from-[#00edb4] to-[#aaffdc] font-headline font-extrabold text-[#004734] uppercase tracking-widest text-sm flex items-center justify-center gap-3 active:scale-95 transition-transform shadow-xl shadow-[#00fdc1]/10'
				>
					Start Protocol
					<ArrowRight className='w-5 h-5' />
				</button>
			</motion.div>
		</div>
	);
}
