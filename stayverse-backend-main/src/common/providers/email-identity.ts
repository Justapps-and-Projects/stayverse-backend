/** Match legacy mixed-case/space-padded emails without changing account ownership. */
export function emailIdentity(email: string): RegExp {
  const escaped = email.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`^\\s*${escaped}\\s*$`, 'i');
}
