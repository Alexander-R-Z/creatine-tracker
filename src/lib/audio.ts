import { AudioSettings } from './storage';

const BOOST_DECAY_MS = 18_000;
const BOOST_IDLE_RESET_MS = 5 * 60 * 1000;
const BOOST_PER_ACTION = 6;
const MAX_EFFECTIVE_INDEX = 59;
let activeAudio: HTMLAudioElement | null = null;

export interface AudioPlaybackDecision {
	effectiveIndex: number;
	selectedIndex: number;
	batchStart: number;
	batchEnd: number;
	muffled: boolean;
}

export interface AudioComboComputation {
	baseCombo: number;
	decayedBoost: number;
	nextBoost: number;
	nextActionTime: number;
	effectiveIndex: number;
}

function clamp(value: number, min: number, max: number): number {
	return Math.max(min, Math.min(max, value));
}

export function decayTemporaryBoost(temporaryBoost: number, lastActionTime: number, now: number): number {
	if (temporaryBoost <= 0 || lastActionTime <= 0) return 0;
	const elapsed = now - lastActionTime;
	if (elapsed <= 0) return temporaryBoost;
	if (elapsed >= BOOST_IDLE_RESET_MS) return 0;
	const decayRate = 1 / BOOST_DECAY_MS;
	return temporaryBoost * Math.exp(-decayRate * elapsed);
}

export function getEffectiveIndex(baseCombo: number, temporaryBoost: number): number {
	return clamp(Math.floor(baseCombo + temporaryBoost), 0, MAX_EFFECTIVE_INDEX);
}

export function getBatchStart(index: number): number {
	const normalized = clamp(Math.floor(index), 0, MAX_EFFECTIVE_INDEX);
	return Math.floor(normalized / 10) * 10;
}

export function pickRandomInBatch(batchStart: number): number {
	const safeStart = getBatchStart(batchStart);
	return safeStart + Math.floor(Math.random() * 10);
}

export function computeNextCombo(
	settings: AudioSettings,
	baseCombo: number,
	now: number = Date.now(),
): AudioComboComputation {
	const normalizedBase = clamp(Math.floor(baseCombo), 0, 35);
	const decayedBoost = decayTemporaryBoost(settings.combo.temporaryBoost, settings.combo.lastActionTime, now);
	const nextBoost = clamp(decayedBoost + BOOST_PER_ACTION, 0, 40);
	const effectiveIndex = getEffectiveIndex(normalizedBase, nextBoost);

	return {
		baseCombo: normalizedBase,
		decayedBoost,
		nextBoost,
		nextActionTime: now,
		effectiveIndex,
	};
}

function toFileName(index: number): string {
	return `${index.toString().padStart(2, '0')}.mp3`;
}

export function getSoundUrl(index: number): string {
	return `${import.meta.env.BASE_URL}sounds/${toFileName(index)}`;
}

export function preloadSoundBatch(start: number): void {
	const safeStart = getBatchStart(start);
	for (let offset = 0; offset < 10; offset++) {
		const audio = new Audio(getSoundUrl(safeStart + offset));
		audio.preload = 'auto';
	}
}

export function preloadLikelySounds(): void {
	preloadSoundBatch(0);
	preloadSoundBatch(10);
}

function isAudioPlaying(audio: HTMLAudioElement | null): boolean {
	if (!audio) return false;
	return !audio.paused && !audio.ended && audio.currentTime > 0;
}

function clearActiveAudio(target: HTMLAudioElement): void {
	if (activeAudio === target) {
		activeAudio = null;
	}
}

export function playSoundByIndex(index: number, muffled: boolean, force: boolean = false): boolean {
	if (isAudioPlaying(activeAudio)) {
		if (!force) {
			return false;
		}

		activeAudio?.pause();
		if (activeAudio) {
			activeAudio.currentTime = 0;
		}
		activeAudio = null;
	}

	const audio = new Audio(getSoundUrl(index));
	audio.preload = 'auto';
	audio.volume = muffled ? 0.5 : 1;
	activeAudio = audio;

	audio.onended = () => clearActiveAudio(audio);
	audio.onpause = () => {
		if (audio.ended) {
			clearActiveAudio(audio);
		}
	};
	audio.onerror = () => clearActiveAudio(audio);

	void audio.play().catch(() => {
		// Ignore playback errors (e.g. missing file or blocked autoplay)
		clearActiveAudio(audio);
	});

	return true;
}

function isEventEnabled(settings: AudioSettings, eventType: AudioEventType): boolean {
	if (!settings.enabled) return false;
	if (eventType === 'addPortion') return settings.addPortion;
	if (eventType === 'dailyGoalReached') return settings.dailyGoalReached;
	if (eventType === 'correctToday') return settings.correctToday.enabled;
	if (eventType === 'increaseDecrease') return settings.increaseDecrease.enabled;
	return settings.historyEdit.enabled;
}

function isMuffled(settings: AudioSettings, eventType: AudioEventType): boolean {
	if (eventType === 'correctToday') return settings.correctToday.muffled;
	if (eventType === 'increaseDecrease') return settings.increaseDecrease.muffled;
	if (eventType === 'historyEdit') return settings.historyEdit.muffled;
	return false;
}

export type AudioEventType = 'addPortion' | 'dailyGoalReached' | 'correctToday' | 'increaseDecrease' | 'historyEdit';

export function decideAndPlay(
	settings: AudioSettings,
	eventType: AudioEventType,
	effectiveIndex: number,
	muffledOverride?: boolean,
): AudioPlaybackDecision | null {
	if (!isEventEnabled(settings, eventType)) return null;

	const batchStart = getBatchStart(effectiveIndex);
	const selectedIndex = pickRandomInBatch(batchStart);
	const muffled = typeof muffledOverride === 'boolean' ? muffledOverride : isMuffled(settings, eventType);
	const shouldForcePlay = eventType === 'dailyGoalReached';

	const played = playSoundByIndex(selectedIndex, muffled, shouldForcePlay);
	if (!played) return null;

	return {
		effectiveIndex,
		selectedIndex,
		batchStart,
		batchEnd: batchStart + 9,
		muffled,
	};
}
