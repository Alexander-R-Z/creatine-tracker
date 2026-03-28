# Creatine Tracker

A lightweight, local-only tracker for daily creatine intake.

This project is intentionally simple and designed for very small usage (friends/family or personal use), hosted as a static app on GitHub Pages.

## What It Does

- Tracks daily creatine totals with quick add and undo.
- Uses a configurable reset time so your tracking day can roll over later than midnight.
- Shows recent activity, streaks, and longer historical completion view.
- Includes setup and calibration helpers to suggest daily targets.

## Privacy and Data Model

- Data is stored in your browser localStorage on your device.
- No backend, no account, no cloud sync, no telemetry.
- If browser data is cleared (or you switch device/browser), data is lost unless you exported a backup.

## Backup and Import

The app can export/import local JSON backups from the Settings page.

- Export: downloads the full current app state.
- Import mode `Replace all data`: replaces your current local state entirely.
- Import mode `Merge by date`: keeps current settings and imports logs by date. If a date exists in both, the imported day replaces the current day for that date.
- Merge rollback: after a merge import, you can roll back the last merge from Settings for up to 7 days.

Backup file compatibility:

- Wrapped format: `{ exportedAt, app, data }`
- Raw format: direct app state JSON

Both are normalized and validated on import.

## Schema and Migrations

- Persisted state includes a schema `version`.
- Legacy data without version is migrated automatically on load/import.
- Validation runs after migration to keep invalid or partial data from breaking the app.

## Reset Time Behavior

The app uses an effective day based on reset time (default `04:30`):

- Entries before the reset time count toward the previous tracking day.
- Entries after the reset time count toward the current tracking day.

Example with reset `04:30`:

- Logging at `03:45` on Saturday counts as Friday.
- Logging at `05:00` on Saturday counts as Saturday.

## Run Locally

Prerequisite: Node.js 20+ recommended.

1. Install dependencies:
   `npm install`
2. Start dev server:
   `npm run dev`
3. Build production bundle:
   `npm run build`
4. Preview production bundle:
   `npm run preview`

## Deploy (GitHub Pages)

- Vite base path is configured for repository hosting.
- App works as static files; no server-side functionality required.

## Tech Stack

- React + TypeScript + Vite
- Tailwind CSS
- date-fns
- motion
