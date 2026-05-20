import type { AgentLoopTerminalStatus, ContextStatuslineTelemetry, SessionId, TurnId, VisibleReasoningProjection } from "@deepseek/platform-contracts";
import type { createCliAgentRuntime } from "../host/runtime.js";
import type { ChatModeControlState } from "./chat-mode-controls.js";
import type { ChatPageIndexPage } from "./pageindex.js";
import type { WorkspacePageIndexDiagnostic } from "./pageindex-workspace.js";
import type { ChatPaletteState } from "./palette-state.js";
import type { previewRevert } from "./revert.js";
import type { ChatUsageAccumulator } from "./chat-usage.js";

export interface ChatSessionState {
  sessionId: SessionId | undefined;
  turns: number;
  usage: ChatUsageAccumulator;
  palette: ChatPaletteState | undefined;
  history: readonly ChatHistoryEntry[];
  pageIndex: readonly ChatPageIndexPage[];
  selectedHistoryTurnId: TurnId | undefined;
  revertReviews: readonly ChatRevertReviewEntry[];
  currentRevertReviewId: string | undefined;
  workspaceDeps: Awaited<ReturnType<typeof createCliAgentRuntime>>["deps"] | undefined;
  workspaceRoot: string;
  workspacePageIndexFailure: WorkspacePageIndexDiagnostic | undefined;
  activeController: AbortController | undefined;
  pendingExit: boolean;
  pendingExitTimer: NodeJS.Timeout | undefined;
  modeControls: ChatModeControlState;
  visibleReasoning: VisibleReasoningProjection | undefined;
  statusTelemetry?: ContextStatuslineTelemetry | undefined;
}

export interface ChatHistoryEntry {
  readonly index: number;
  readonly sessionId: SessionId;
  readonly turnId: TurnId;
  readonly status: AgentLoopTerminalStatus;
  readonly traceId: string;
  readonly promptPreview: string;
  readonly selected: boolean;
}

export interface ChatRevertReviewEntry {
  readonly reviewId: string;
  readonly index: number;
  readonly target: {
    readonly sessionId: SessionId;
    readonly turnId: TurnId;
  };
  readonly selectedTurnId: TurnId;
  readonly preview: Awaited<ReturnType<typeof previewRevert>>;
  readonly createdFrom: "current";
  readonly confirmed: boolean;
}
