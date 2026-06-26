# Blaze Skate Journal V1.0 Release Notes

## Release Name

Blaze Skate Journal V1.0

## Release Summary

Blaze Skate Journal V1.0 is a release candidate for daily short track skating training records. It covers athlete profile, daily logs, training sessions, calendar history, weekly review, coach notes, performance records, body status, video references, summer camp review, export, bilingual UI, Auth, and PWA mobile shell.

## Major Features

- Firebase Auth email login, registration, password reset, password update, email update, and account deletion flow.
- Athlete profile with display name, bio, avatar, birthday, and skating start date.
- Daily Journal with stable `YYYY-MM-DD` date input, energy, soreness, training focus, coach feedback, parent note, reflection, and completion state.
- Training Sessions with short track fields for ice/dryland/race/recovery detail.
- Calendar with Daily + Sessions day markers and day summaries.
- Weekly Review with generated 7-day summary and manual reflections.
- Dashboard with profile, recent 7-day summary, today's Daily prompt, quick links, and recent sessions.
- Coach Notes with priority, tags, follow-up, and linked session ID.
- Performance records with PB calculation.
- Body status with sleep, fatigue, mood, soreness, weight, height, and injury note.
- Video references for links and metadata.
- Summer Camp date range summary.
- JSON/CSV export.
- English/Chinese i18n.
- Vite PWA app shell and bottom navigation.

## Data Model Summary

V1.0 keeps the existing Firestore model stable. Shared metadata includes:

- `athleteId`
- `sourceApp`
- `schemaVersion`
- `createdAt`
- `updatedAt`

Ownership remains:

```text
athleteId == Firebase Auth user.uid
```

V1.0 does not introduce `ownerUid` or a separate multi-athlete ownership model.

## Firestore Path Summary

Collections are defined in `src/constants/skatingx.js`:

- `athletes`
- `journal_days`
- `training_sessions`
- `coach_notes`
- `body_status`
- `performance_records`
- `video_refs`
- `weekly_reviews`
- `milestones`

No Firestore paths, collection names, rules, Storage rules, or indexes were changed for Step 7.

## What Changed From Original MVP

- Stabilized lint/build/smoke checks.
- Added pure payload builders and aggregation helpers.
- Hardened Daily and Sessions core flows.
- Added short track specific training session fields.
- Improved Calendar, Weekly Review, and Dashboard review/history summaries.
- Standardized `YYYY-MM-DD` text date inputs.
- Expanded English/Chinese i18n coverage.
- Added user-facing saved/failed/invalid/empty states across key pages.
- Added final QA checklist, user guide, release notes, development summary, and project README.

## QA Status

- `npm run lint`: passed on Step 7 baseline.
- `npm run build`: passed on Step 7 baseline.
- `npm run smoke:journal`: passed on Step 7 baseline with 18 checks.

## Known Limitations

- Build reports a Vite chunk size warning above 500 kB.
- Build reports a Node `module.register()` deprecation warning.
- No real Firebase E2E automated test suite exists.
- No TypeScript typecheck exists because the app is currently JavaScript.
- Parent/coach/multi-athlete ownership is not separated in V1.0.
- Some list screens still use client-side filtering after limited reads.
- Videos are references/links, not a video upload and storage system.

## Not Included In V1.0

- Firestore data migration.
- Firestore rules/index redesign.
- SkatingX Platform unified account model.
- Parent/coach role-based access control.
- Multi-athlete support.
- Real Firebase E2E automated test suite.
- Advanced analytics charts.
- Video upload/processing pipeline.
- Full TypeScript migration.

## Recommended Next Version: V1.1

V1.1 should focus on platform readiness:

- Date-range query helpers and read-cost reduction.
- Index review proposal before modifying `firestore.indexes.json`.
- Staging Firebase E2E test plan and test data cleanup.
- Parent/coach/athlete ownership design for SkatingX Platform.
- Optional code splitting to reduce build chunk size.
- Gradual TypeScript migration for shared models and services.
