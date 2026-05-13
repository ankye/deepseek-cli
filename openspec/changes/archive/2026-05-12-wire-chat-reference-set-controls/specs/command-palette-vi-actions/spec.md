## ADDED Requirements

### Requirement: Reference Focus Action Resolution / 引用聚焦动作解析

The palette/action layer SHALL resolve typed reference focus actions over existing composition snapshot reference sets without executing palette owners, model calls, runtime primitives, or workspace mutations.

Palette/action layer 必须基于现有 composition snapshot reference sets 解析类型化 reference focus actions，且不得执行 palette owners、model calls、runtime primitives 或 workspace mutations。

#### Scenario: Focus updates active reference item / 聚焦更新当前引用项

- **WHEN** a `focus-reference` action targets an existing reference item
- **THEN** action resolution updates the owning reference set's active item id, updates the active target to the item's target, and returns a typed state update
- **中文** 当 `focus-reference` action 指向已有 reference item 时，action resolution 必须更新所属 reference set 的 active item id、将 active target 更新为该 item 的 target，并返回类型化 state update。

#### Scenario: Focus preserves reference items / 聚焦保留引用项

- **WHEN** a reference focus action succeeds
- **THEN** action resolution preserves all existing reference sets and items except for the focused set's active item id
- **中文** 当 reference focus action 成功时，action resolution 必须保留所有已有 reference sets 与 items，除被聚焦 set 的 active item id 外不得改变。

#### Scenario: Missing reference target is typed / 缺失引用 Target 类型化

- **WHEN** a `focus-reference` action targets a missing reference item
- **THEN** action resolution returns `CLI_ACTION_TARGET_NOT_FOUND` diagnostics and preserves the prior snapshot
- **中文** 当 `focus-reference` action 指向缺失 reference item 时，action resolution 必须返回 `CLI_ACTION_TARGET_NOT_FOUND` diagnostics，并保留之前的 snapshot。
