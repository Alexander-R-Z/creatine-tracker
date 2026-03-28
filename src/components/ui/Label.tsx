import { ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface LabelProps {
	children: ReactNode;
	className?: string;
	htmlFor?: string;
	color?: 'primary' | 'secondary' | 'tertiary';
}

const labelColorVariants = {
	primary: 'text-[#ababab]',
	secondary: 'text-[#666666]',
	tertiary: 'text-[#444444]',
};

/**
 * Label component - Semantic label element for forms and annotations
 * Provides consistent styling for all text labels throughout the app
 *
 * @example
 * <Label htmlFor="input">Username</Label>
 *
 * @example
 * <Label color="secondary">Secondary label</Label>
 */
export default function Label({ children, className, htmlFor, color = 'primary' }: LabelProps) {
	return (
		<label
			htmlFor={htmlFor}
			className={cn('text-xs font-bold uppercase tracking-widest', labelColorVariants[color], className)}
		>
			{children}
		</label>
	);
}
