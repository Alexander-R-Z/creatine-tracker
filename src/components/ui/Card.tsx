import { ReactNode } from 'react';
import { cn } from '../../lib/utils';

export type CardVariant = 'base' | 'elevated' | 'interactive' | 'hero';

interface CardProps {
	children: ReactNode;
	variant?: CardVariant;
	className?: string;
	onClick?: () => void;
	role?: string;
	ariaLabel?: string;
}

const cardVariants: Record<CardVariant, string> = {
	base: 'bg-[#111111] rounded-2xl p-8 border border-white/5',
	elevated: 'bg-[#131313] rounded-2xl p-5 border border-[#4a3b30]/25 shadow-2xl',
	interactive:
		'bg-[#111111] rounded-2xl p-5 border border-white/5 cursor-pointer hover:border-white/10 transition-[border-color,background-color,transform] duration-150 active:scale-95',
	hero: 'bg-[#111111] rounded-[2.5rem] p-8 border border-white/5 shadow-2xl relative overflow-hidden',
};

/**
 * Card component - Base container for content with consistent styling
 * Automatically handles responsive spacing and applies design tokens
 *
 * @example
 * <Card variant="base">
 *   <h2>Title</h2>
 *   <p>Content</p>
 * </Card>
 *
 * @example
 * <Card variant="hero">
 *   <HeroContent />
 * </Card>
 */
export default function Card({ children, variant = 'base', className, onClick, role, ariaLabel }: CardProps) {
	return (
		<div
			className={cn(cardVariants[variant], 'shadow-2xl', className)}
			onClick={onClick}
			{...(role && { role })}
			{...(ariaLabel && { 'aria-label': ariaLabel })}
		>
			{children}
		</div>
	);
}
