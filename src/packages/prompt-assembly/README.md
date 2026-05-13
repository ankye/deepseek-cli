# @deepseek/prompt-assembly

Provider-neutral prompt assembly package for the runtime agent loop.

## Responsibilities

- Build `ModelChatMessage[]`, prompt text, tool visibility plans, budget reports, and redacted traces from `@deepseek/platform-contracts` DTOs.
- Keep prompt composition deterministic and replayable through fingerprints and structural replay evidence.
- Let new section providers add context without changing `agent-loop.ts`.
- Stay host-neutral: no CLI UI, VSCode APIs, provider SDKs, direct filesystem/process access, or testing fakes.

## Pipeline

`DefaultPromptAssembler` runs immutable stages:

1. collect section candidates from registered providers
2. order by priority and stable ids
3. fit sections into the configured budget
4. weave included sections with exact user history
5. project visible tools from tool policy
6. emit redacted trace and replay metadata

## Extension Points

Register `PromptSectionProviderRegistration` entries with stable ids, versions, section kind, source, priority, budget class, trust level, and compatibility metadata. Providers return typed `PromptSection` values and must consume only data supplied in `PromptAssemblyInput`.

Built-in providers cover exact user prompt, projected context, PageIndex recall, future semantic/ZVec recall evidence, tool-result continuity, skill context, code intelligence context, webpage output contract, and tool policy summaries.

## Replay Model

Replay compares captured and replayed assembly fingerprints plus registry, section order, budget, tool plan, and message-role fingerprints. Redacted traces are enough to identify structural drift without persisting unbounded raw prompt content.

## Boundary Rules

This package may import `@deepseek/platform-contracts` only. Runtime and hosts call into prompt assembly; prompt assembly never imports runtime, apps, provider adapters, platform APIs, or test fakes.
