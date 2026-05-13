## ADDED Requirements

### Requirement: Chat Local Reference Mutation Controls / Chat 本地引用变更控制

The chat shell SHALL expose local reference mutation controls under `/palette refs` for removing, clearing, and replacing active references without sending those slash inputs to the model or runtime.

Chat shell 必须在 `/palette refs` 下暴露本地 reference mutation controls，用于 remove、clear、replace active references，且不得把这些 slash inputs 发送给 model 或 runtime。

#### Scenario: Chat removes reference locally / Chat 本地移除引用

- **WHEN** the user enters `/palette refs remove <ref-id|index|target-id|current>` after references exist
- **THEN** the shell removes the selected reference item locally, updates active reference focus deterministically, renders updated reference state, and does not submit a runtime/model request
- **中文** 当用户在已有 references 后输入 `/palette refs remove <ref-id|index|target-id|current>` 时，shell 必须本地移除选中的 reference item、确定性更新 active reference focus、渲染更新后的 reference state，且不提交 runtime/model request。

#### Scenario: Chat clears references locally / Chat 本地清空引用

- **WHEN** the user enters `/palette refs clear`
- **THEN** the shell clears local active reference sets, renders zero references, and the next prompt carries no reference context unless new references are added
- **中文** 当用户输入 `/palette refs clear` 时，shell 必须清空本地 active reference sets、渲染零 references，并且下一条 prompt 在未添加新 references 前不得携带 reference context。

#### Scenario: Chat replaces references with current result / Chat 用当前结果替换引用

- **WHEN** the user focuses a result-list item and enters `/palette refs replace current`
- **THEN** the shell replaces existing local references with exactly the focused result-list item, preserves the item's typed target metadata, renders updated reference state, and does not submit a runtime/model request
- **中文** 当用户聚焦 result-list item 并输入 `/palette refs replace current` 时，shell 必须用当前聚焦 result-list item 精确替换已有本地 references，保留该 item 的 typed target metadata，渲染更新后的 reference state，且不提交 runtime/model request。

#### Scenario: Missing reference mutation target stays local / 缺失引用变更目标保持本地

- **WHEN** the user enters a remove or replace command whose selector cannot be resolved
- **THEN** the shell emits a typed local failure and preserves prior reference state without submitting a runtime/model request
- **中文** 当用户输入 selector 无法解析的 remove 或 replace command 时，shell 必须输出 typed local failure，并保持之前的 reference state，不提交 runtime/model request。
