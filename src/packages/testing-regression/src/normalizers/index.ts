export function normalizeVolatileText(value: string): string {
  return value.replace(/session-\d+/g, "session-<n>").replace(/trace-[^"\s]+/g, "trace-<id>");
}
