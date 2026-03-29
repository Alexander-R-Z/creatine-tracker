import { useState, useMemo, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Plus, Minus, Zap, Target, Info } from 'lucide-react';
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
		<div className='min-h-screen flex flex-col items-start justify-start px-6 md:px-8 pt-12 pb-12 w-full max-w-md md:max-w-4xl lg:max-w-5xl xl:max-w-6xl mx-auto'>
			<header className='fixed top-0 w-full z-50 flex items-center justify-between px-6 md:px-8 h-16 bg-gradient-to-b from-[#0e0e0e] to-transparent'></header>

			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				className='text-left mb-8 w-full'
			>
				<div className='flex items-center gap-2 mb-3'>
					<div className='p-2 rounded-lg bg-[#00fdc1]/10 border border-[#00fdc1]/20'>
						<Zap className='w-5 h-5 text-[#00fdc1]' />
					</div>
					<h1 className='font-headline font-extrabold text-3xl tracking-tight'>Setup</h1>
				</div>
				<p className='text-[#ababab] text-xs leading-relaxed'>
					Let's tune your tracker. These values set your daily target and keep logging quick.
				</p>
			</motion.div>

			<motion.div
				initial={{ opacity: 0, scale: 0.95 }}
				animate={{ opacity: 1, scale: 1 }}
				transition={{ delay: 0.1 }}
				className='w-full'
			>
				{/* Body Weight Section */}
				<div className='bg-[#111111] rounded-2xl p-6 border border-white/5 mb-4'>
					<label className='text-[10px] uppercase tracking-[0.2em] font-bold text-[#ababab] block mb-4'>
						Body Weight
					</label>
					<div className='flex items-center justify-between bg-[#0e0e0e] p-4 rounded-xl border border-white/5 mb-4'>
						<div className='flex items-baseline gap-1'>
							<span className='text-4xl font-headline font-black text-[#00fdc1]'>{weight}</span>
							<span className='text-sm font-bold text-[#ababab]'>kg</span>
						</div>
						<div className='flex items-center gap-2'>
							<button
								onClick={() => setWeight((prev) => Math.max(20, prev - 1))}
								aria-label='Decrease body weight'
								title='Decrease body weight'
								className='w-11 h-11 rounded-full bg-[#1a1a1a] hover:bg-[#262626] flex items-center justify-center text-white active:scale-90 transition-all'
							>
								<Minus className='w-4 h-4' />
							</button>
							<button
								onClick={() => setWeight((prev) => Math.min(250, prev + 1))}
								aria-label='Increase body weight'
								title='Increase body weight'
								className='w-11 h-11 rounded-full bg-[#1a1a1a] hover:bg-[#262626] flex items-center justify-center text-white active:scale-90 transition-all'
							>
								<Plus className='w-4 h-4' />
							</button>
						</div>
					</div>

					<div className='grid grid-cols-3 gap-2 mb-4'>
						{[60, 75, 90].map((preset) => (
							<button
								key={preset}
								onClick={() => setWeight(preset)}
								className={cn(
									'min-h-[44px] rounded-lg border text-xs font-bold tracking-wide transition-all',
									weight === preset
										? 'bg-[#00fdc1]/15 border-[#00fdc1]/40 text-[#00fdc1]'
										: 'bg-[#0e0e0e] border-white/10 text-[#ababab] hover:border-white/20',
								)}
							>
								{preset} kg
							</button>
						))}
					</div>

					<div className='text-xs text-[#7c7c7c] bg-[#0e0e0e]/50 border border-white/5 rounded-lg p-3'>
						Used to recommend a practical daily target for your tracking routine.
					</div>
				</div>

				{/* Performance Goal Section */}
				<div className='bg-[#111111] rounded-2xl p-6 border border-white/5 mb-4'>
					<label className='text-[10px] uppercase tracking-[0.2em] font-bold text-[#ababab] block mb-4'>
						Performance Goal
					</label>
					<div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
						<button
							onClick={() => setPerfGoal('gym')}
							className={cn(
								'rounded-xl p-4 text-left transition-all border',
								perfGoal === 'gym'
									? 'bg-[#00fdc1]/15 border-[#00fdc1]/40 ring-1 ring-[#00fdc1]/50'
									: 'bg-[#0e0e0e] border-white/5 opacity-60 hover:opacity-100',
							)}
						>
							<div className='flex items-center gap-2 mb-2'>
								<Target className='w-4 h-4 text-[#00fdc1]' />
								<span className='block font-bold text-sm'>Routine Training</span>
							</div>
							<span className='text-[11px] text-[#ababab] block leading-tight'>Recommended: 0.1g/kg</span>
							<span className='text-[10px] text-[#7c7c7c]'>Steady pace</span>
						</button>
						<button
							onClick={() => setPerfGoal('gym_more')}
							className={cn(
								'rounded-xl p-4 text-left transition-all border',
								perfGoal === 'gym_more'
									? 'bg-[#00fdc1]/15 border-[#00fdc1]/40 ring-1 ring-[#00fdc1]/50'
									: 'bg-[#0e0e0e] border-white/5 opacity-60 hover:opacity-100',
							)}
						>
							<div className='flex items-center gap-2 mb-2'>
								<Zap className='w-4 h-4 text-[#7f98ff]' />
								<span className='block font-bold text-sm'>High Output</span>
							</div>
							<span className='text-[11px] text-[#ababab] block leading-tight'>Recommended: 0.2g/kg</span>
							<span className='text-[10px] text-[#7c7c7c]'>Higher demand</span>
						</button>
					</div>
				</div>

				{/* Daily Goal & Portion Size Section */}
				<div className='grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4'>
					{/* Daily Goal */}
					<div className='bg-[#111111] rounded-2xl p-5 border border-white/5'>
						<label
							htmlFor='setup-daily-goal'
							className='text-[10px] uppercase tracking-[0.2em] font-bold text-[#ababab] block mb-3'
						>
							Daily Goal
						</label>
						<div className='mb-3'>
							<span className='text-[#00fdc1] font-headline font-extrabold text-3xl tracking-tighter'>
								{dailyGoal}
								<span className='text-xs font-normal text-[#ababab]'>g</span>
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

					{/* Portion Size */}
					<div className='bg-[#111111] rounded-2xl p-5 border border-white/5'>
						<label
							htmlFor='setup-portion-size'
							className='text-[10px] uppercase tracking-[0.2em] font-bold text-[#ababab] block mb-3'
						>
							Per Dose
						</label>
						<div className='mb-3'>
							<span className='text-[#7f98ff] font-headline font-extrabold text-3xl tracking-tighter'>
								{portionSize}
								<span className='text-xs font-normal text-[#ababab]'>g</span>
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
				</div>

				{/* Info Boxes */}
				<div className='grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6'>
					<div className='bg-[#0e0e0e] border border-white/5 rounded-xl p-3 text-xs'>
						<div className='text-[#ababab] font-semibold mb-1'>Recommended</div>
						<div className='text-[#00fdc1] font-bold'>{recommendedDose}g</div>
						<div className='text-[#7c7c7c] text-[10px]'>Based on your weight</div>
					</div>
					<div className='bg-[#0e0e0e] border border-white/5 rounded-xl p-3 text-xs'>
						<div className='text-[#ababab] font-semibold mb-1'>Total Doses</div>
						<div className='text-[#7f98ff] font-bold'>
							{dailyGoal / portionSize > 0 ? (dailyGoal / portionSize).toFixed(1) : 1}
						</div>
						<div className='text-[#7c7c7c] text-[10px]'>Per day</div>
					</div>
				</div>
			</motion.div>
			{/* Privacy & Info Section */}
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ delay: 0.2 }}
				className='w-full space-y-4'
			>
				<div className='bg-[#0e0e0e] border border-white/5 rounded-xl p-4 text-xs space-y-2'>
					<div className='flex gap-2'>
						<Info className='w-4 h-4 text-[#7f98ff] flex-shrink-0 mt-0.5' />
						<div>
							<div className='text-[#ababab] font-semibold mb-1'>How It Works</div>
							<p className='text-[#7c7c7c] leading-relaxed'>
								Log intake during the day, keep your target in view, and adjust quickly when needed.
								Your day resets at 4:30 AM by default.
							</p>
						</div>
					</div>
				</div>

				<div className='bg-[#0e0e0e] border border-white/5 rounded-xl p-4 text-xs space-y-2'>
					<div className='flex gap-2'>
						<Info className='w-4 h-4 text-[#00fdc1] flex-shrink-0 mt-0.5' />
						<div>
							<div className='text-[#ababab] font-semibold mb-1'>Privacy First</div>
							<p className='text-[#7c7c7c] leading-relaxed'>
								All your data stays local on this device. Nothing is sent to any server.
							</p>
						</div>
					</div>
				</div>

				<button
					onClick={() => onComplete({ dailyGoal, portionSize, weight, goal: perfGoal })}
					className='w-full h-16 rounded-full bg-gradient-to-r from-[#00edb4] to-[#aaffdc] font-headline font-extrabold text-[#004734] uppercase tracking-widest text-sm flex items-center justify-center gap-3 active:scale-95 transition-transform shadow-xl shadow-[#00fdc1]/10 hover:shadow-[#00fdc1]/20 mt-8'
				>
					Start Tracking
					<ArrowRight className='w-5 h-5' />
				</button>
			</motion.div>
		</div>
	);
}
