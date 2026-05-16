## ADDED Requirements

### Requirement: Task Evaluation Reports Required Tool Families / 任务评估报告所需工具家族
CLI task completion evaluation SHALL record which tool families a task required, which were available, which were used, and which were unsupported or absent.

CLI task completion evaluation 必须记录任务需要哪些 tool families、哪些可用、哪些被使用，以及哪些 unsupported 或 absent。

#### Scenario: Browser task fails unsupported family / Browser 任务因不支持 Family 失败
- **WHEN** a task requires browser interaction and no `browser.*` family is implemented or connected
- **THEN** evaluation records an unsupported-family failure instead of scoring the task as completed from text-only output
- **中文** 当任务需要 browser interaction 且没有实现或连接任何 `browser.*` family 时，evaluation 必须记录 unsupported-family failure，而不是因为生成了文字输出就计为完成。

### Requirement: Task Completion Requires Family Outcome Evidence / 任务完成需要 Family Outcome 证据
For tasks that require a catalog family, completion SHALL require evidence from that family or a declared, scored fallback family.

对于需要某个 catalog family 的任务，完成必须要求来自该 family 的 evidence，或声明并评分的 fallback family。

#### Scenario: Image generation task needs image evidence / 图片生成任务需要图片证据
- **WHEN** a task asks the agent to generate or edit an image
- **THEN** completion evaluation requires `image.generate` or `image.edit` artifact evidence and does not accept only descriptive text
- **中文** 当任务要求 agent 生成或编辑图片时，completion evaluation 必须要求 `image.generate` 或 `image.edit` artifact evidence，不得只接受描述性文本。

### Requirement: Pipeline Tasks Score Routing Evidence / 管线任务评估路由证据
Tasks that chain tools SHALL score pipeline evidence separately from the final task output.

会串联工具的任务必须把 pipeline evidence 与最终任务输出分开评分。

#### Scenario: Search-read-patch-test task records pipeline / Search-Read-Patch-Test 任务记录管线
- **WHEN** a task searches code, reads files, applies a patch, and runs tests
- **THEN** evaluation records `pipeline.sequence` and `pipeline.artifact-routing` evidence in addition to the involved tool families
- **中文** 当任务搜索代码、读取文件、应用 patch 并运行测试时，evaluation 除相关 tool families 外，还必须记录 `pipeline.sequence` 与 `pipeline.artifact-routing` evidence。
