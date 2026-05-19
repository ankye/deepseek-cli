import type {
  JsonObject,
  PluginAuditRecord,
  PluginContributionReference,
  PluginHealthRecord,
  PluginLifecycleEvent,
  PluginLifecycleState,
  PluginLifecycleTransition,
  PluginLifecycleTrigger,
  PluginManifest,
  PluginRollbackRecord,
  RedactedError
} from "@deepseek/platform-contracts";
import { PLUGIN_PLATFORM_SCHEMA_VERSION, asId } from "@deepseek/platform-contracts";
import type { CreatePluginLifecycleTransitionInput, PluginLifecyclePathOptions } from "./shared.js";
import { PUBLIC_REDACTION, replayFingerprint } from "./shared.js";

export function createPluginLifecycleTransition(input: CreatePluginLifecycleTransitionInput): PluginLifecycleTransition {
  const policyDecision = input.policyDecision ?? { action: "allow", reason: "contract-only transition" };
  const transitionBase = {
    pluginId: input.manifest.id,
    pluginVersion: input.manifest.version,
    source: input.manifest.source,
    nextState: input.nextState,
    trigger: input.trigger,
    actor: input.actor,
    reason: input.reason,
    policyDecision,
    hookDecisions: input.hookDecisions ?? [],
    diagnostics: input.diagnostics ?? [],
    audit: input.audit ?? {},
    ...(input.previousState ? { previousState: input.previousState } : {}),
    ...(input.dependencyDecision ? { dependencyDecision: input.dependencyDecision } : {}),
    ...(input.compatibilityDecision ? { compatibilityDecision: input.compatibilityDecision } : {})
  };
  return {
    schemaVersion: PLUGIN_PLATFORM_SCHEMA_VERSION,
    ...transitionBase,
    redaction: PUBLIC_REDACTION,
    replayFingerprint: replayFingerprint({ kind: "plugin-lifecycle-transition", ...transitionBase })
  };
}

export function createPluginLifecycleStatePath(
  manifest: PluginManifest,
  options: PluginLifecyclePathOptions = {}
): readonly PluginLifecycleTransition[] {
  const actor = options.actor ?? "plugin-system";
  const basePath: Array<[PluginLifecycleState | undefined, PluginLifecycleState, PluginLifecycleTrigger]> = [
    [undefined, "discovered", "discover"],
    ["discovered", "validated", "validate"],
    ["validated", "resolved", "resolve-dependencies"],
    ["resolved", "installed", "install"],
    ["installed", "enabled", "enable"],
    ["enabled", "activated", "activate"],
    ["activated", "degraded", "degrade"],
    ["degraded", "disabled", "disable"],
    ["disabled", "uninstalled", "uninstall"]
  ];
  const optionalPath: ReadonlyArray<readonly [PluginLifecycleState | undefined, PluginLifecycleState, PluginLifecycleTrigger]> = [
    ...(options.includeHealthCheck ? ([["activated", "health-checked", "health-check"]] as const) : []),
    ...(options.includeUpdateAndRollback
      ? ([
          ["activated", "update-staged", "stage-update"],
          ["update-staged", "updated", "apply-update"],
          ["updated", "rollback-ready", "prepare-rollback"],
          ["rollback-ready", "rolled-back", "rollback"]
        ] as const)
      : [])
  ];
  return [...basePath, ...optionalPath].map(([previousState, nextState, trigger]) =>
    createPluginLifecycleTransition({
      manifest,
      nextState,
      trigger,
      actor,
      reason: `${trigger} path`,
      ...(previousState ? { previousState } : {})
    })
  );
}

export function createPluginLifecycleEvent(input: {
  readonly kind: PluginLifecycleEvent["kind"];
  readonly transition: PluginLifecycleTransition;
  readonly contribution?: PluginContributionReference;
  readonly diagnostics?: readonly RedactedError[];
}): PluginLifecycleEvent {
  const eventBase = {
    pluginId: input.transition.pluginId,
    pluginVersion: input.transition.pluginVersion,
    source: input.transition.source,
    lifecycle: input.transition,
    diagnostics: input.diagnostics ?? input.transition.diagnostics,
    ...(input.transition.trust ? { trust: input.transition.trust } : {}),
    ...(input.contribution ? { contribution: input.contribution } : {})
  };
  const fingerprint = replayFingerprint({ kind: "plugin-lifecycle-event", ...eventBase });
  return {
    schemaVersion: PLUGIN_PLATFORM_SCHEMA_VERSION,
    eventId: fingerprint,
    at: "deterministic",
    kind: input.kind,
    ...eventBase,
    redaction: PUBLIC_REDACTION,
    replayFingerprint: fingerprint
  };
}

export function createPluginAuditRecord(input: {
  readonly transition: PluginLifecycleTransition;
  readonly action: string;
  readonly actor?: string;
  readonly metadata?: JsonObject;
}): PluginAuditRecord {
  const base = {
    pluginId: input.transition.pluginId,
    action: input.action,
    actor: input.actor ?? input.transition.actor,
    lifecycleState: input.transition.nextState,
    eventKind: "plugin.audit" as const,
    metadata: input.metadata ?? input.transition.audit
  };
  const fingerprint = replayFingerprint({ kind: "plugin-audit", ...base });
  return {
    schemaVersion: PLUGIN_PLATFORM_SCHEMA_VERSION,
    auditId: asId<"audit">(fingerprint),
    at: "deterministic",
    ...base,
    redaction: PUBLIC_REDACTION,
    replayFingerprint: fingerprint
  };
}

export function createPluginHealthRecord(
  manifest: PluginManifest,
  status: PluginHealthRecord["status"] = "healthy",
  diagnostics: readonly RedactedError[] = []
): PluginHealthRecord {
  const base = {
    pluginId: manifest.id,
    status,
    probes: [
      {
        id: "manifest-integrity",
        kind: "manifest" as const,
        timeoutMs: 1_000,
        sideEffect: "none" as const,
        permissions: []
      }
    ],
    diagnostics
  };
  return {
    ...base,
    checkedAt: "deterministic",
    redaction: PUBLIC_REDACTION,
    replayFingerprint: replayFingerprint({ kind: "plugin-health", ...base })
  };
}

export function createPluginRollbackRecord(input: {
  readonly manifest: PluginManifest;
  readonly fromVersion: string;
  readonly toVersion: string;
  readonly reason: string;
  readonly diagnostics?: readonly RedactedError[];
}): PluginRollbackRecord {
  const base = {
    pluginId: input.manifest.id,
    fromVersion: input.fromVersion,
    toVersion: input.toVersion,
    reason: input.reason,
    diagnostics: input.diagnostics ?? []
  };
  return {
    ...base,
    replayFingerprint: replayFingerprint({ kind: "plugin-rollback", ...base })
  };
}
