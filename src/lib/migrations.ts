export const CURRENT_SCHEMA_VERSION = 1;

type UnknownRecord = Record<string, unknown>;

function isObject(value: unknown): value is UnknownRecord {
	return typeof value === 'object' && value !== null;
}

function getVersion(input: UnknownRecord): number {
	if (typeof input.version !== 'number' || !Number.isFinite(input.version)) {
		return 0;
	}
	return Math.floor(input.version);
}

function migrateV0ToV1(input: UnknownRecord): UnknownRecord {
	// V0 had no explicit schema version; this establishes it.
	return {
		...input,
		version: 1,
	};
}

export function migrateToCurrentVersion(raw: unknown): UnknownRecord {
	if (!isObject(raw)) {
		return { version: CURRENT_SCHEMA_VERSION };
	}

	let migrated: UnknownRecord = { ...raw };
	let version = getVersion(migrated);

	if (version < 1) {
		migrated = migrateV0ToV1(migrated);
		version = 1;
	}

	// Future migrations:
	// if (version < 2) { migrated = migrateV1ToV2(migrated); version = 2; }

	if (version !== CURRENT_SCHEMA_VERSION) {
		migrated.version = CURRENT_SCHEMA_VERSION;
	}

	return migrated;
}
