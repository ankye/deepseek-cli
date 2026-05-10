## MODIFIED Requirements

### Requirement: Store Implementation Parity / Store 实现一致性

In-memory and persistent filesystem session stores SHALL implement compatible resume and fork-lite semantics. The persistent filesystem store SHALL hydrate its in-process state from disk on construction so a new instance pointed at the same directory observes sessions, events, metadata, and snapshots written by prior instances.

in-memory 与持久化 filesystem session stores 必须实现兼容的 resume 与 fork-lite 语义。持久化 filesystem store 在构造时必须从磁盘 hydrate 进程内状态，让指向同一目录的新实例能看到之前实例写入的 sessions、events、metadata 和 snapshots。

#### Scenario: Contract tests run against both stores / 合同测试覆盖两种 store

- **WHEN** session-store contract tests run
- **THEN** in-memory and persistent filesystem stores both pass creation, append, resume, fork, unknown id, redaction, and serialization scenarios
- **中文** 当 session-store contract tests 运行时，in-memory 与 persistent filesystem stores 必须同时通过 creation、append、resume、fork、unknown id、redaction 和 serialization scenarios。

#### Scenario: Persistent store survives process restart / 持久化 store 跨进程重启

- **WHEN** a persistent filesystem store at directory D appends an event under session id S, is disposed, and a new store is constructed at the same directory D
- **THEN** the new store returns the original event through `events(S)`, exposes the same metadata, and allows `resume(S)` to succeed without re-appending
- **中文** 当某持久化 filesystem store 在目录 D 对 session id S append 一个事件后被释放，再对同一目录 D 构造新 store 时，新 store 必须通过 `events(S)` 返回原事件、暴露同一 metadata，并允许 `resume(S)` 成功而无需再次 append。

#### Scenario: Malformed lines do not crash hydration / 损坏行不会让 hydration 崩溃

- **WHEN** a session's on-disk JSONL file contains a malformed line next to valid records
- **THEN** hydration skips the malformed line, loads the surrounding valid events into memory, and the construction still completes without throwing
- **中文** 当某 session 的磁盘 JSONL 文件在有效记录旁出现损坏行时，hydration 必须跳过损坏行、把相邻有效事件加载到内存，且构造仍能不抛异常地完成。
