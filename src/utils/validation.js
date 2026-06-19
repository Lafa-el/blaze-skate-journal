export function requireUid(uid, functionName) {
  if (!uid) {
    throw new Error(`${functionName} requires a Firebase Auth UID.`)
  }
}
