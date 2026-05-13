## Why

Webpage generation is a practical task-completion benchmark for agent CLIs because it exercises multi-file creation, design judgment, local asset discipline, and deterministic validation.

网页生成是 agent CLI 的实用任务完成 benchmark，因为它会同时考验多文件创建、设计判断、本地 asset 纪律与确定性校验。

## What Changes

- Add a webpage-generation task to the CLI evaluation catalog.
- Add a local validation script for generated webpage artifacts.
- Keep the task in full evaluation mode until isolated external baseline execution is implemented.

- 在 CLI evaluation catalog 中新增 webpage-generation task。
- 新增本地 validation script，用于校验生成网页产物。
- 在 isolated external baseline execution 实现前，该任务保持 full evaluation mode。

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `cli-task-completion-evaluation`: The task catalog includes webpage generation as a product-representative task with deterministic artifact checks.

## Impact

- Affected files: `tests/evaluation/task-catalog.json`, new webpage validation script, tests, docs.
- Validation: focused CLI evaluation tests, webpage checker tests, OpenSpec strict validation.

- 影响文件：`tests/evaluation/task-catalog.json`、新的 webpage validation script、tests、docs。
- 校验：focused CLI evaluation tests、webpage checker tests、OpenSpec strict validation。
