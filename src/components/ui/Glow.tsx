import { cn } from '../../lib/utils';

export type GlowColor = 'primary' | 'secondary' | 'tertiary';
export type GlowShape = 'circle' | 'gradient';

interface GlowProps {
	color?: GlowColor;
	shape?: GlowShape;
	className?: string;
	size?: string; // e.g., 'w-[500px] h-[500px]'
	blurSize?: string; // e.g., 'blur-[120px]'
	position?: 'top-right' | 'bottom-left' | 'top-left' | 'bottom-right' | 'center';
	zIndex?: string;
}

const glowColors: Record<GlowColor, string> = {
	primary: 'bg-[#00fdc1]/5',
	secondary: 'bg-[#7f98ff]/5',
	tertiary: 'bg-[#4a3b30]/10',
};

const glowPositions = {
	'top-right': '-right-20 -top-20',
	'bottom-left': '-left-16 -bottom-20',
	'top-left': '-left-20 -top-20',
	'bottom-right': '-right-16 -bottom-20',
	center: 'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2',
};

/**
 * Glow component - Ambient background glow effect
 * Creates decorative blurred circles used throughout the design
 * Commonly used as absolute positioned background elements
 *
 * @example
 * <div className="relative overflow-hidden">
 *   <Glow color="primary" position="top-right" size="w-64 h-64" />
 *   <Glow color="secondary" position="bottom-left" size="w-56 h-56" />
 * </div>
 *
 * @example
 * <Glow
 *   color="primary"
 *   size="w-[500px] h-[500px]"
 *   blurSize="blur-[120px]"
 *   position="top-right"
 *   className="fixed -z-20"
 * />
 */
export default function Glow({
	color = 'primary',
	shape = 'circle',
	className,
	size = 'w-64 h-64',
	blurSize = 'blur-[100px]',
	position = 'top-right',
	zIndex = '-z-10',
}: GlowProps) {
	return (
		<div
			className={cn(
				'absolute',
				glowPositions[position],
				size,
				'rounded-full pointer-events-none',
				glowColors[color],
				blurSize,
				zIndex,
				className,
			)}
			aria-hidden='true'
		/>
	);
}
