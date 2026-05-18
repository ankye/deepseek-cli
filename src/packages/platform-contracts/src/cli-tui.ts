import type {
  CliActionKind,
  CliInteractionContribution,
  CliInteractionMode,
  CliTargetKind,
  CliTargetRef
} from "./cli-composition.js";
import type { JsonObject, RedactionMetadata } from "./common.js";

export type CliTuiProfile = "auto" | "line" | "full-screen" | "off";

export type CliRawInputEventKind =
  | "key"
  | "paste-start"
  | "paste-end"
  | "resize"
  | "unknown";

export interface CliRawInputEvent extends JsonObject {
  readonly schemaVersion: string;
  readonly kind: CliRawInputEventKind;
  readonly key?: string;
  readonly text?: string;
  readonly ctrl?: boolean;
  readonly alt?: boolean;
  readonly shift?: boolean;
  readonly sequence?: string;
  readonly columns?: number;
  readonly rows?: number;
  readonly redaction: RedactionMetadata;
}

export type CliViSequenceStatus = "pending" | "resolved" | "unbound" | "cancelled";

export interface CliKeySequenceState extends JsonObject {
  readonly schemaVersion: string;
  readonly profile: "vi-professional";
  readonly mode: CliInteractionMode;
  readonly keys: readonly string[];
  readonly count?: number;
  readonly leaderActive: boolean;
  readonly status: CliViSequenceStatus;
  readonly redaction: RedactionMetadata;
}

export interface CliKeySequenceResolution extends JsonObject {
  readonly schemaVersion: string;
  readonly state: CliKeySequenceState;
  readonly status: CliViSequenceStatus;
  readonly action?: CliActionKind;
  readonly targetKind?: CliTargetKind;
  readonly count?: number;
  readonly commandMode?: "search" | "command" | "help";
  readonly previewText?: string;
  readonly diagnostic?: {
    readonly code: "CLI_KEY_SEQUENCE_PENDING" | "CLI_KEY_SEQUENCE_UNBOUND" | "CLI_KEY_SEQUENCE_CANCELLED";
    readonly message: string;
  };
  readonly redaction: RedactionMetadata;
}

export type CliFullscreenLifecyclePhase =
  | "enter"
  | "repaint"
  | "resize"
  | "teardown";

export interface CliFullscreenRendererLifecycle extends JsonObject {
  readonly schemaVersion: string;
  readonly phase: CliFullscreenLifecyclePhase;
  readonly alternateScreen: boolean;
  readonly cursorVisible: boolean;
  readonly repaintBounds: {
    readonly columns: number;
    readonly rows: number;
  };
  readonly reason?: string;
  readonly redaction: RedactionMetadata;
}

export interface CliPanelScrollState extends JsonObject {
  readonly schemaVersion: string;
  readonly panelId: string;
  readonly offset: number;
  readonly visibleRows: number;
  readonly totalRows: number;
  readonly redaction: RedactionMetadata;
}

export interface CliCommandBarContract extends JsonObject {
  readonly schemaVersion: string;
  readonly open: boolean;
  readonly mode: "closed" | "slash" | "palette" | "search" | "command";
  readonly query: string;
  readonly placeholder: string;
  readonly redaction: RedactionMetadata;
}

export interface CliPluginContributionExplanation extends JsonObject {
  readonly schemaVersion: string;
  readonly contributionId: string;
  readonly pluginId?: string;
  readonly namespace: string;
  readonly label: string;
  readonly kind: CliInteractionContribution["kind"];
  readonly active: boolean;
  readonly hidden: boolean;
  readonly degraded: boolean;
  readonly conflictGroup: string;
  readonly permissions: readonly string[];
  readonly sideEffects: readonly string[];
  readonly modeScopes: readonly CliInteractionMode[];
  readonly keymapScopes: readonly string[];
  readonly previewText: string;
  readonly helpText: string;
  readonly governance: JsonObject;
  readonly diagnostics: readonly string[];
  readonly redaction: RedactionMetadata;
}

export interface CliPluginActionDescriptor extends JsonObject {
  readonly schemaVersion: string;
  readonly kind: "cli.plugin-action";
  readonly contributionId: string;
  readonly pluginId?: string;
  readonly target: CliTargetRef;
  readonly action: CliActionKind;
  readonly dryRun: boolean;
  readonly permissions: readonly string[];
  readonly sideEffects: readonly string[];
  readonly governance: JsonObject;
  readonly redaction: RedactionMetadata;
}

