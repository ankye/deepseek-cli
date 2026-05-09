# Minimal Self-Regression Scenario

Input: `deepseek run "summarize the framework"`

Stable semantic outcome:

- Emits `turn.started`
- Emits at least one `workflow.step`
- Emits at least one `model.delta`
- Emits `usage.updated`
- Ends with `turn.completed`
