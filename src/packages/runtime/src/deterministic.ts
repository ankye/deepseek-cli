import type { Id, RuntimeKernelLogger } from "@deepseek/platform-contracts";
import { asId } from "@deepseek/platform-contracts";

export class DeterministicClock {
  now(): Date {
    return new Date(0);
  }
}

export class DeterministicIdFactory {
  private next = 1;

  create<Name extends string>(scope: Name): Id<Name> {
    return asId<Name>(`${scope}-${this.next++}`);
  }
}

export class NoopRuntimeKernelLogger implements RuntimeKernelLogger {
  debug(): void {}
  error(): void {}
}
