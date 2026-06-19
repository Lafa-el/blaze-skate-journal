# SkatingX Core Integration

## Purpose

Blaze Skate Journal is the first Blaze app to align its runtime write contract
with SkatingX Core. This sprint standardizes metadata on new and updated
Journal records while keeping the current UI and existing collection layout
stable.

## Current Contract

The canonical athlete profile document is:

```text
athletes/{uid}
```

The profile document must include:

```text
athleteId == uid
sourceApp == "blaze-skate-journal"
schemaVersion == "skatingx-athlete-v1"
```

Journal feature collections remain unchanged for now:

- `journal_days`
- `training_sessions`
- `coach_notes`
- `body_status`
- `performance_records`
- `video_refs`
- `weekly_reviews`
- `milestones`

Every newly saved or updated Journal record must include:

- `athleteId`
- `sourceApp`
- `schemaVersion`
- `createdAt` on create
- `updatedAt` on every write

Current Journal schema version:

```text
skatingx-journal-v1
```

## Compatibility

Existing records without `schemaVersion` are legacy-compatible. The app does
not require `schemaVersion` for reads, lists, dashboard summaries, exports, or
weekly aggregations.

Future writes are schemaVersioned through shared metadata helpers. This means
records will gain `schemaVersion` when they are created or updated through the
current app, but older untouched documents can continue to render.

## Migration Notes

This sprint does not rename collections.

This sprint does not move data into subcollections.

This sprint does not delete legacy documents.

A full historical data migration can be done later with Firebase Admin SDK.
That migration should backfill `schemaVersion`, confirm `athleteId` matches the
Firebase Auth UID, and preserve existing feature fields.

Recommended Admin SDK migration checks:

- Find documents missing `schemaVersion`.
- Find documents missing `athleteId`.
- Find documents whose `athleteId` does not match the target Auth UID.
- Backfill `sourceApp` as `blaze-skate-journal`.
- Backfill `schemaVersion` as `skatingx-journal-v1` for Journal records.
- Backfill `schemaVersion` as `skatingx-athlete-v1` for athlete profiles.

## Verification Checklist

- Sign in and create or update a daily journal entry.
- Create or update a training session.
- Create or update a coach note.
- Create or update a body status reading.
- Create or update a performance record.
- Create or update a video reference.
- Create or update a weekly review.
- Create or update an athlete profile.
- Confirm new writes include `athleteId`, `sourceApp`, `schemaVersion`,
  `createdAt`, and `updatedAt` where applicable.
- Confirm legacy records without `schemaVersion` still render.
- Run `npm run lint`.
- Run `npm run build`.
