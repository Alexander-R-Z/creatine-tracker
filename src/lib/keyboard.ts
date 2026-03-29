import { useEffect } from 'react';

export interface ShortcutDefinition {
	id: string;
	description: string;
	combo: string;
	match: (event: KeyboardEvent) => boolean;
	action: () => void;
	enabled?: boolean;
	allowInInput?: boolean;
	preventDefault?: boolean;
}

function isTypingTarget(target: EventTarget | null): boolean {
	if (!(target instanceof HTMLElement)) {
		return false;
	}

	if (target.isContentEditable) {
		return true;
	}

	const tag = target.tagName;
	if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
		return true;
	}

	return Boolean(target.closest('[contenteditable="true"]'));
}

export function useKeyboardShortcuts(shortcuts: ShortcutDefinition[]) {
	useEffect(() => {
		const onKeyDown = (event: KeyboardEvent) => {
			for (const shortcut of shortcuts) {
				if (shortcut.enabled === false) {
					continue;
				}

				if (!shortcut.allowInInput && isTypingTarget(event.target)) {
					continue;
				}

				if (!shortcut.match(event)) {
					continue;
				}

				if (shortcut.preventDefault !== false) {
					event.preventDefault();
				}

				shortcut.action();
				break;
			}
		};

		window.addEventListener('keydown', onKeyDown);
		return () => window.removeEventListener('keydown', onKeyDown);
	}, [shortcuts]);
}

export function isModKeyPressed(event: KeyboardEvent): boolean {
	return event.metaKey || event.ctrlKey;
}
