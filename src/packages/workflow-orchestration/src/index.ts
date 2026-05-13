import type {
  AgentId,
  CapabilityId,
  JsonObject,
  RuntimeEvent,
  SessionId,
  StepId,
  TraceContext,
  WorkflowCheckpoint,
  WorkflowGraph,
  WorkflowInvocation,
  WorkflowInvocationRequest,
  WorkflowOrchestrator,
  WorkflowRunRequest,
  WorkflowStep,
  WorkflowTerminalStatus
} from "@deepseek/platform-contracts";
import { asId } from "@deepseek/platform-contracts";

const DETERMINISTIC_EVENT_CREATED_AT = new Date(0).toISOString();

export interface WorkflowTemplate {
  readonly name: string;
  readonly version: string;
  readonly contributionSource: string;
  readonly metadata: JsonObject;
}

export class InMemoryWorkflowTemplateRegistry {
  private readonly templates = new Map<string, WorkflowTemplate>();

  register(template: WorkflowTemplate): void {
    this.templates.set(`${template.name}@${template.version}`, template);
  }

  list(): readonly WorkflowTemplate[] {
    return [...this.templates.values()];
  }
}

export class SingleTurnWorkflowOrchestrator implements WorkflowOrchestrator {
  async openInvocation(request: WorkflowInvocationRequest): Promise<WorkflowInvocation> {
    const suffix = String(request.envelopeId);
    return {
      workflowId: asId<"workflow">(`workflow-${suffix}`),
      taskId: asId<"task">(`task-${suffix}`),
      stepId: asId<"step">(`step-${suffix}`),
      envelopeId: request.envelopeId,
      capabilityId: request.capabilityId,
      sessionId: request.sessionId,
      ...(request.ownerAgentId ? { ownerAgentId: request.ownerAgentId } : {})
    };
  }

  async closeInvocation(
    invocation: WorkflowInvocation,
    status: WorkflowTerminalStatus,
    metadata: JsonObject = {}
  ): Promise<RuntimeEvent> {
    return {
      kind: "workflow.closed",
      sessionId: invocation.sessionId,
      taskId: invocation.taskId,
      ...(invocation.ownerAgentId ? { agentId: invocation.ownerAgentId } : {}),
      createdAt: DETERMINISTIC_EVENT_CREATED_AT,
      trace: this.trace(invocation.sessionId, invocation.workflowId),
      data: {
        workflowId: invocation.workflowId,
        stepId: invocation.stepId,
        capabilityId: invocation.capabilityId,
        envelopeId: invocation.envelopeId,
        status,
        ...metadata
      }
    };
  }

  async createGraph(request: WorkflowRunRequest): Promise<WorkflowGraph> {
    const step: WorkflowStep = {
      id: asId<"step">("step-model-response"),
      name: "model-response",
      dependsOn: [],
      status: "pending"
    };
    return {
      id: asId<"workflow">(`workflow-${request.sessionId}`),
      taskId: asId<"task">(`task-${request.sessionId}`),
      steps: [step]
    };
  }

  async *runGraph(graph: WorkflowGraph, request: WorkflowRunRequest): AsyncIterable<RuntimeEvent> {
    yield {
      kind: "workflow.step",
      sessionId: request.sessionId,
      taskId: graph.taskId,
      createdAt: DETERMINISTIC_EVENT_CREATED_AT,
      trace: {
        traceId: asId<"trace">(`trace-${graph.id}`),
        spanId: asId<"span">(`span-${graph.id}`),
        correlationId: asId<"correlation">(`corr-${graph.id}`),
        sessionId: request.sessionId
      },
      data: {
        workflowId: graph.id,
        stepId: graph.steps[0]?.id ?? "",
        status: "running"
      }
    };
  }

  async createCheckpoint(graph: WorkflowGraph): Promise<WorkflowCheckpoint> {
    return {
      id: `checkpoint-${graph.id}`,
      sessionId: asId<"session">(String(graph.taskId).replace("task-", "")),
      workflowId: graph.id,
      createdAt: new Date(0).toISOString(),
      metadata: { taskId: graph.taskId }
    };
  }

  async validateGraph(graph: WorkflowGraph): Promise<readonly string[]> {
    return graph.steps.length === 0 ? ["workflow graph must contain at least one step"] : [];
  }

  private trace(sessionId: SessionId, workflowId: string): TraceContext {
    return {
      traceId: asId<"trace">(`trace-${workflowId}`),
      spanId: asId<"span">(`span-${workflowId}`),
      correlationId: asId<"correlation">(`corr-${workflowId}`),
      sessionId
    };
  }
}
