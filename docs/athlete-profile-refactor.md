# Athlete Profile Refactor

## Old Model

The `athletes` collection previously used random Firestore document IDs.
Runtime code found the active profile by querying:

```text
athletes where athleteId == currentUser.uid
```

This allowed duplicate profile documents for the same Firebase Auth user. For
example, one complete profile and one placeholder profile could both store the
same `athleteId`.

## New Model

The canonical athlete profile document is now deterministic:

```text
athletes/{currentUser.uid}
```

The document must also store:

```text
athleteId == currentUser.uid
```

Runtime profile reads and writes should use `athletes/{currentUser.uid}`.
Random athlete profile document IDs are legacy data only.

## Why

The deterministic model aligns athlete profile ownership with Firebase Auth and
Firestore security rules. It removes ambiguity from profile reads, avoids
duplicate active profile records, and gives each authenticated user one stable
profile document.

## Migration Behavior

When the app cannot find `athletes/{currentUser.uid}`, it can query legacy
profile documents where `athleteId == currentUser.uid`, choose the best existing
profile, and copy that data into `athletes/{currentUser.uid}`.

The best legacy profile is chosen by:

1. A non-empty `displayName` that is not equal to the UID.
2. Meaningful profile fields such as `birthday`, `skatingFrom`, `avatarUrl`,
   `bio`, or `level`.
3. The most recent `updatedAt` or `createdAt` timestamp.

Legacy profile documents are not deleted automatically.

Important: once Firestore rules are tightened to require
`request.auth.uid == docId` for `athletes/{docId}`, client-side legacy profile
queries will no longer be allowed. Run or verify the canonical-profile copy
before deploying the strict rules, or perform the copy with Admin SDK access.

## Manual Cleanup Guidance

After confirming `athletes/{uid}` contains the complete Lindsay profile, old
random-ID profile documents may be archived or deleted manually.

Before deleting a legacy document, confirm:

- `athletes/{uid}` exists.
- `athletes/{uid}.athleteId` equals the Firebase Auth UID.
- Important fields such as `displayName`, `bio`, `level`, `avatarUrl`,
  `skatingFrom`, and `birthday` were copied correctly.
- No active runtime code references the legacy random document ID.

## Verification Checklist

- Sign in as the target user.
- Open Dashboard and confirm profile metadata loads.
- Open Edit Profile and confirm existing profile values are shown.
- Save profile changes and confirm the write updates `athletes/{uid}`.
- Confirm no active runtime code uses `window.__athleteDocId`.
- Confirm no active runtime code uses `DEFAULT_ATHLETE_ID`, `lindsay_lin`, or
  `user?.uid || "default"`.
- Run `npm run lint`.
- Run `npm run build`.
