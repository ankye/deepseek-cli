import type { JsonObject } from "./common.js";
import type { AgentId, CapabilityId, SessionId, StepId, TaskId, WorkflowId } from "./ids.js";
import type { RuntimeEvent } from "./runtime.js";

export type WorkflowStepStatus = "pending" | "running" | "completed" | "failed" | "skipped";

export interface WorkflowStep {
  readonly id: StepId;
  readonly name: string;
  readonly dependsOn: readonly StepId[];
  readonly status: WorkflowStepStatus;
}

export interface WorkflowGraph {
  readonly id: WorkflowId;
  readonly taskId: TaskId;
  readonly steps: readonly WorkflowStep[];
}

export interface WorkflowCheckpoint {
  readonly id: string;
  readonly sessionId: SessionId;
  readonly workflowId: WorkflowId;
  readonly createdAt: string;
  readonly metadata: JsonObject;
}

export interface WorkflowRunRequest {
  readonly sessionId: SessionId;
  readonly prompt: string;
}

export interface WorkflowRunResult {
  readonly taskId: TaskId;
  readonly workflowId: WorkflowId;
  readonly events: readonly RuntimeEvent[];
  readonly checkpoints: readonly WorkflowCheckpoint[];
}

export type WorkflowTerminalStatus = "completed" | "failed" | "cancelled" | "timed-out" | "rejected";

export interface WorkflowInvocationRequest {
  readonly sessionId: SessionId;
  readonly capabilityId: CapabilityId;
  readonly envelopeId: string;
  readonly ownerAgentId?: AgentId;
  readonly completionCriteria?: JsonObject;
  readonly metadata?: JsonObject;
}

export interface WorkflowInvocation {
  readonly workflowId: WorkflowId;
  readonly taskId: TaskId;
  readonly stepId: StepId;
  readonly envelopeId: string;
  readonly capabilityId: CapabilityId;
  readonly sessionId: SessionId;
  readonly ownerAgentId?: AgentId;
}

export interface WorkflowOrchestrator {
  openInvocation(request: WorkflowInvocationRequest): Promise<WorkflowInvocation>;
  closeInvocation(invocation: WorkflowInvocation, status: WorkflowTerminalStatus, metadata?: JsonObject): Promise<RuntimeEvent>;
  createGraph(request: WorkflowRunRequest): Promise<WorkflowGraph>;
  runGraph(graph: WorkflowGraph, request: WorkflowRunRequest): AsyncIterable<RuntimeEvent>;
  createCheckpoint(graph: WorkflowGraph, metadata?: JsonObject): Promise<WorkflowCheckpoint>;
  validateGraph(graph: WorkflowGraph): Promise<readonly string[]>;
}
