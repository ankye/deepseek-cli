import type {
  HostKind,
  JsonObject,
  ProtocolCodec,
  ProtocolEnvelope,
  ProtocolPipelineStage,
  ProtocolResponse,
  ProtocolRouter,
  ProtocolTraceFactory,
  RuntimeRequest
} from "@deepseek/platform-contracts";
import { asId } from "@deepseek/platform-contracts";

const protocolVersion = "1";
const schemaVersion = "1.0.0";

export class JsonProtocolCodec implements ProtocolCodec {
  encode(envelope: ProtocolEnvelope): string {
    return JSON.stringify(envelope);
  }

  decode(raw: string): ProtocolEnvelope {
    return this.validate(JSON.parse(raw));
  }

  validate(value: unknown): ProtocolEnvelope {
    if (typeof value !== "object" || value === null) {
      throw new Error("Protocol envelope must be an object");
    }
    const envelope = value as ProtocolEnvelope;
    if (!envelope.protocolVersion || !envelope.schemaVersion || !envelope.type || !envelope.routing) {
      throw new Error("Invalid protocol envelope");
    }
    return envelope;
  }
}

export class DeterministicTraceFactory implements ProtocolTraceFactory {
  private next = 1;

  createTrace(correlationId = asId<"correlation">(`corr-${this.next++}`), sessionId?: ProtocolEnvelope["routing"]["sessionId"]) {
    return {
      traceId: asId<"trace">(`trace-${this.next}`),
      spanId: asId<"span">(`span-${this.next}`),
      correlationId,
      ...(sessionId ? { sessionId } : {})
    };
  }
}

export class PipelineProtocolRouter implements ProtocolRouter {
  constructor(
    private readonly stages: readonly ProtocolPipelineStage[],
    private readonly handler: (envelope: ProtocolEnvelope) => Promise<ProtocolResponse | AsyncIterable<ProtocolEnvelope>>
  ) {}

  async route(envelope: ProtocolEnvelope): Promise<ProtocolResponse | AsyncIterable<ProtocolEnvelope>> {
    let current = envelope;
    for (const stage of this.stages) {
      current = await stage.handle(current);
    }
    return this.handler(current);
  }
}

export class ValidateEnvelopeStage implements ProtocolPipelineStage {
  readonly name = "validate-envelope";

  async handle(envelope: ProtocolEnvelope): Promise<ProtocolEnvelope> {
    if (!envelope.messageId || !envelope.correlationId || !envelope.trace) {
      throw new Error("Protocol envelope is missing routing metadata");
    }
    return envelope;
  }
}

export class InProcessProtocolTransport {
  private readonly queue: ProtocolEnvelope[] = [];
  private resolvers: Array<(value: IteratorResult<ProtocolEnvelope>) => void> = [];

  async send(envelope: ProtocolEnvelope): Promise<void> {
    const resolver = this.resolvers.shift();
    if (resolver) {
      resolver({ value: envelope, done: false });
    } else {
      this.queue.push(envelope);
    }
  }

  async *receive(): AsyncIterable<ProtocolEnvelope> {
    while (true) {
      const next = this.queue.shift();
      if (next) {
        yield next;
        continue;
      }
      const result = await new Promise<IteratorResult<ProtocolEnvelope>>((resolve) => {
        this.resolvers.push(resolve);
      });
      if (result.done) return;
      yield result.value;
    }
  }
}

export function createProtocolEnvelope(input: {
  kind: ProtocolEnvelope["type"];
  host: HostKind;
  target?: ProtocolEnvelope["routing"]["target"];
  payload: JsonObject;
  traceFactory?: ProtocolTraceFactory;
  sessionId?: ProtocolEnvelope["routing"]["sessionId"];
}): ProtocolEnvelope {
  const traceFactory = input.traceFactory ?? new DeterministicTraceFactory();
  const correlationId = asId<"correlation">(`corr-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  const trace = traceFactory.createTrace(correlationId, input.sessionId);
  return {
    protocolVersion,
    schemaVersion,
    id: `msg-${correlationId}`,
    messageId: asId<"message">(`msg-${correlationId}`),
    correlationId,
    type: input.kind,
    createdAt: new Date(0).toISOString(),
    trace,
    redaction: { class: "internal" },
    compatibility: { schemaVersion },
    routing: {
      host: input.host,
      target: input.target ?? "runtime",
      ...(input.sessionId ? { sessionId: input.sessionId } : {})
    },
    payload: input.payload
  };
}

export function createRunTurnEnvelope(prompt: string, host: HostKind = "cli"): ProtocolEnvelope {
  const request: RuntimeRequest = { prompt };
  return createProtocolEnvelope({
    kind: "request",
    host,
    payload: { request }
  });
}
