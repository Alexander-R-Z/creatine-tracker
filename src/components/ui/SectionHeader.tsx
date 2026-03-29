import { ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface SectionHeaderProps {
	title: string;
	icon?: ReactNode;
	children?: ReactNode;
	className?: string;
}

/**
 * SectionHeader component - Consistent section title with optional icon
 * Used throughout the app for consistent section headers
 * Includes indicator dot that can be customized via icon prop
 *
 * @example
 * <SectionHeader title="Statistics" icon={<ActivityIcon />} />
 *
 * @example
 * <SectionHeader title="Settings">
 *   <SectionDescription>Manage your preferences</SectionDescription>
 * </SectionHeader>
 */
export default function SectionHeader({ title, icon, children, className }: SectionHeaderProps) {
	return (
		<div className={cn('flex items-center gap-2 mb-5', className)}>
			{icon ? (
				<span className='text-[#00fdc1] flex-shrink-0'>{icon}</span>
			) : (
				<span className='w-1.5 h-1.5 rounded-full bg-[#00fdc1] flex-shrink-0' />
			)}
			<span className='text-xs font-bold uppercase tracking-[0.4em] text-[#444444]'>{title}</span>
			{children}
		</div>
	);
}
