/**
 * The only place a role string is compared. Pure and import-free, so the
 * browser bundle can use it too.
 *
 * Two roles exist today: 'Pro' and 'Manager'. A third would be neither, and
 * each helper answers a different question about it:
 *   - isManagerRole: may they use manager-only actions? Gates fail closed, so
 *     write `!isManagerRole(role)` for "restricted", never `role === 'Pro'`.
 *   - isProRole:     do they carry a lead book (get leads loaded, be assigned,
 *     be viewed as, be listed on the Team page)? A new role gets none of that
 *     until this says so.
 * "Everyone who is not a manager" groupings (comp totals, the Self-Gen picker)
 * use `!isManagerRole`, so a new role shows up there.
 */
export function isManagerRole(role: unknown): boolean {
  return role === 'Manager';
}

export function isProRole(role: unknown): boolean {
  return role === 'Pro';
}
