import { ReactNode } from 'react';
import { cn } from '../../lib/utils';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
	children: ReactNode;
	variant?: ButtonVariant;
	size?: ButtonSize;
	disabled?: boolean;
	onClick?: () => void;
	className?: string;
	title?: string;
	ariaLabel?: string;
	type?: 'button' | 'submit' | 'reset';
}

const buttonVariants: Record<ButtonVariant, string> = {
	primary:
		'bg-white text-black font-headline font-black text-sm uppercase tracking-[0.2em] hover:shadow-lg active:scale-95 md:hover:scale-[1.02] transition-all',
	secondary:
		'bg-[#1a1a1a] text-[#666666] font-headline font-black text-sm uppercase tracking-[0.2em] hover:text-white active:scale-95 md:hover:scale-[1.02] transition-all border border-white/5',
	ghost: 'text-white hover:text-white/80 active:scale-95 transition-all font-headline font-black text-sm uppercase tracking-[0.2em]',
	destructive:
		'bg-[#ff716c] text-black font-headline font-black text-sm uppercase tracking-[0.2em] hover:opacity-90 active:scale-95 transition-all',
};

const buttonSizes: Record<ButtonSize, string> = {
	sm: 'px-3 py-2 text-xs rounded-md',
	md: 'px-6 py-4 text-sm rounded-lg',
	lg: 'px-8 py-5 text-base rounded-xl w-full',
};

const disabledStyles = 'bg-[#1a1a1a] text-[#444444] cursor-not-allowed hover:bg-[#1a1a1a] active:scale-100';

/**
 * Button component - Consistent interactive element with multiple variants
 * Handles all button states: normal, hover, active, disabled
 *
 * @example
 * <Button variant="primary" size="lg">Add Entry</Button>
 *
 * @example
 * <Button variant="secondary" size="sm" onClick={handleReset}>Reset</Button>
 *
 * @example
 * <Button variant="destructive" disabled>Delete</Button>
 */
export default function Button({
	children,
	variant = 'primary',
	size = 'md',
	disabled = false,
	onClick,
	className,
	title,
	ariaLabel,
	type = 'button',
}: ButtonProps) {
	return (
		<button
			type={type}
			disabled={disabled}
			onClick={onClick}
			title={title}
			aria-label={ariaLabel}
			className={cn(
				'font-headline font-black uppercase tracking-[0.2em] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
				disabled ? disabledStyles : buttonVariants[variant],
				buttonSizes[size],
				className,
			)}
		>
			{children}
		</button>
	);
}
