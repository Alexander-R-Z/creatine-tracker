import { ChangeEvent, useRef, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
	Plus,
	Minus,
	Calculator,
	X,
	Settings as SettingsIcon,
	Trash2,
	Download,
	Upload,
	Target,
	Zap,
	Info,
} from 'lucide-react';
import { AppState, Settings as SettingsType } from '../lib/storage';
import { cn } from '../lib/utils';
import { Button, Card } from './ui';
import {
	applyImportedState,
	createBackupPayload,
	hasMergeRollbackSnapshot,
	ImportMode,
	parseBackupPayload,
	rollbackLastMergeImport,
} from '../lib/backup';

interface SettingsProps {
	state: AppState;
	updateState: (updater: (prev: AppState) => AppState) => void;
	onReset: () => void;
}

export default function Settings({ state, updateState, onReset }: SettingsProps) {
	const [isCalibrating, setIsCalibrating] = useState(false);
	const [isImportModeOpen, setIsImportModeOpen] = useState(false);
	const [pendingImportState, setPendingImportState] = useState<AppState | null>(null);
	const [selectedImportMode, setSelectedImportMode] = useState<ImportMode>('replace');
	const [canRollbackMergeImport, setCanRollbackMergeImport] = useState(() => hasMergeRollbackSnapshot());
	const [weight, setWeight] = useState(state.settings.weight || 70);
	const [perfGoal, setPerfGoal] = useState<'gym' | 'gym_more'>(state.settings.goal || 'gym');
	const fileInputRef = useRef<HTMLInputElement | null>(null);
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

	const updateEntryRetentionMonths = (val: number) => {
		updateState((prev) => ({
			...prev,
			settings: { ...prev.settings, entryRetentionMonths: Math.max(3, Math.min(60, val)) },
		}));
	};

	// Format months as "Xy Zm" (e.g., "2y", "1y 3m", "6m")
	const formatRetentionMonths = (months: number): string => {
		const years = Math.floor(months / 12);
		const remainingMonths = months % 12;
		if (years > 0 && remainingMonths > 0) {
			return `${years}y ${remainingMonths}m`;
		} else if (years > 0) {
			return `${years}y`;
		} else {
			return `${months}m`;
		}
	};

	const resetTimeDisplay = state.settings.resetTime || '04:30';
	const entryRetentionMonths = state.settings.entryRetentionMonths ?? 24;

	const triggerImportFile = () => {
		fileInputRef.current?.click();
	};

	const handleExportBackup = () => {
		const payload = createBackupPayload(state);
		const blob = new Blob([payload], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const stamp = new Date().toISOString().slice(0, 10);
		const anchor = document.createElement('a');
		anchor.href = url;
		anchor.download = `creatine-tracker-backup-${stamp}.json`;
		anchor.click();
		URL.revokeObjectURL(url);
	};

	const handleImportFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file) return;

		try {
			const content = await file.text();
			const parsed = parseBackupPayload(content);
			setPendingImportState(parsed);
			setSelectedImportMode('replace');
			setIsImportModeOpen(true);
		} catch (error) {
			console.error('Failed to import backup', error);
			window.alert('Import failed. Please choose a valid backup JSON file.');
		} finally {
			event.target.value = '';
		}
	};

	const applyImport = () => {
		if (!pendingImportState) return;
		updateState((prev) => applyImportedState(prev, pendingImportState, selectedImportMode));
		setCanRollbackMergeImport(hasMergeRollbackSnapshot());
		setPendingImportState(null);
		setIsImportModeOpen(false);
	};

	const handleRollbackMergeImport = () => {
		if (!hasMergeRollbackSnapshot()) {
			setCanRollbackMergeImport(false);
			window.alert('No merge rollback is currently available.');
			return;
		}

		updateState((prev) => rollbackLastMergeImport(prev));
		setCanRollbackMergeImport(false);
		window.alert('Last merge import was rolled back successfully.');
	};

	return (
		<div className='space-y-8 pb-20'>
			<section>
				<h2 className='font-headline text-3xl font-extrabold tracking-tight mb-1'>Settings</h2>
				<p className='text-[#b8a697] text-sm'>Fine-tune your parameters.</p>
			</section>

			<div className='grid gap-6 xl:grid-cols-2 xl:items-start'>
				{/* Performance Goals Section */}
				<section className='space-y-4 xl:col-start-1'>
					<div className='flex items-center gap-2 mb-2'>
						<SettingsIcon className='text-[#00fdc1] w-4 h-4' />
						<span className='text-xs font-headline font-bold tracking-widest text-[#ababab] uppercase'>
							Performance Goals
						</span>
					</div>
					<p className='text-[11px] text-[#9a897c]'>Values save instantly. Use +/- to adjust your targets.</p>

					<div className='space-y-3'>
						{/* Daily Amount Card */}
						<div className='bg-[#262626]/40 backdrop-blur-xl p-5 rounded-[1.5rem] flex items-center justify-between border border-[#4a3b30]/25 relative overflow-hidden'>
							<div className='pointer-events-none absolute -left-12 -bottom-12 w-32 h-32 bg-[#4a3b30]/12 blur-[80px] rounded-full' />
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
						<div className='bg-[#262626]/40 backdrop-blur-xl p-5 rounded-[1.5rem] flex items-center justify-between border border-[#4a3b30]/25 relative overflow-hidden'>
							<div className='pointer-events-none absolute -left-12 -bottom-12 w-32 h-32 bg-[#4a3b30]/12 blur-[80px] rounded-full' />
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
				<section className='space-y-4 xl:col-start-2 xl:row-start-1 xl:sticky xl:top-24'>
					<div className='flex items-center gap-2 mb-2'>
						<Calculator className='text-[#7f98ff] w-4 h-4' />
						<span className='text-xs font-headline font-bold tracking-widest text-[#ababab] uppercase'>
							Smart Calibration
						</span>
					</div>
					<div className='bg-[#131313] p-5 rounded-[1.5rem] border border-white/10 relative overflow-hidden'>
						<div className='absolute -right-6 -top-6 w-28 h-28 bg-[#7f98ff]/10 blur-3xl rounded-full pointer-events-none' />
						<div className='relative z-10'>
							<div className='text-[10px] uppercase tracking-[0.2em] font-bold text-[#666666] mb-3'>
								Live Snapshot
							</div>
							<div className='grid grid-cols-2 gap-3'>
								<div className='rounded-xl bg-[#171717] border border-white/5 p-3'>
									<div className='text-[9px] uppercase tracking-widest font-bold text-[#666666]'>
										Daily Goal
									</div>
									<div className='text-xl font-headline font-black text-[#00fdc1] mt-1'>
										{state.settings.dailyGoal}g
									</div>
								</div>
								<div className='rounded-xl bg-[#171717] border border-white/5 p-3'>
									<div className='text-[9px] uppercase tracking-widest font-bold text-[#666666]'>
										Portion
									</div>
									<div className='text-xl font-headline font-black text-[#7f98ff] mt-1'>
										{state.settings.portionSize}g
									</div>
								</div>
								<div className='rounded-xl bg-[#171717] border border-white/5 p-3'>
									<div className='text-[9px] uppercase tracking-widest font-bold text-[#666666]'>
										Reset
									</div>
									<div className='text-xl font-headline font-black text-white mt-1'>
										{resetTimeDisplay}
									</div>
								</div>
								<div className='rounded-xl bg-[#171717] border border-white/5 p-3'>
									<div className='text-[9px] uppercase tracking-widest font-bold text-[#666666]'>
										Suggested
									</div>
									<div className='text-xl font-headline font-black text-[#00fdc1] mt-1'>
										{recommendedDose}g
									</div>
								</div>
							</div>
						</div>
					</div>
					<div className='bg-[#131313] p-6 rounded-[1.5rem] border border-[#4a3b30]/25 relative overflow-hidden'>
						<div className='absolute -right-4 -top-4 w-24 h-24 bg-[#00fdc1]/5 blur-3xl rounded-full' />
						<div className='absolute -left-10 -bottom-12 w-36 h-36 bg-[#4a3b30]/14 blur-[95px] rounded-full pointer-events-none' />
						<div className='relative z-10'>
							<h3 className='font-headline font-bold text-lg mb-2'>Calculate by Weight</h3>
							<p className='text-[#ababab] text-sm mb-6 leading-relaxed'>
								The algorithm calculates recomended gram based on your mass. (0.1g/kg for gym, 0.2g/kg
								for gym & more)
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
				<section className='space-y-4 xl:col-start-1'>
					<div className='flex items-center gap-2 mb-2'>
						<SettingsIcon className='text-tertiary w-4 h-4' />
						<span className='text-xs font-headline font-bold tracking-widest text-[#ababab] uppercase'>
							System
						</span>
					</div>
					<div className='space-y-4'>
						<div className='p-5 bg-[#131313] rounded-[1.5rem] border border-[#4a3b30]/25 space-y-4 relative overflow-hidden'>
							<div className='pointer-events-none absolute -left-10 -bottom-14 w-36 h-36 bg-[#4a3b30]/12 blur-[90px] rounded-full' />
							<div className='flex justify-between items-center'>
								<div className='flex flex-col'>
									<span className='text-sm font-bold text-white'>Daily Reset Time</span>
									<span className='text-[10px] text-[#666666] uppercase tracking-wider'>
										Current: {resetTimeDisplay}
									</span>
								</div>
								<span className='text-xl font-headline font-black text-[#00fdc1]'>
									{resetTimeDisplay}
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
								Your tracking day closes at {resetTimeDisplay}. Logs before that time count toward the
								previous day; logs after it count toward the current day.
							</p>
						</div>

						<div className='p-5 bg-[#131313] rounded-[1.5rem] border border-[#4a3b30]/25 space-y-4 relative overflow-hidden'>
							<div className='pointer-events-none absolute -left-10 -bottom-14 w-36 h-36 bg-[#4a3b30]/12 blur-[90px] rounded-full' />
							<div className='flex justify-between items-center'>
								<div className='flex flex-col'>
									<span className='text-sm font-bold text-white'>Entry History Retention</span>
									<span className='text-[10px] text-[#666666] uppercase tracking-wider'>
										Current: {formatRetentionMonths(entryRetentionMonths)}
									</span>
								</div>
								<span className='text-xl font-headline font-black text-[#00fdc1]'>
									{formatRetentionMonths(entryRetentionMonths)}
								</span>
							</div>
							<input
								id='settings-entry-retention'
								type='range'
								min='3'
								max='60'
								step='1'
								value={entryRetentionMonths}
								onChange={(e) => updateEntryRetentionMonths(parseInt(e.target.value, 10))}
								aria-label='Entry history retention in months'
								className='w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-[#00fdc1]'
							/>
							<p className='text-[10px] text-[#ababab] leading-relaxed italic'>
								Old entries (per-entry timestamps) are automatically removed after{' '}
								{formatRetentionMonths(entryRetentionMonths)}, but daily totals are preserved for
								history and streak calculations.
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

				{/* Data Backup Section */}
				<section className='space-y-4 xl:col-start-2'>
					<div className='flex items-center gap-2 mb-2'>
						<SettingsIcon className='text-[#7f98ff] w-4 h-4' />
						<span className='text-xs font-headline font-bold tracking-widest text-[#ababab] uppercase'>
							Data Backup
						</span>
					</div>
					<div className='p-5 bg-[#131313] rounded-[1.5rem] border border-[#4a3b30]/25 space-y-4 relative overflow-hidden'>
						<div className='pointer-events-none absolute -left-10 -bottom-14 w-36 h-36 bg-[#4a3b30]/12 blur-[90px] rounded-full' />
						<p className='text-[11px] text-[#8a8a8a] leading-relaxed'>
							Backups are local JSON files. Merge mode replaces matching days with imported values and can
							be rolled back for 7 days.
						</p>
						<div className='grid grid-cols-2 gap-3'>
							<button
								onClick={handleExportBackup}
								className='w-full h-11 rounded-xl bg-[#1a1a1a] border border-white/10 flex items-center justify-center gap-2 text-white font-semibold text-sm hover:bg-white/5 transition-all'
							>
								<Download className='w-4 h-4' />
								Export
							</button>
							<button
								onClick={triggerImportFile}
								className='w-full h-11 rounded-xl bg-[#1a1a1a] border border-white/10 flex items-center justify-center gap-2 text-white font-semibold text-sm hover:bg-white/5 transition-all'
							>
								<Upload className='w-4 h-4' />
								Import
							</button>
						</div>
						<button
							onClick={handleRollbackMergeImport}
							disabled={!canRollbackMergeImport}
							className={cn(
								'w-full h-11 rounded-xl border font-semibold text-sm transition-all',
								canRollbackMergeImport
									? 'bg-[#1a1a1a] border-[#7f98ff]/30 text-[#7f98ff] hover:bg-[#7f98ff]/10'
									: 'bg-[#1a1a1a] border-white/10 text-[#666666] cursor-not-allowed',
							)}
						>
							Rollback Last Merge (7d)
						</button>
						<input
							ref={fileInputRef}
							type='file'
							accept='application/json,.json'
							onChange={handleImportFileChange}
							aria-label='Choose backup JSON file'
							title='Choose backup JSON file'
							className='hidden'
						/>
					</div>
				</section>
			</div>

			{/* Calibration Modal */}
			<AnimatePresence>
				{isCalibrating && (
					<div className='fixed inset-0 z-[60] flex items-end md:items-center justify-center px-4 md:px-6 pb-10 md:pb-6 bg-black/80 backdrop-blur-sm'>
						<motion.div
							initial={{ y: 100, opacity: 0 }}
							animate={{ y: 0, opacity: 1 }}
							exit={{ y: 100, opacity: 0 }}
							className='w-full max-w-md md:max-w-xl bg-[#111111] backdrop-blur-2xl rounded-2xl md:rounded-[1.75rem] border border-white/5 shadow-2xl overflow-hidden flex flex-col max-h-[calc(100vh-120px)] md:max-h-[85vh]'
						>
							{/* Header */}
							<div className='bg-gradient-to-b from-[#1a1a1a] to-[#111111] px-5 py-4 border-b border-white/5 flex-shrink-0'>
								<div className='flex justify-between items-center mb-2'>
									<div className='flex items-center gap-2.5'>
										<div className='p-1.5 rounded-lg bg-[#7f98ff]/10 border border-[#7f98ff]/20'>
											<Calculator className='w-4 h-4 text-[#7f98ff]' />
										</div>
										<h3 className='font-headline text-xl font-extrabold'>Calibration</h3>
									</div>
									<button
										onClick={() => setIsCalibrating(false)}
										aria-label='Close calibration'
										title='Close calibration'
										className='text-[#ababab] hover:text-white transition-colors'
									>
										<X className='w-5 h-5' />
									</button>
								</div>
								<p className='text-[#7c7c7c] text-[11px]'>
									Adjust your body weight and performance level to calculate the optimal daily dose.
								</p>
							</div>

							{/* Content - Scrollable */}
							<div className='px-5 py-4 space-y-3.5 overflow-y-auto flex-1'>
								{/* Weight Section */}
								<div className='bg-[#0e0e0e] border border-white/5 rounded-xl p-5 space-y-4'>
									<label className='text-xs font-headline font-bold tracking-widest text-[#ababab] uppercase block'>
										Body Weight
									</label>
									<div className='flex items-center justify-between'>
										<div className='flex items-baseline gap-2'>
											<span className='text-5xl font-headline font-black text-[#00fdc1]'>
												{weight}
											</span>
											<span className='text-xl font-bold text-[#ababab]'>kg</span>
										</div>
										<div className='flex items-center gap-2'>
											<button
												onClick={() => setWeight((prev) => Math.max(20, prev - 1))}
												disabled={!canDecreaseWeight}
												aria-label='Decrease weight'
												title='Decrease weight'
												className={cn(
													'w-10 h-10 rounded-full border flex items-center justify-center transition-all',
													canDecreaseWeight
														? 'border-white/10 text-white active:scale-90 hover:bg-white/10'
														: 'border-white/5 text-white/30 cursor-not-allowed',
												)}
											>
												<Minus className='w-4 h-4' />
											</button>
											<button
												onClick={() => setWeight((prev) => Math.min(250, prev + 1))}
												disabled={!canIncreaseWeight}
												aria-label='Increase weight'
												title='Increase weight'
												className={cn(
													'w-10 h-10 rounded-full border flex items-center justify-center transition-all',
													canIncreaseWeight
														? 'border-white/10 text-white active:scale-90 hover:bg-white/10'
														: 'border-white/5 text-white/30 cursor-not-allowed',
												)}
											>
												<Plus className='w-4 h-4' />
											</button>
										</div>
									</div>
									<div className='text-xs text-[#7c7c7c] bg-[#000000] border border-white/5 rounded-lg p-2.5'>
										Used to calculate your recommended daily creatine dose.
									</div>
								</div>

								{/* Performance Goal Section */}
								<div className='bg-[#0e0e0e] border border-white/5 rounded-xl p-5 space-y-3'>
									<label className='text-xs font-headline font-bold tracking-widest text-[#ababab] uppercase block'>
										Performance Goal
									</label>
									<div className='grid grid-cols-2 gap-2'>
										<button
											onClick={() => setPerfGoal('gym')}
											className={cn(
												'rounded-lg p-3 text-left transition-all border text-xs',
												perfGoal === 'gym'
													? 'bg-[#00fdc1]/15 border-[#00fdc1]/40 ring-1 ring-[#00fdc1]/50'
													: 'bg-[#1a1a1a] border-white/5 opacity-60 hover:opacity-100',
											)}
										>
											<div className='flex items-center gap-2 mb-1.5'>
												<Target className='w-3.5 h-3.5 text-[#00fdc1]' />
												<span className='block font-bold text-xs'>Gym</span>
											</div>
											<span className='text-[10px] text-[#ababab] block leading-tight'>
												0.1g/kg (max 10g)
											</span>
										</button>
										<button
											onClick={() => setPerfGoal('gym_more')}
											className={cn(
												'rounded-lg p-3 text-left transition-all border text-xs',
												perfGoal === 'gym_more'
													? 'bg-[#00fdc1]/15 border-[#00fdc1]/40 ring-1 ring-[#00fdc1]/50'
													: 'bg-[#1a1a1a] border-white/5 opacity-60 hover:opacity-100',
											)}
										>
											<div className='flex items-center gap-2 mb-1.5'>
												<Zap className='w-3.5 h-3.5 text-[#7f98ff]' />
												<span className='block font-bold text-xs'>Gym & More</span>
											</div>
											<span className='text-[10px] text-[#ababab] block leading-tight'>
												0.2g/kg (max 22g)
											</span>
										</button>
									</div>
								</div>

								{/* Recommendation Box */}
								<div className='bg-gradient-to-br from-[#00fdc1]/10 to-[#00fdc1]/5 border border-[#00fdc1]/20 rounded-xl p-4'>
									<div className='flex items-center gap-2 mb-2'>
										<Info className='w-4 h-4 text-[#00fdc1]' />
										<span className='text-xs font-bold text-[#ababab] uppercase tracking-wide'>
											Calculated Result
										</span>
									</div>
									<div className='flex items-baseline gap-2'>
										<span className='text-4xl font-headline font-black text-[#00fdc1]'>
											{recommendedDose}
										</span>
										<span className='text-lg font-bold text-[#ababab]'>grams</span>
									</div>
									<p className='text-xs text-[#7c7c7c] mt-2'>
										Recommended daily dose based on {weight}kg and{' '}
										{perfGoal === 'gym' ? 'standard' : 'high intensity'} training.
									</p>
								</div>
							</div>

							{/* Action Buttons - Fixed Footer */}
							<div className='bg-gradient-to-t from-[#111111] to-[#111111]/95 px-5 py-3 border-t border-white/5 flex gap-2 flex-shrink-0'>
								<button
									onClick={() => setIsCalibrating(false)}
									className='flex-1 h-10 rounded-full border border-white/10 text-white font-headline font-bold text-xs uppercase tracking-wider hover:bg-white/5 transition-all active:scale-95'
								>
									Cancel
								</button>
								<button
									onClick={handleApplyCalibration}
									className='flex-1 h-10 rounded-full bg-gradient-to-r from-[#00edb4] to-[#aaffdc] text-[#004734] font-headline font-extrabold text-xs uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-[#00fdc1]/10 hover:shadow-[#00fdc1]/20'
								>
									Apply
								</button>
							</div>
						</motion.div>
					</div>
				)}
			</AnimatePresence>

			{/* Import Mode Modal */}
			<AnimatePresence>
				{isImportModeOpen && pendingImportState && (
					<div className='fixed inset-0 z-[70] flex items-end md:items-center justify-center px-4 md:px-6 pb-10 md:pb-6 bg-black/80 backdrop-blur-sm'>
						<motion.div
							initial={{ y: 100, opacity: 0 }}
							animate={{ y: 0, opacity: 1 }}
							exit={{ y: 100, opacity: 0 }}
							className='w-full max-w-md md:max-w-lg bg-[#262626]/90 backdrop-blur-2xl rounded-[1.5rem] p-6 border border-white/10 shadow-2xl space-y-5'
						>
							<div className='flex items-center justify-between'>
								<h3 className='font-headline text-xl font-extrabold text-white'>Import Backup</h3>
								<button
									onClick={() => {
										setIsImportModeOpen(false);
										setPendingImportState(null);
									}}
									aria-label='Close import modal'
									title='Close import modal'
									className='text-[#ababab] hover:text-white'
								>
									<X className='w-5 h-5' />
								</button>
							</div>

							<p className='text-[12px] text-[#a4a4a4] leading-relaxed'>
								Choose how to apply imported data. Replace overwrites everything. Merge keeps current
								settings and replaces matching days with imported values.
							</p>

							<div className='space-y-3'>
								<button
									onClick={() => setSelectedImportMode('replace')}
									className={cn(
										'w-full rounded-xl p-4 text-left border transition-all',
										selectedImportMode === 'replace'
											? 'bg-[#ff716c]/10 border-[#ff716c]/40 ring-1 ring-[#ff716c]/50'
											: 'bg-[#1a1a1a] border-white/10',
									)}
								>
									<div className='text-sm font-bold text-white mb-1'>Replace all data</div>
									<div className='text-[11px] text-[#999999]'>
										Current logs and settings are replaced completely by the imported backup.
									</div>
								</button>

								<button
									onClick={() => setSelectedImportMode('merge')}
									className={cn(
										'w-full rounded-xl p-4 text-left border transition-all',
										selectedImportMode === 'merge'
											? 'bg-[#00fdc1]/10 border-[#00fdc1]/40 ring-1 ring-[#00fdc1]/50'
											: 'bg-[#1a1a1a] border-white/10',
									)}
								>
									<div className='text-sm font-bold text-white mb-1'>Merge by date</div>
									<div className='text-[11px] text-[#999999]'>
										Matching days are replaced by imported data. Current settings stay. You can
										rollback the last merge for 7 days.
									</div>
								</button>
							</div>

							<div className='flex gap-2'>
								<button
									onClick={() => {
										setIsImportModeOpen(false);
										setPendingImportState(null);
									}}
									className='flex-1 h-11 rounded-xl bg-[#1a1a1a] border border-white/10 text-[#ababab] font-semibold'
								>
									Cancel
								</button>
								<button
									onClick={applyImport}
									className='flex-1 h-11 rounded-xl bg-white text-black font-semibold'
								>
									Import
								</button>
							</div>
						</motion.div>
					</div>
				)}
			</AnimatePresence>
		</div>
	);
}
