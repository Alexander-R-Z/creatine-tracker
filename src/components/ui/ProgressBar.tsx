import { motion } from 'motion/react';
import { cn } from '../../lib/utils';

interface ProgressBarProps {
	progress: number; // 0 to 1
	isGoalReached?: boolean;
	className?: string;
	animated?: boolean;
}

/**
 * ProgressBar component - Animated progress indicator
 * Transitions smoothly between states with consistent animation timing
 * Color changes based on goal reached status
 *
 * @param progress - Progress value between 0 and 1
 * @param isGoalReached - Whether the goal has been reached (affects color)
 * @param className - Additional CSS classes
 * @param animated - Enable/disable animations (default: true)
 *
 * @example
 * <ProgressBar progress={0.75} isGoalReached={false} />
 *
 * @example
 * <ProgressBar progress={1} isGoalReached={true} />
 */
export default function ProgressBar({ progress, isGoalReached = false, className, animated = true }: ProgressBarProps) {
	const clampedProgress = Math.min(1, Math.max(0, progress));

	return (
		<div className={cn('w-full h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden', className)}>
			<motion.div
				initial={animated ? false : undefined}
				animate={{
					width: `${clampedProgress * 100}%`,
				}}
				transition={{
					duration: 0.28,
					ease: 'easeOut',
				}}
				className={cn(
					'h-full transition-shadow',
					isGoalReached ? 'bg-tertiary shadow-[0_0_25px_rgba(74,59,48,0.6)]' : 'bg-[#7f98ff]',
				)}
			/>
		</div>
	);
}
