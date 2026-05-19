import type { CliOptions } from "../types.js";
import type { ChatSessionState } from "./chat-state.js";
import { renderFileManagerResult, resolveFileManager } from "./file-manager.js";
import type { FileManagerAction } from "./file-manager.js";
import { renderJumpNavigatorResult, resolveJumpNavigator } from "./jump-navigator.js";
import type { JumpNavigatorAction } from "./jump-navigator.js";
import { writeChatLocalLines, writeLocalFailure } from "./chat-local-output.js";
import { attachChatPaletteResultList } from "./palette-result-list.js";
import { ensureChatPaletteState } from "./palette-state.js";

export async function handleChatFileSlashCommand(
  raw: string,
  options: CliOptions,
  state: ChatSessionState,
  write: (line: string) => Promise<void>
): Promise<void> {
  if (!state.workspaceDeps) {
    await writeLocalFailure("file", "CLI_FILE_MANAGER_PLATFORM_UNAVAILABLE", options, write);
    return;
  }
  const input = parseFileSlashInput(raw);
  const result = await resolveFileManager(state.workspaceDeps.platform, state.workspaceRoot, input.action, input.query);
  if (result.resultList) {
    state.palette = attachChatPaletteResultList(ensureChatPaletteState(state.palette), result.resultList, result.referenceItems);
  }
  await writeChatLocalLines("chat.command.file", renderFileManagerResult(result, options.output), options, write);
}

export async function handleChatJumpSlashCommand(
  raw: string,
  options: CliOptions,
  state: ChatSessionState,
  write: (line: string) => Promise<void>
): Promise<void> {
  if (!state.workspaceDeps) {
    await writeLocalFailure("jump", "CLI_JUMP_NAVIGATOR_PLATFORM_UNAVAILABLE", options, write);
    return;
  }
  const input = parseJumpSlashInput(raw);
  const result = await resolveJumpNavigator(state.workspaceDeps.platform, state.workspaceRoot, input.action, input.query);
  if (result.resultList) {
    state.palette = attachChatPaletteResultList(ensureChatPaletteState(state.palette), result.resultList);
  }
  await writeChatLocalLines("chat.command.jump", renderJumpNavigatorResult(result, options.output), options, write);
}

function parseFileSlashInput(raw: string): { readonly action: FileManagerAction; readonly query: string } {
  const trimmed = raw.trim();
  const firstToken = trimmed.split(/\s+/, 1)[0] ?? "";
  const action = fileSlashAction(firstToken);
  if (!action) return { action: "list", query: trimmed };
  return {
    action,
    query: trimmed.slice(firstToken.length).trim()
  };
}

function parseJumpSlashInput(raw: string): { readonly action: JumpNavigatorAction; readonly query: string } {
  const trimmed = raw.trim();
  const firstToken = trimmed.split(/\s+/, 1)[0] ?? "";
  const action = jumpSlashAction(firstToken);
  if (!action) return { action: "file", query: trimmed };
  return {
    action,
    query: trimmed.slice(firstToken.length).trim()
  };
}

function fileSlashAction(value: string | undefined): FileManagerAction | undefined {
  if (value === "list" || value === "preview") return value;
  if (value === "refs" || value === "references") return "references";
  return undefined;
}

function jumpSlashAction(value: string | undefined): JumpNavigatorAction | undefined {
  if (value === "file" || value === "text" || value === "symbol") return value;
  return undefined;
}
