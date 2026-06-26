# Blaze Skate Journal

Blaze Skate Journal is a React/Vite/Firebase app for short track skating training logs. It supports Daily Journal, Training Sessions, Calendar history, Weekly Review, Coach Notes, Performance records, Body status, Video references, Summer Camp tracking, Export, profile settings, and bilingual English/Chinese UI.

## Tech Stack

- React
- Vite
- Firebase Auth
- Firestore
- Firebase Storage configuration
- Vite PWA
- ESLint

## Scripts

```bash
npm run dev
npm run lint
npm run build
npm run smoke:journal
npm run preview
```

## QA Commands

Run these before release or handoff:

```bash
npm run lint
npm run build
npm run smoke:journal
```

Expected result:

- `npm run lint` passes with 0 errors.
- `npm run build` completes successfully.
- `npm run smoke:journal` passes local pure-logic checks without Firebase or network access.

Known build warnings:

- Vite may warn that the main JavaScript chunk is larger than 500 kB.
- Node may print a `module.register()` deprecation warning from the current toolchain.

## Firebase Notes

V1.0 keeps the existing Firestore collection paths and ownership model:

```text
athleteId == Firebase Auth user.uid
```

Do not change Firebase project configuration, Firestore rules, Storage rules, or Firestore indexes without a separate review.

## Documentation

Key V1.0 docs live in `docs/`:

- `journal-v1-data-model.md`
- `journal-v1-final-qa-checklist.md`
- `journal-v1-user-guide.md`
- `journal-v1-release-notes.md`
- `journal-v1-final-development-summary.md`
