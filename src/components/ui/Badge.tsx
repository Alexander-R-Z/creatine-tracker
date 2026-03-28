import { ReactNode } from 'react';
import { cn } from '../../lib/utils';

export type BadgeVariant = 'primary' | 'secondary' | 'neutral' | 'success' | 'warning';

interface BadgeProps {
	children: ReactNode;
	variant?: BadgeVariant;
	className?: string;
}

const badgeVariants: Record<BadgeVariant, string> = {
	primary:
		'bg-[#00fdc1]/10 text-[#00fdc1] border border-[#00fdc1]/20 px-2 py-1 rounded-full text-[8px] font-black uppercase tracking-widest',
	secondary:
		'bg-[#7f98ff]/10 text-[#7f98ff] border border-[#7f98ff]/20 px-2 py-1 rounded-full text-[8px] font-black uppercase tracking-widest',
	neutral:
		'bg-[#444444]/10 text-[#ababab] border border-[#444444]/20 px-2 py-1 rounded-full text-[8px] font-black uppercase tracking-widest',
	success:
		'bg-[#00edb4]/10 text-[#00edb4] border border-[#00edb4]/20 px-2 py-1 rounded-full text-[8px] font-black uppercase tracking-widest',
	warning:
		'bg-[#ff716c]/10 text-[#ff716c] border border-[#ff716c]/20 px-2 py-1 rounded-full text-[8px] font-black uppercase tracking-widest',
};

/**
 * Badge component - Small inline label for status or tag information
 * Provides consistent styling with multiple variant options
 *
 * @example
 * <Badge variant="primary">Smart Capped</Badge>
 *
 * @example
 * <Badge variant="success">Complete</Badge>
 */
export default function Badge({ children, variant = 'neutral', className }: BadgeProps) {
	return <span className={cn(badgeVariants[variant], className)}>{children}</span>;
}
