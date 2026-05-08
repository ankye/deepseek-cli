import type { JsonObject } from "./common.js";
import type { SessionId, StepId, TaskId, WorkflowId } from "./ids.js";
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

export interface WorkflowOrchestrator {
  createGraph(request: WorkflowRunRequest): Promise<WorkflowGraph>;
  runGraph(graph: WorkflowGraph, request: WorkflowRunRequest): AsyncIterable<RuntimeEvent>;
  createCheckpoint(graph: WorkflowGraph, metadata?: JsonObject): Promise<WorkflowCheckpoint>;
  validateGraph(graph: WorkflowGraph): Promise<readonly string[]>;
}
