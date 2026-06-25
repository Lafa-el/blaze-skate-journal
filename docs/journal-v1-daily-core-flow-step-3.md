# Journal V1.0 Daily Core Flow Step 3 QA

## Goal

Harden the Daily Journal core flow so athletes, parents, and coaches can complete a daily training record with clearer fields, stable date input, and explicit save/load states.

## Files Changed

- `src/pages/Daily.jsx`
- `src/utils/journalPayloadBuilders.js`
- `scripts/smoke-journal.mjs`
- `src/i18n/dictionaries/en.js`
- `src/i18n/dictionaries/zh.js`
- `docs/journal-v1-daily-core-flow-step-3.md`

## Daily Current Flow

Current page path:

- `src/pages/Daily.jsx`

Current service path:

- `journalService.getByDate(date, user.uid)`
- `journalService.save(data, user.uid)`

Current Firestore collection:

- `journal_days`

Current behavior:

- The page loads the current date by default.
- A valid date change loads the existing `journal_days` record for that date.
- If a record exists, the form is populated for editing.
- If no record exists, the form resets to safe defaults.
- Save uses `journalService.save`, which upserts by `athleteId` and `date`.
- Complete status uses the same save path and toggles `isCompleted`.

## Daily V1.0 Fields

Existing fields preserved:

- `date`
- `dayType`
- `location`
- `overallFeeling`
- `parentNote`
- `lindsayReflection.bestThing`
- `lindsayReflection.needsWork`
- `lindsayReflection.tomorrowFocus`
- `isCompleted`

Additive V1.0 fields:

- `energy`
- `soreness`
- `trainingFocus`
- `coachFeedback`

Compatibility mapping:

- `feeling / mood` remains `overallFeeling`.
- `completed` remains `isCompleted`.
- `whatWentWell` remains `lindsayReflection.bestThing`.
- `whatNeedsWork` remains `lindsayReflection.needsWork`.
- `athleteReflection` remains `lindsayReflection`.
- `trainingFocus / mainFocus` uses `trainingFocus`.

## Date Input Strategy

Daily now uses a stable text input:

- `type="text"`
- `inputMode="numeric"`
- `placeholder="YYYY-MM-DD"`
- `maxLength={10}`
- `dateUtils.isValidDateString` validation

Reason:

- Keeps Firestore `date` values as `YYYY-MM-DD`.
- Avoids browser-native date localization issues on mobile and Chinese/iOS locale.
- Prevents invalid dates from triggering save/complete writes.

## Save State Strategy

Daily now shows:

- Loading existing entry
- Empty day / no entry found
- Saved
- Save failed
- Invalid date
- Existing load error

The implementation uses existing inline alert styles and does not add a toast system.

## i18n Coverage

New Daily strings were added to:

- `src/i18n/dictionaries/en.js`
- `src/i18n/dictionaries/zh.js`

Updated labels include:

- Date help and invalid date copy
- Entry loading and empty state
- Saved state
- Energy
- Soreness
- Training focus
- Coach feedback
- Athlete reflection wording

## Smoke Coverage

`npm run smoke:journal` now covers:

- Valid Daily payload with V1.0 fields
- Invalid Daily date fallback behavior
- Daily update payload without `createdAt`
- Daily default fields compatible with old journal data
- New additive field defaults
- Existing builder and weekly aggregation smoke checks

## Scope Not Changed

- Firestore collection names
- Firestore paths
- `firestore.rules`
- `storage.rules`
- `firestore.indexes.json`
- Firebase project configuration
- `package-lock`
- Existing Daily save/edit capability
- Existing Daily Firestore field names

## Remaining Risks

- This step does not add browser automation for manual Daily save flows.
- Daily still depends on real Firebase for end-to-end save verification.
- New fields are additive and safe for old reads, but existing historical documents will not contain them until saved again.
- Build still reports the existing large chunk warning.
- Build still reports the current Node `module.register()` deprecation warning.

## Next Step

Add low-risk browser smoke or service-level mocked tests for Daily save/load once a lightweight test strategy is approved.
