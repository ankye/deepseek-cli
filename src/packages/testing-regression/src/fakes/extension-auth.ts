import type {
  CredentialRef,
  CredentialScope,
  CredentialSecretInput,
  CredentialSecretResult,
  CredentialStorageAdapter,
  CredentialStorageDiagnostic,
  SerializableResult,
  StoredCredentialReference,
} from "@deepseek/platform-contracts";
import { asId } from "@deepseek/platform-contracts";

export class DeterministicCredentialStorageAdapter implements CredentialStorageAdapter {
  private readonly references = new Map<string, StoredCredentialReference>();
  resolveCallCount = 0;

  constructor(private readonly diagnostic: CredentialStorageDiagnostic = credentialStorageDiagnostic("available")) {}

  async status(): Promise<CredentialStorageDiagnostic> {
    return this.diagnostic;
  }

  async store(scope: CredentialScope, _secret: CredentialSecretInput): Promise<SerializableResult<StoredCredentialReference>> {
    if (this.diagnostic.status === "unavailable") {
      return {
        ok: false,
        error: {
          code: "CREDENTIAL_STORAGE_UNAVAILABLE",
          message: "Deterministic credential storage is unavailable.",
          retryable: false,
          redaction: { class: "public" },
        },
      };
    }
    const reference = storedReference(credentialRefForScope(scope), scope, true, "store");
    this.references.set(reference.ref, reference);
    return { ok: true, value: reference };
  }

  async resolve(ref: CredentialRef): Promise<CredentialSecretResult> {
    this.resolveCallCount += 1;
    if (!this.references.has(ref)) {
      return {
        ok: false,
        error: {
          code: "CREDENTIAL_NOT_FOUND",
          message: "Credential reference was not found.",
          retryable: false,
          redaction: { class: "public" },
        },
      };
    }
    return { ok: true, value: { value: "[DETERMINISTIC_TEST_SECRET]", source: "test" } };
  }

  async delete(scope: CredentialScope): Promise<SerializableResult<StoredCredentialReference>> {
    const ref = credentialRefForScope(scope);
    const existing = this.references.get(ref);
    this.references.delete(ref);
    return { ok: true, value: existing ? { ...existing, available: false, audit: audit("delete", scope) } : storedReference(ref, scope, false, "delete") };
  }

  async list(scope?: Partial<CredentialScope>): Promise<readonly StoredCredentialReference[]> {
    return Object.freeze([...this.references.values()].filter((reference) => matchesScope(reference.scope, scope)));
  }
}

export function credentialStorageDiagnostic(status: CredentialStorageDiagnostic["status"]): CredentialStorageDiagnostic {
  return {
    code: `DETERMINISTIC_CREDENTIAL_STORAGE_${status.toUpperCase().replace(/-/g, "_")}`,
    status,
    message: `Deterministic credential storage is ${status}.`,
    suggestedActions: status === "unavailable" ? ["Use metadata-only diagnostics in regression tests."] : [],
    redaction: { class: "public" },
  };
}

function credentialRefForScope(scope: CredentialScope): CredentialRef {
  return asId<"credentialRef">(`credential-${scope.provider}-${scope.profile}${scope.workspace ? `-${scope.workspace}` : ""}`);
}

function storedReference(ref: CredentialRef, scope: CredentialScope, available: boolean, operation: "store" | "delete"): StoredCredentialReference {
  return {
    ref,
    scope,
    source: available ? "fake-storage" : "missing",
    available,
    audit: audit(operation, scope),
    redaction: { class: "secret", fields: ["ref"] },
  };
}

function audit(operation: "store" | "delete", scope: CredentialScope) {
  return {
    operation,
    scope,
    at: "1970-01-01T00:00:00.000Z",
    redaction: { class: "internal" as const },
  };
}

function matchesScope(scope: CredentialScope, filter: Partial<CredentialScope> | undefined): boolean {
  if (!filter) return true;
  return (!filter.provider || filter.provider === scope.provider) && (!filter.profile || filter.profile === scope.profile) && (!filter.workspace || filter.workspace === scope.workspace);
}
