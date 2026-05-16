## 1. Contracts / 契约

- [x] 1.1 Add `LosslessContextManager` DTOs and service interface to `@deepseek/platform-contracts`.
- [x] 1.2 Add runtime event kinds for lossless context node, summary, and degraded evidence.
- [x] 1.3 Add bounded source-class metadata to lossless context nodes so external/high-risk context can be governed later.

## 2. Storage / 存储

- [x] 2.1 Implement in-memory lossless context manager for deterministic tests.
- [x] 2.2 Implement JSONL-backed persistent manager for CLI/live hosts.
- [x] 2.3 Redact secret-like text before durable storage.

## 3. Runtime / 运行时

- [x] 3.1 Record user, assistant, and tool-result nodes from the agent loop when a manager is configured.
- [x] 3.2 Emit redacted runtime evidence for recorded nodes and summaries.
- [x] 3.3 Expose grep, describe, and expand tools only when lossless context is configured.
- [x] 3.4 Add prompt assembly retrieval protocol when those tools are visible.
- [x] 3.5 Add retrieval evidence showing when a later prompt/tool answer used current history, lossless context, or explicitly reported missing context.
- [x] 3.6 Enforce priority guidance so lossless context informs answers but cannot override current instructions, host policy, or repository guidance.

## 4. Verification / 验证

- [x] 4.1 Add contract coverage for summary expansion and persistent reload.
- [x] 4.2 Add runtime coverage for automatic lossless node recording.
- [x] 4.3 Add restart-to-retrieval integration coverage proving write, reload, grep, describe, expand, and later prompt/tool use.
- [x] 4.4 Run OpenSpec validation, typecheck, lint, and relevant tests.
