# Blaze Skate Journal V1.0 Data Model

This document records the current production data model used by Blaze Skate Journal. It is based on the current source code, services, and pages. V1.0 keeps existing Firestore paths and document shapes stable.

## Current Firestore Collections

Defined in `src/constants/skatingx.js`:

- `athletes`
- `journal_days`
- `training_sessions`
- `coach_notes`
- `body_status`
- `performance_records`
- `video_refs`
- `weekly_reviews`
- `milestones`

## Shared Metadata Fields

Journal records use these metadata fields:

- `athleteId` - current owner identifier. In V1.0 this equals `user.uid`.
- `sourceApp` - currently `blaze-skate-journal`.
- `schemaVersion` - currently `skatingx-journal-v1` for journal records and `skatingx-athlete-v1` for athlete profiles.
- `createdAt` - ISO timestamp written on create.
- `updatedAt` - ISO timestamp written on create and update.

V1.0 update payloads should update `updatedAt` but should not overwrite `createdAt`.

## Ownership Model

Current ownership is:

```text
athleteId == Firebase Auth user.uid
```

Current limitations:

- There is no separate `ownerUid`.
- There is no separated athlete entity ID distinct from the authenticated user ID.
- Parent/coach/team multi-athlete ownership is not represented in the current write model.
- Firestore rules and queries are expected to continue matching the current `athleteId == user.uid` model for V1.0.

## Collection Shapes

### `athletes`

Current document ID:

```text
athletes/{uid}
```

Required fields:

- `athleteId`
- `sourceApp`
- `schemaVersion`
- `createdAt`
- `updatedAt`

Current profile fields:

- `displayName`
- `bio`
- `level`
- `avatarUrl`
- `skatingFrom`
- `birthday`

Notes:

- `EditProfile.jsx` requires `displayName` before save.
- Avatar is stored as `avatarUrl` in Firestore; Firebase Auth only receives display name.
- `athleteService.getLegacyAthleteProfilesByAthleteId` can read legacy profile documents whose document ID is not `uid` but whose `athleteId` equals `uid`.

### `journal_days`

Required fields:

- `date`
- `athleteId`
- `sourceApp`
- `schemaVersion`
- `createdAt`
- `updatedAt`

Current fields:

- `date`
- `location`
- `dayType`
- `overallFeeling`
- `parentNote`
- `lindsayReflection.bestThing`
- `lindsayReflection.needsWork`
- `lindsayReflection.tomorrowFocus`
- `isCompleted`

Optional/defaulted fields:

- `location`
- `dayType` defaults to `training` in UI.
- `overallFeeling` defaults to `3` in UI.
- `parentNote`
- `lindsayReflection`
- `isCompleted` defaults to `false` in UI.

### `training_sessions`

Required fields:

- `athleteId`
- `sourceApp`
- `schemaVersion`
- `createdAt`
- `updatedAt`

Current fields:

- `date`
- `sessionType`
- `sessionLabel`
- `durationMinutes`
- `intensity`
- `focusTags`
- `coachName`
- `notes`

Optional/defaulted fields:

- `date` defaults to the selected day in `Sessions.jsx`.
- `sessionType` defaults to `ice`.
- `durationMinutes` defaults to `0` before write if empty.
- `intensity` defaults to `3`.
- `focusTags` defaults to `[]`.
- `sessionLabel`
- `coachName`
- `notes`

### `coach_notes`

Required fields:

- `athleteId`
- `sourceApp`
- `schemaVersion`
- `createdAt`
- `updatedAt`

Current fields:

- `date`
- `coachName`
- `note`
- `priority`
- `technicalTags`
- `followUpTomorrow`
- `linkedSessionId`

Optional/defaulted fields:

- `date`
- `coachName`
- `note`
- `priority` defaults to `medium`.
- `technicalTags` defaults to `[]`.
- `followUpTomorrow`
- `linkedSessionId`

### `body_status`

Required fields:

- `athleteId`
- `sourceApp`
- `schemaVersion`
- `createdAt`
- `updatedAt`

Current fields:

- `date`
- `sleepHours`
- `fatigueLevel`
- `sorenessAreas`
- `bodyWeightLb`
- `heightCm`
- `injuryNote`
- `mood`

Optional/defaulted fields:

- `date`
- `sleepHours` defaults to `0` before write if empty.
- `fatigueLevel` defaults to `3`.
- `sorenessAreas` defaults to `[]`.
- `bodyWeightLb` defaults to `0` before write if empty.
- `heightCm` defaults to `0` before write if empty.
- `injuryNote`
- `mood` defaults to `3`.

### `performance_records`

Required fields:

- `athleteId`
- `sourceApp`
- `schemaVersion`
- `createdAt`
- `updatedAt`

Current fields:

- `date`
- `event`
- `timeSeconds`
- `metric`
- `value`
- `isPB`
- `context`
- `notes`

Notes:

- `event` and `timeSeconds` are the current UI-facing fields.
- `metric` and `value` are written for backward compatibility.
- PB calculation is currently done in `Performance.jsx` before service write.

### `video_refs`

Required fields:

- `athleteId`
- `sourceApp`
- `schemaVersion`
- `createdAt`
- `updatedAt`

Current fields:

- `title`
- `fileName`
- `externalUrl`
- `sessionId`
- `technicalTags`
- `analysisStatus`
- `notes`

Optional/defaulted fields:

- `title`
- `fileName`
- `externalUrl`
- `sessionId`
- `technicalTags` defaults to `[]`.
- `analysisStatus` defaults to `pending`.
- `notes`

### `weekly_reviews`

Required fields:

- `weekStart`
- `athleteId`
- `sourceApp`
- `schemaVersion`
- `createdAt`
- `updatedAt`

Current manual fields:

- `bestMoment`
- `nextWeekFocus`
- `parentSummary`

Current auto-generated fields:

- `iceSessions`
- `drylandSessions`
- `privateLessons`
- `totalTrainingMinutes`
- `weekSessions`
- `topTechnicalIssues`
- `topCoachNotes`
- `bestPerformances`

Notes:

- `weekStart` is Monday-based `YYYY-MM-DD`.
- `weeklyReviewService.autoGenerateStats` currently includes `weekSessions` in the object that may be saved with the review.

### `milestones`

Required fields:

- `athleteId`
- `sourceApp`
- `schemaVersion`
- `createdAt`
- `updatedAt`

Current service fields:

- `date`
- additional caller-provided milestone fields

Current UI-read fields in `SummerCamp.jsx`:

- `date`
- `category`
- `title`
- `name`
- `description`

Notes:

- There is currently a service for create/update/delete, but no dedicated milestone editing page in the inspected UI.
- The shape is more open than other collections because `milestoneService.create` spreads caller-provided data.

## Why V1.0 Does Not Migrate Firestore Paths

V1.0 keeps current top-level collections because:

- Existing pages and services query those collections directly.
- Firestore rules and indexes are already aligned with the current paths.
- Changing paths would require a migration plan, dual-read/dual-write compatibility, and production data validation.
- Current V1.0 priority is stabilizing write boundaries and verification without increasing release risk.
- The current `athleteId == user.uid` ownership model is simple and already used across services.

## V1.1 / SkatingX Platform Migration Recommendations

For V1.1 or SkatingX Platform integration:

- Introduce a separated ownership model with `ownerUid` and a stable `athleteId`.
- Move toward athlete-scoped paths such as `users/{uid}/athletes/{athleteId}/...` only through a planned migration.
- Add dual-read compatibility before switching write paths.
- Keep `sourceApp`, `schemaVersion`, `createdAt`, and `updatedAt` for cross-app compatibility.
- Avoid embedding large generated artifacts, media payloads, or transcripts in core documents.
- Add explicit schemas for open collections such as `milestones`.
- Add service-level tests before changing Firestore paths or rules.
