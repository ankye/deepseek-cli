## ADDED Requirements

### Requirement: Chat Reference Projection Regression Coverage / Chat 引用投影回归覆盖

Regression tests SHALL cover governed projection of chat file references into model requests while preserving prompt boundaries and excluding unsafe references.

回归测试必须覆盖 chat file references 受治理地投影进 model requests，同时保持 prompt 边界并排除不安全 references。

#### Scenario: File reference content reaches model through projection / 文件引用内容通过投影到达模型

- **WHEN** a deterministic runtime test submits a prompt with an active file reference
- **THEN** tests assert projection events select the reference, the model request contains a runtime-owned context message, and the user prompt message remains unchanged
- **中文** 当 deterministic runtime test 提交带 active file reference 的 prompt 时，测试必须断言 projection events 选中该 reference、model request 包含 runtime-owned context message，且 user prompt message 保持不变。

#### Scenario: Slash add-file remains local / add-file Slash 保持本地

- **WHEN** CLI host tests run only `/palette refs add-file <path>` and `/palette refs list`
- **THEN** tests assert local structured records and no `model.requested` event is emitted
- **中文** 当 CLI host tests 只运行 `/palette refs add-file <path>` 与 `/palette refs list` 时，测试必须断言输出 local structured records，且不会发出 `model.requested` event。

#### Scenario: Unsafe referenced content is excluded / 不安全引用内容被排除

- **WHEN** a referenced file contains secret-like content
- **THEN** tests assert projection exclusion/redaction evidence is emitted and the raw secret-like content is absent from model requests and JSONL output
- **中文** 当被引用文件包含疑似 secret content 时，测试必须断言输出 projection exclusion/redaction evidence，且 raw secret-like content 不存在于 model requests 与 JSONL output。
