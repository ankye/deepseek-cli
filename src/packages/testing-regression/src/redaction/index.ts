export function containsSecretMarker(value: string): boolean {
  return /api[_-]?key|secret|token/i.test(value);
}
