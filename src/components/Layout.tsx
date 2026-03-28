import { ReactNode } from 'react';
import { Settings as SettingsIcon, ChevronLeft } from 'lucide-react';
import { cn } from '../lib/utils';
import { View } from '../App';

interface LayoutProps {
	children: ReactNode;
	currentView: View;
	setView: (view: View) => void;
}

export default function Layout({ children, currentView, setView }: LayoutProps) {
	return (
		<div className='max-w-md mx-auto relative min-h-screen'>
			<header className='fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-[#0e0e0e] to-transparent h-16'>
				<div className='max-w-md mx-auto flex items-center justify-between px-6 h-full'>
					<div className='flex items-center'>
						{currentView !== 'home' && (
							<button
								onClick={() => setView('home')}
								aria-label='Go back to home'
								title='Go back to home'
								className='flex items-center justify-center w-10 h-10 rounded-full text-[#ababab] hover:bg-white/5 transition-all active:scale-90'
							>
								<ChevronLeft className='w-6 h-6' />
							</button>
						)}
					</div>

					<button
						onClick={() => setView('settings')}
						aria-label={currentView === 'settings' ? 'Settings (current view)' : 'Open settings'}
						title={currentView === 'settings' ? 'Settings (current view)' : 'Open settings'}
						className={cn(
							'flex items-center justify-center w-10 h-10 rounded-full transition-all active:scale-90',
							currentView === 'settings'
								? 'bg-[#7f98ff]/20 text-[#00fdc1]'
								: 'text-[#ababab] hover:bg-white/5',
						)}
					>
						<SettingsIcon className={cn('w-5 h-5', currentView === 'settings' && 'fill-current')} />
					</button>
				</div>
			</header>

			<main className='px-6 pt-16'>{children}</main>

			{/* Ambient Glows */}
			<div className='fixed top-0 right-0 w-[500px] h-[500px] bg-[#00fdc1]/5 rounded-full blur-[120px] -z-20 pointer-events-none translate-x-1/2 -translate-y-1/2' />
			<div className='fixed bottom-0 left-0 w-[400px] h-[400px] bg-[#7f98ff]/5 rounded-full blur-[100px] -z-20 pointer-events-none -translate-x-1/2 translate-y-1/2' />
		</div>
	);
}
