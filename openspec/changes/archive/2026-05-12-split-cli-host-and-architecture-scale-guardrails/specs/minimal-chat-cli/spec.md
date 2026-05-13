## ADDED Requirements

### Requirement: Chat Uses Terminal Profiles / Chat 使用终端 Profile

The chat CLI SHALL route input and rendering through terminal capability, input strategy, renderer profile, and vi-inspired composition contracts before adding richer terminal behavior.

chat CLI 在增加更丰富终端行为前，必须让 input 和 rendering 经过 terminal capability、input strategy、renderer profile 和 vi-inspired composition contracts。

#### Scenario: Chat render mode follows profile / Chat 渲染模式遵循 Profile

- **WHEN** the chat shell starts
- **THEN** it selects renderer and input behavior from the terminal profile and output mode rather than hard-coded TTY assumptions
- **中文** 当 chat shell 启动时，必须从 terminal profile 和 output mode 选择 renderer 与 input 行为，而不是依赖硬编码 TTY 假设。

#### Scenario: Vi-inspired controls stay local / Vi-inspired 控制保持本地

- **WHEN** chat uses vi-inspired modes, keymaps, reference sets, result lists, or jump navigation
- **THEN** those controls resolve to local command/action requests and never directly execute model, tool, policy, scheduler, sandbox, MCP, plugin, or runtime primitives
- **中文** 当 chat 使用 vi-inspired modes、keymaps、reference sets、result lists 或 jump navigation 时，这些控制必须解析为本地 command/action requests，且不得直接执行 model、tool、policy、scheduler、sandbox、MCP、plugin 或 runtime primitives。

#### Scenario: Unsupported terminal degrades cleanly / 不支持的终端干净降级

- **WHEN** the chat shell runs in CI, redirected IO, unknown terminal width, unsupported raw mode, no-color mode, or a terminal with unreliable interactive support
- **THEN** chat falls back to line/scripted input and plain/structured rendering while preserving prompt, command, cancellation, session, and runtime event semantics
- **中文** 当 chat shell 运行在 CI、redirected IO、unknown terminal width、不支持 raw mode、no-color mode 或 interactive support 不可靠的终端中时，chat 必须降级为 line/scripted input 和 plain/structured rendering，同时保持 prompt、command、cancellation、session 和 runtime event 语义。
