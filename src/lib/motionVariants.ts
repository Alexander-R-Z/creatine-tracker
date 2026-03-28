/* Animation & Motion Variants for consistent animations across the app */

/**
 * Standardized motion variants for transitions
 * Provides consistent easing, duration, and animation patterns
 */

export const motionVariants = {
	/* ========== ENTRANCE ANIMATIONS ========== */
	fadeIn: {
		initial: { opacity: 0 },
		animate: { opacity: 1 },
		exit: { opacity: 0 },
	},

	fadeInUp: {
		initial: { opacity: 0, y: 10 },
		animate: { opacity: 1, y: 0 },
		exit: { opacity: 0, y: 10 },
	},

	fadeInDown: {
		initial: { opacity: 0, y: -10 },
		animate: { opacity: 1, y: 0 },
		exit: { opacity: 0, y: -10 },
	},

	slideUp: {
		initial: { opacity: 0, y: 20 },
		animate: { opacity: 1, y: 0 },
		exit: { opacity: 0, y: 20 },
	},

	slideDown: {
		initial: { opacity: 0, y: -20 },
		animate: { opacity: 1, y: 0 },
		exit: { opacity: 0, y: -20 },
	},

	scaleIn: {
		initial: { opacity: 0, scale: 0.95 },
		animate: { opacity: 1, scale: 1 },
		exit: { opacity: 0, scale: 0.95 },
	},

	scaleInSm: {
		initial: { opacity: 0, scale: 0.9 },
		animate: { opacity: 1, scale: 1 },
		exit: { opacity: 0, scale: 0.9 },
	},

	/* ========== NUMBER TRANSITIONS ========== */
	numberFlip: {
		initial: { opacity: 0, y: 10 },
		animate: { opacity: 1, y: 0 },
		exit: { opacity: 0, y: -10 },
	},

	/* ========== CONTAINER TRANSITIONS ========== */
	containerEnter: {
		initial: { opacity: 0 },
		animate: { opacity: 1 },
		transition: { duration: 0.3, staggerChildren: 0.1, delayChildren: 0.1 },
	},

	containerExit: {
		exit: { opacity: 0 },
	},

	/* ========== PROGRESS BAR ========== */
	progressBar: {
		transition: {
			duration: 0.28,
			ease: 'easeOut',
		},
	},

	progressBarFill: (value: string | number) => ({
		animate: { width: typeof value === 'string' ? value : `${value * 100}%` },
		transition: { duration: 0.28, ease: 'easeOut' },
	}),
};

/**
 * Standard transition configurations
 * Use these for consistent timing across components
 */
export const transitionConfig = {
	/* Durations (ms) */
	fast: 150,
	base: 200,
	slow: 300,
	slower: 500,

	/* Easing functions */
	easing: {
		easeOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
		easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
		easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
		linear: 'linear',
	},

	/* Semantic transitions */
	buttonHover: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
	quickFade: '150ms ease-out',
	standardFade: '200ms ease-out',
	slowFade: '300ms ease-out',
};

/**
 * Preset animation configurations for motion/react
 */
export const animationPresets = {
	/* Button interactions */
	buttonHover: {
		transition: { duration: 0.2 },
	},

	buttonActive: {
		transition: { duration: 0.1 },
	},

	/* Progress animations */
	progressBar: {
		transition: { duration: 0.28, ease: 'easeOut' },
	},

	/* Page transitions */
	pageEnter: {
		transition: { duration: 0.3, staggerChildren: 0.05, delayChildren: 0.1 },
	},

	pageExit: {
		transition: { duration: 0.2 },
	},

	/* List item animations */
	listItem: {
		initial: { opacity: 0, y: 10 },
		animate: { opacity: 1, y: 0 },
		transition: { ease: 'easeOut' },
	},
};

/**
 * Helper to create staggered animations for lists
 * @param itemCount - Number of items in the list
 * @param delayPerItem - Delay between items (ms)
 * @param containerDelay - Initial delay for the container (ms)
 */
export const createStaggerConfig = (itemCount: number, delayPerItem: number = 50, containerDelay: number = 100) => ({
	container: {
		initial: 'hidden',
		animate: 'visible',
		variants: {
			visible: {
				transition: {
					staggerChildren: delayPerItem / 1000,
					delayChildren: containerDelay / 1000,
				},
			},
		},
	},
	item: {
		variants: {
			hidden: { opacity: 0, y: 10 },
			visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
		},
	},
});
