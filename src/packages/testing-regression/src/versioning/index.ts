export function requireSchemaVersion(subject: { readonly schemaVersion?: string }): readonly string[] {
  return subject.schemaVersion ? [] : ["missing schemaVersion"];
}
