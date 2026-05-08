import type {
  JsonObject,
  RuntimeEvent,
  WorkflowCheckpoint,
  WorkflowGraph,
  WorkflowOrchestrator,
  WorkflowRunRequest,
  WorkflowStep
} from "@deepseek/platform-contracts";
import { asId } from "@deepseek/platform-contracts";

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
}
