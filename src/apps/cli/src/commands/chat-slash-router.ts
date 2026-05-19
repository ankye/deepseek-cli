import { invokeInteractiveCommand, isInteractiveControlResult, renderInteractiveControlText } from "@deepseek/command-system";
import type { InteractiveControlResult } from "@deepseek/command-system";
import type { CliOptions } from "../types.js";
import type { ChatSessionState } from "./chat-state.js";
import { handleInjectedChatPluginSlashCommand, resolveInjectedChatPluginSlashCommand } from "./chat-builtin-plugin-slash.js";
import { isChatModeControlCommand, modeControlRequestedTransition, renderChatCostStatus, renderChatModeControl, renderChatModelStatus } from "./chat-mode-controls.js";
import { writeChatLocalLines } from "./chat-local-output.js";

type ChatSlashOutcome = "continue" | "exit";
type ChatSlashWrite = (line: string) => Promise<void>;
type ChatSlashHandler = (context: ChatSlashContext) => Promise<ChatSlashOutcome>;
type ChatSlashLocalHandler = (raw: string, options: CliOptions, state: ChatSessionState, write: ChatSlashWrite) => Promise<void>;

export interface ChatSlashContext {
  readonly name: string;
  readonly rest: string;
  readonly raw: string;
  readonly options: CliOptions;
  readonly state: ChatSessionState;
  readonly write: ChatSlashWrite;
}

export interface ChatSlashRouterHandlers {
  readonly approval: ChatSlashLocalHandler;
  readonly palette: ChatSlashLocalHandler;
  readonly file: ChatSlashLocalHandler;
  readonly jump: ChatSlashLocalHandler;
  readonly context: ChatSlashLocalHandler;
  readonly keymap: (raw: string, options: CliOptions, write: ChatSlashWrite) => Promise<void>;
  readonly revert: ChatSlashLocalHandler;
  readonly history: ChatSlashLocalHandler;
}

export interface ChatSlashRouter {
  handle(prompt: string, options: CliOptions, state: ChatSessionState, write: ChatSlashWrite): Promise<ChatSlashOutcome>;
}

export function createChatSlashRouter(handlers: ChatSlashRouterHandlers): ChatSlashRouter {
  const staticRoutes: Readonly<Record<string, ChatSlashHandler>> = {
    approval: continueAfter(handlers.approval),
    palette: continueAfter(handlers.palette),
    file: continueAfter(handlers.file),
    jump: continueAfter(handlers.jump),
    context: continueAfter(handlers.context),
    keymap: async ({ rest, options, write }) => {
      await handlers.keymap(rest, options, write);
      return "continue";
    },
    revert: continueAfter(handlers.revert),
    history: continueAfter(handlers.history)
  };
  const dynamicRoutes: readonly { readonly matches: (name: string) => boolean; readonly handle: ChatSlashHandler }[] = [
    { matches: isChatModeControlCommand, handle: handleChatModeControlSlashRoute },
    { matches: (name) => name === "cost", handle: handleChatCostSlashRoute },
    { matches: (name) => name === "model", handle: handleChatModelSlashRoute }
  ];
  return {
    handle: async (prompt, options, state, write) => {
      const raw = prompt.slice(1).trim();
      const name = raw.split(/\s+/)[0] ?? "";
      const rest = raw.slice(name.length).trim();
      const context: ChatSlashContext = { name, rest, raw, options, state, write };
      const route = staticRoutes[name] ?? dynamicRoutes.find((entry) => entry.matches(name))?.handle;
      if (route) return route(context);
      const injectedPluginCommand = resolveInjectedChatPluginSlashCommand(raw);
      if (injectedPluginCommand) {
        await handleInjectedChatPluginSlashCommand(injectedPluginCommand, options, state, write);
        return "continue";
      }
      return handleInteractiveSlashFallback(context);
    }
  };
}

export function slashCommandName(prompt: string): string {
  return prompt.slice(1).trim().split(/\s+/)[0] ?? "";
}

function continueAfter(handler: ChatSlashLocalHandler): ChatSlashHandler {
  return async ({ rest, options, state, write }) => {
    await handler(rest, options, state, write);
    return "continue";
  };
}

async function handleChatModeControlSlashRoute({ name, rest, options, state, write }: ChatSlashContext): Promise<ChatSlashOutcome> {
  if (!isChatModeControlCommand(name)) return "continue";
  const requestedTransition = modeControlRequestedTransition(name, rest);
  await writeChatLocalLines(
    `chat.command.${name}`,
    renderChatModeControl(name, state.modeControls, options.output, {
      ...(requestedTransition ? { requestedTransition } : {})
    }),
    options,
    write
  );
  return "continue";
}

async function handleChatCostSlashRoute({ options, state, write }: ChatSlashContext): Promise<ChatSlashOutcome> {
  await writeChatLocalLines("chat.command.cost", renderChatCostStatus(state.usage, options.output), options, write);
  return "continue";
}

async function handleChatModelSlashRoute({ options, state, write }: ChatSlashContext): Promise<ChatSlashOutcome> {
  await writeChatLocalLines("chat.command.model", renderChatModelStatus(state.modeControls, options.output), options, write);
  return "continue";
}

async function handleInteractiveSlashFallback({ name, options, state, write }: ChatSlashContext): Promise<ChatSlashOutcome> {
  const result = await invokeInteractiveCommand(name);
  if (!result.ok || !isInteractiveControlResult(result.value)) {
    if (options.output === "text") await write(`[chat] unknown command /${name}`);
    else if (options.output === "json" || options.output === "jsonl") await write(JSON.stringify({ kind: "chat.command.unknown", command: name }));
    return "continue";
  }
  const control: InteractiveControlResult = result.value;
  if (control.action === "cancel") {
    if (state.activeController) {
      state.activeController.abort();
      state.activeController = undefined;
      if (options.output === "text") await write("[chat] cancelling active turn");
    } else if (options.output === "text") {
      await write("[chat] nothing to cancel");
    }
    return "continue";
  }
  if (options.output === "text") {
    for (const line of renderInteractiveControlText(control)) await write(line);
  } else if (options.output === "json") {
    await write(JSON.stringify({ kind: "chat.command.result", control }));
  }
  return control.terminal ? "exit" : "continue";
}
