# Journal V1.0 Data Model Hardening Step 2 QA

## Goal

Create a stable V1.0 data model boundary for Blaze Skate Journal without changing Firestore paths, Firestore rules, Storage rules, indexes, Firebase config, UI visual design, or current production document shape.

## Files Changed

- `docs/journal-v1-data-model.md`
- `docs/journal-v1-data-model-hardening-step-2.md`
- `scripts/smoke-journal.mjs`
- `src/services/journalService.js`
- `src/services/sessionService.js`
- `src/utils/journalPayloadBuilders.js`
- `src/utils/journalSmokeFixtures.js`

## Scope Not Changed

- Firestore collection paths
- `firestore.rules`
- `storage.rules`
- `firestore.indexes.json`
- Firebase project configuration
- UI visual design
- Page routing and page structure
- Existing feature set
- `package-lock`

## Payload Builder Design

The new `src/utils/journalPayloadBuilders.js` module contains pure functions only:

- No Firebase imports
- No Firestore reads or writes
- No React imports
- No UI side effects

Builders added:

- `buildJournalDayPayload(input, context)`
- `buildTrainingSessionPayload(input, context)`
- `buildCoachNotePayload(input, context)`
- `buildBodyStatusPayload(input, context)`
- `buildPerformanceRecordPayload(input, context)`
- `buildVideoRefPayload(input, context)`
- `buildWeeklyReviewPayload(input, context)`

Supported context fields:

- `athleteId`
- `sourceApp`
- `schemaVersion`
- `nowIso`
- `mode`, where `mode: 'update'` writes `updatedAt` without `createdAt`

Metadata behavior:

- Create payloads write `athleteId`, `sourceApp`, `schemaVersion`, `createdAt`, and `updatedAt`.
- Update payloads write `athleteId`, `sourceApp`, `schemaVersion`, and `updatedAt`.
- Update payloads do not write or overwrite `createdAt`.
- Production payloads do not add `ownerUid`.

Normalization behavior:

- Date fields use `YYYY-MM-DD` validation from `dateUtils`.
- Invalid date fields fall back to the date portion of `context.nowIso`, or current date when no stable test clock is provided.
- Numeric duration, rating, intensity, and count fields are minimally normalized to numbers and clamped only where the current UI already constrains the value.

## Service Integration

Low-risk integration completed:

- `journalService.save` now builds create/update payloads through `buildJournalDayPayload`.
- `sessionService.create` and `sessionService.update` now build payloads through `buildTrainingSessionPayload`.

Not integrated in this step:

- `coachNoteService`
- `bodyStatusService`
- `performanceService`
- `videoService`
- `weeklyReviewService`
- `milestoneService`

Reason:

Step 2 intentionally limits production write-path changes to 1-2 low-risk services. Remaining services can be migrated after this smoke gate proves stable.

## Smoke Coverage

`npm run smoke:journal` covers:

- `YYYY-MM-DD` validation
- Monday-based `weekStart` calculation
- `buildJournalDayPayload`
- `buildTrainingSessionPayload`
- `buildCoachNotePayload`
- `buildBodyStatusPayload`
- `buildPerformanceRecordPayload`
- `buildVideoRefPayload`
- `buildWeeklyReviewPayload`
- Invalid date fallback behavior
- Create `createdAt` / `updatedAt` metadata behavior
- Update payload behavior without `createdAt`
- Minimal weekly review aggregation sample

## Verification Commands

- `npm run lint`
- `npm run build`
- `npm run smoke:journal`
- `git status --short`

## Remaining Risks

- Remaining services still build metadata directly through `createRecordMetadata` and `updateRecordMetadata`.
- Smoke checks are pure Node checks and do not verify real Firebase security rules.
- Weekly review auto-generation can still persist `weekSessions` when auto data is saved.
- Build still reports the existing large chunk warning.
- Build still reports the current Node `module.register()` deprecation warning.

## Next Step

Migrate the remaining write services to `journalPayloadBuilders.js` one group at a time, starting with `coachNoteService`, `bodyStatusService`, and `performanceService`, then extend smoke coverage for service-specific edge cases.
