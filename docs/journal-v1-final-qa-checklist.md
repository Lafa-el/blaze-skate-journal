# Blaze Skate Journal V1.0 Final QA Checklist

## A. Automated QA

| Command | Expected Result | Actual Result |
| --- | --- | --- |
| `npm run lint` | ESLint completes with 0 errors and 0 warnings. | Passed on Step 7 baseline. |
| `npm run build` | Vite production build completes. | Passed on Step 7 baseline. Known warnings remain: chunk size and Node `module.register()` deprecation. |
| `npm run smoke:journal` | Local smoke checks pass without Firebase or network access. | Passed on Step 7 baseline: 18 checks passed. |

## B. Manual Smoke Test

### Login

- Open `/login`.
- Confirm login/register/reset password modes render.
- Confirm validation prevents obviously invalid email/password input.
- Confirm loading and error states appear when Auth returns an error.
- Mobile check: form fits on small screens and register mode scrolls.
- i18n check: labels use the selected language where covered by the app dictionary.

### Dashboard

- Open `/dashboard` after sign-in.
- Confirm profile card, this-week stats, recent 7-day summary, quick links, and recent activity render.
- Confirm loading/empty state when no sessions exist.
- Confirm today's Daily prompt appears when no Daily log exists for today.
- Mobile check: cards fit above bottom nav with safe-area padding.
- i18n check: age category, nav labels, and summary labels localize.

### Daily

- Open `/daily`.
- Confirm existing entry loading, empty day, saved, save failed, and invalid date states.
- Edit `YYYY-MM-DD` date as text and verify invalid date is blocked.
- Create or edit Daily fields and save.
- Toggle completion state.
- Mobile check: textarea and save buttons remain reachable above bottom nav.
- i18n check: form labels and status messages localize.

### Sessions

- Open `/sessions`.
- Confirm loading sessions, empty sessions, saved, updated, deleted, save failed, delete failed, invalid date, and editing states.
- Create a session with short track details.
- Edit an existing session.
- Delete a session.
- Verify `YYYY-MM-DD` text date input rejects invalid values.
- Mobile check: horizontal chips scroll and form remains usable.
- i18n check: session type labels and messages localize.

### Calendar

- Open `/calendar`.
- Confirm current month grid renders.
- Confirm dates with Daily logs and sessions are marked.
- Click a day with records and verify day summary.
- Click an empty day and verify empty day state.
- Mobile check: month controls and day cells fit.
- i18n check: month/day labels and session type labels localize.

### WeeklyReview

- Open `/weekly-review`.
- Generate weekly stats.
- Confirm 7-day summary, session stats, coach notes, performance, and manual reflection fields.
- Save a weekly review and confirm saved state.
- Confirm no-data state for weeks without records.
- Mobile check: week navigation and save button fit.
- i18n check: stats labels and manual fields localize.

### CoachNotes

- Open `/coach-notes`.
- Confirm empty state when no notes exist.
- Create a note with `YYYY-MM-DD` date, coach name, priority, tags, follow-up, and linked session ID.
- Edit and delete a note.
- Confirm invalid date is blocked.
- Mobile check: priority buttons and technical tags wrap cleanly.
- i18n check: labels, priorities, save/delete states localize.

### Performance

- Open `/performance`.
- Confirm empty state when no records exist.
- Create a performance record with `YYYY-MM-DD` date, event, time, context, and notes.
- Confirm PB highlight when applicable.
- Edit and delete a record.
- Confirm invalid date is blocked.
- Mobile check: event chips scroll and numeric keyboard appears for time.
- i18n check: event/context labels and state messages localize.

### Body

- Open `/body`.
- Confirm empty state when no body status exists.
- Create a body status record with `YYYY-MM-DD` date, sleep, fatigue, mood, soreness, weight, height, and injury note.
- Edit and delete a reading.
- Confirm invalid date is blocked.
- Mobile check: numeric keyboard appears for decimal fields.
- i18n check: soreness labels and state messages localize.

### Videos

- Open `/videos`.
- Confirm empty state when no video references exist.
- Create a video reference with title, file name, external URL, session ID, technical tags, status, and notes.
- Edit and delete a video reference.
- Mobile check: filters and tags scroll/wrap.
- i18n check: filters, technical tags, and status labels localize.

### SummerCamp

- Open `/summer-camp`.
- Confirm camp stats loading, empty, and failed states.
- Edit camp start/end dates as `YYYY-MM-DD` text inputs.
- Confirm invalid date range is blocked.
- Mobile check: date controls stack on small screens.
- i18n check: camp labels and date display localize.

### Export

- Open `/export`.
- Select JSON and CSV.
- Test all data, date range, summer camp, and single week scopes.
- Confirm invalid dates and reversed ranges are blocked.
- Confirm export success state after download.
- Mobile check: scope cards and export button fit.
- i18n check: labels and error messages localize.

### Settings

- Open `/settings`.
- Toggle language.
- Inspect notification preferences.
- Navigate to export, edit profile, privacy/security, help/support.
- Confirm sign-out dialog.
- Mobile check: popover panels fit above bottom nav.
- i18n check: setting labels and summaries localize.

### EditProfile

- Open `/edit-profile`.
- Edit display name, bio, birthday, skating start date, and avatar.
- Confirm invalid `YYYY-MM-DD` dates are blocked.
- Confirm save returns to Settings.
- Mobile check: sticky header save button remains usable.
- i18n check: labels and validation messages localize.

### PrivacySecurity

- Open `/privacy-security`.
- Test password validation without submitting real sensitive changes unless using a test account.
- Test email validation with invalid email.
- Step through delete account confirmation without completing deletion unless using a disposable account.
- Mobile check: forms and dialogs fit.
- i18n check: warnings and form labels localize.

### HelpSupport

- Open `/help-support`.
- Confirm FAQ entries render.
- Confirm contact form opens email client when used.
- Mobile check: FAQ content is readable.
- i18n check: help text localizes.

## C. Firebase / Firestore Smoke Test Plan

Do not run this against production unless explicitly approved.

- Use a dedicated Firebase test account.
- Sign in and confirm `uid`.
- Create a Daily record.
- Create a Training Session.
- Create a Coach Note.
- Create a Body Status record.
- Create a Performance Record.
- Create a Weekly Review.
- Create a Video Reference if testing video references.
- Export JSON and CSV.
- Verify Firestore documents include `athleteId == uid`.
- Verify another test user cannot read or modify the first user's records.
- Verify Firestore rules were not changed during V1.0 QA.
- Verify Storage rules were not changed during V1.0 QA.
- Verify indexes were not changed unless separately approved.

## D. Mobile QA

- iPhone Safari: verify login, Daily, Sessions, Calendar, Weekly Review, and Export.
- PWA installed mode: verify standalone launch, app icon, and navigation.
- Keyboard / fixed bottom nav: verify focused inputs and save buttons are not hidden.
- Safe area: verify bottom nav respects iPhone safe area.
- Long Chinese labels: verify buttons and chips wrap or scroll.
- `YYYY-MM-DD` inputs: verify Chinese/iOS locale does not change stored date format.
- Scroll behavior: verify long forms remain usable and modals fit.

## E. Known Warnings

- Vite reports a chunk larger than 500 kB after minification.
- Node reports a `module.register()` deprecation warning during build.
- There is no real Firebase E2E automated test suite.
- This is a JavaScript project and does not have TypeScript typecheck.
- `dev-dist` is ignored in `.gitignore` and `git ls-files dev-dist` returned no tracked files in Step 7 checks.
