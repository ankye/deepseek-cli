import type {
  CommandCompositionRecord,
  CommandManifest,
  InteractionCommandVisibility,
  InteractionModeCommandVisibility,
  InteractionModeDegradationReason,
  InteractionModeName,
  JsonObject
} from "@deepseek/platform-contracts";
import {
  INTERACTION_MODE_COMPATIBILITY,
  INTERACTION_MODE_SCHEMA_VERSION
} from "@deepseek/platform-contracts";
import { commandManifestToCompositionRecord } from "./composition.js";

export type ModeControlCommandName = "mode" | "agent" | "workers" | "verify" | "plan";

export interface ModeControlVisibilityProfile extends JsonObject {
  readonly profile:
    | "local"
    | "remote"
    | "bridge"
    | "headless"
    | "approval"
    | "result-list"
    | "degraded";
  readonly mode: InteractionModeName;
  readonly commandVisibilities: readonly InteractionModeCommandVisibility[];
  readonly visibleCommands: readonly string[];
  readonly rejectedCommands: readonly string[];
  readonly disabledCommands: readonly string[];
  readonly hiddenCommands: readonly string[];
  readonly redaction: { readonly class: "internal" };
}

export const modeControlCommandNames = ["mode", "agent", "workers", "verify", "plan"] as const satisfies readonly ModeControlCommandName[];

export function modeControlManifest(command: ModeControlCommandName): CommandManifest {
  return {
    id: `interactive.${command}` as CommandManifest["id"],
    name: modeControlDisplayName(command),
    aliases: [],
    modes: ["user", "host"],
    hostSupport: ["cli", "server"],
    sideEffect: "runtime-control",
    ownerSubsystem: "command-system",
    source: { kind: "built-in", id: "mode-controls", trust: "trusted" },
    permissions: [],
    target: { kind: "command", id: `command:interactive.${command}` },
    projection: {
      userVisible: true,
      hostVisible: true,
      modelVisible: false,
      resultListVisible: true,
      hostOnly: true,
      group: "mode-controls",
      metadata: {
        interactionModes: commandInteractionModes(command),
        visibilityProfiles: modeControlVisibilitySummary(command)
      }
    },
    outputSchema: {
      type: "object",
      additionalProperties: true,
      required: ["kind", "command"],
      properties: {
        kind: { type: "string" },
        command: { type: "string" }
      }
    },
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        transition: { type: "string" },
        selector: { type: "string" }
      }
    },
    redaction: { class: "internal" },
    description: modeControlDescription(command),
    compatibility: {
      schemaVersion: INTERACTION_MODE_SCHEMA_VERSION,
      minReaderVersion: "1.0.0"
    },
    referencePitFixtureIds: ["pit.mode-control-local-only", "pit.remote-mode-unsafe-command-filter"]
  };
}

export function modeControlCompositionRecords(): readonly CommandCompositionRecord[] {
  return modeControlCommandNames.map((command) => commandManifestToCompositionRecord(modeControlManifest(command)));
}

export function modeControlVisibilityProfiles(mode: InteractionModeName = "chat"): readonly ModeControlVisibilityProfile[] {
  const profiles: readonly ModeControlVisibilityProfile["profile"][] = ["local", "remote", "bridge", "headless", "approval", "result-list", "degraded"];
  return profiles.map((profile) => {
    const commandVisibilities = modeControlCommandNames.map((command) => visibilityFor(profile, mode, command));
    return {
      profile,
      mode,
      commandVisibilities,
      visibleCommands: commandVisibilities.filter((entry) => entry.visibility === "visible").map((entry) => entry.commandId),
      rejectedCommands: commandVisibilities.filter((entry) => entry.visibility === "rejected").map((entry) => entry.commandId),
      disabledCommands: commandVisibilities.filter((entry) => entry.visibility === "disabled").map((entry) => entry.commandId),
      hiddenCommands: commandVisibilities.filter((entry) => entry.visibility === "hidden").map((entry) => entry.commandId),
      redaction: { class: "internal" }
    };
  });
}

function visibilityFor(
  profile: ModeControlVisibilityProfile["profile"],
  mode: InteractionModeName,
  command: ModeControlCommandName
): InteractionModeCommandVisibility {
  const reason = rejectedReason(profile, command);
  const visibility: InteractionCommandVisibility = reason
    ? "rejected"
    : profile === "approval" && command !== "mode"
      ? "disabled"
      : "visible";
  return {
    schemaVersion: INTERACTION_MODE_SCHEMA_VERSION,
    commandId: `/${command}`,
    mode,
    visibility,
    ...(reason ? { reason } : {}),
    diagnostics: [],
    redaction: { class: "internal" },
    compatibility: INTERACTION_MODE_COMPATIBILITY
  };
}

function rejectedReason(
  profile: ModeControlVisibilityProfile["profile"],
  command: ModeControlCommandName
): InteractionModeDegradationReason | undefined {
  if ((profile === "remote" || profile === "bridge") && command !== "mode" && command !== "agent") return "remote-unsafe-command";
  if (profile === "degraded" && command === "workers") return "host-capability-missing";
  return undefined;
}

function modeControlDisplayName(command: ModeControlCommandName): string {
  return command === "verify" ? "verify-status" : command;
}

function modeControlVisibilitySummary(command: ModeControlCommandName): readonly JsonObject[] {
  return modeControlVisibilityProfiles().map((profile) => {
    const entry = profile.commandVisibilities.find((candidate) => candidate.commandId === `/${command}`);
    return {
      profile: profile.profile,
      mode: profile.mode,
      visibility: entry?.visibility ?? "hidden",
      ...(entry?.reason ? { reason: entry.reason } : {})
    };
  });
}

function commandInteractionModes(command: ModeControlCommandName): readonly InteractionModeName[] {
  if (command === "workers") return ["chat", "interactive", "headless", "remote", "degraded"];
  if (command === "verify" || command === "plan") return ["chat", "one-shot", "interactive", "headless", "remote", "degraded"];
  return ["chat", "one-shot", "interactive", "command-palette", "result-list", "approval", "headless", "remote", "degraded"];
}

function modeControlDescription(command: ModeControlCommandName): string {
  switch (command) {
    case "mode":
      return "Show local interaction mode, agent mode, budgets, and available transitions.";
    case "agent":
      return "Show local agent role, binding, and worker/verifier summary.";
    case "workers":
      return "Show active and completed worker lifecycle records.";
    case "verify":
      return "Show verifier verdicts and verification loop status.";
    case "plan":
      return "Show the latest phase plan and skipped phase decisions.";
  }
}
