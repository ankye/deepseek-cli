import type { CliCompositionSnapshot, CliInteractionContribution } from "@deepseek/platform-contracts";
import type { ChatTuiCommandSuggestion, ChatTuiCommandSuggestionKind } from "./chat-tui-workbench.js";

const CORE_COMMANDS: readonly ChatTuiCommandSuggestion[] = [
  suggestion("control.help", "/help", "control", "builtin", 0, "/help"),
  suggestion("control.exit", "/exit", "control", "builtin", 1, "/exit"),
  suggestion("control.palette", "/palette", "palette", "builtin", 1, "/palette"),
  suggestion("control.context", "/context status", "context", "builtin", 2, "/context status"),
  suggestion("control.refs", "/palette refs list", "reference", "builtin", 3, "/palette refs list"),
  suggestion("view.reasoning", "Reasoning: focus rail", "reasoning-view", "builtin", 4, "reasoning.focus"),
  suggestion("view.inspector", "Inspector: active evidence", "reasoning-view", "builtin", 5, "inspector.focus"),
  suggestion("control.history", "/history", "history", "builtin", 6, "/history"),
  suggestion("control.revert", "/revert preview current", "history", "builtin", 7, "/revert preview current"),
  suggestion("control.mode", "/mode status", "control", "builtin", 8, "/mode status"),
  suggestion("control.model", "/model", "control", "builtin", 9, "/model"),
  suggestion("control.cost", "/cost", "control", "builtin", 10, "/cost"),
  suggestion("control.cancel", "/cancel", "control", "builtin", 11, "/cancel"),
  suggestion("navigation.file.list", "/file list <query>", "navigation", "builtin", 20, "/file list"),
  suggestion("navigation.file.preview", "/file preview <path|query>", "navigation", "builtin", 21, "/file preview"),
  suggestion("navigation.file.refs", "/file refs <query>", "navigation", "builtin", 22, "/file refs"),
  suggestion("navigation.jump.file", "/jump file <query>", "navigation", "builtin", 23, "/jump file"),
  suggestion("navigation.jump.text", "/jump text <query>", "navigation", "builtin", 24, "/jump text"),
  suggestion("navigation.jump.symbol", "/jump symbol <query>", "navigation", "builtin", 25, "/jump symbol")
];

export function commandSuggestions(composition: CliCompositionSnapshot, query: string): readonly ChatTuiCommandSuggestion[] {
  const pluginSuggestions = composition.contributions.flatMap((contribution) => contributionSuggestion(contribution));
  const normalizedQuery = query.trim().toLocaleLowerCase("en");
  return [...CORE_COMMANDS, ...pluginSuggestions]
    .filter((entry) => normalizedQuery.length === 0 || `${entry.title} ${entry.commandName ?? ""} ${entry.kind}`.toLocaleLowerCase("en").includes(normalizedQuery))
    .sort((a, b) => a.rank - b.rank || a.title.localeCompare(b.title, "en") || a.id.localeCompare(b.id, "en"));
}

function contributionSuggestion(contribution: CliInteractionContribution): readonly ChatTuiCommandSuggestion[] {
  const sourceRank = contribution.source === "core" ? 100 : contribution.source === "user" ? 200 : 300;
  if (contribution.kind === "command") {
    const commandName = contribution.commandName ?? contribution.id;
    return [suggestion(
      `contribution:${contribution.id}`,
      commandSuggestionTitle(commandName, contribution),
      contribution.source === "plugin" ? "plugin-action" : "control",
      contribution.source,
      commandSuggestionRank(commandName, sourceRank, contribution.priority),
      commandName,
      contribution.targetKind,
      contribution.pluginId
    )];
  }
  if (contribution.kind === "palette-entry" && contribution.paletteEntry) {
    return [suggestion(
      `palette:${contribution.id}`,
      contribution.paletteEntry.title,
      contribution.source === "plugin" ? "plugin-action" : "palette",
      contribution.source,
      sourceRank + 25,
      contribution.commandName,
      contribution.paletteEntry.targetKind,
      contribution.pluginId
    )];
  }
  if (contribution.kind === "result-list-provider" || contribution.kind === "render-hint") {
    return [suggestion(
      `metadata:${contribution.id}`,
      readableContributionTitle(contribution),
      contribution.source === "plugin" ? "plugin-action" : "palette",
      contribution.source,
      sourceRank + 75,
      contribution.commandName,
      contribution.targetKind,
      contribution.pluginId
    )];
  }
  return [];
}

function commandSuggestionTitle(commandName: string, contribution: CliInteractionContribution): string {
  if (!commandName.startsWith("/")) return commandName;
  const placeholders = ownerRoutePlaceholders(contribution.metadata);
  if (placeholders.length === 0) return commandName;
  return `${commandName} ${placeholders.join(" ")}`;
}

function commandSuggestionRank(commandName: string, sourceRank: number, priority: number | undefined): number {
  const normalizedPriority = priority ?? 0;
  if (commandName.startsWith("/")) return 80 + Math.max(0, 50 - normalizedPriority);
  return sourceRank + (100 - normalizedPriority);
}

function ownerRoutePlaceholders(metadata: CliInteractionContribution["metadata"]): readonly string[] {
  const ownerRoute = isJsonObject(metadata?.ownerRoute) ? metadata.ownerRoute : undefined;
  const fallbackCommand = typeof ownerRoute?.fallbackCommand === "string" ? ownerRoute.fallbackCommand : undefined;
  const placeholders = fallbackCommand?.match(/<[^>]+>/g) ?? [];
  return [...new Set(placeholders)];
}

function readableContributionTitle(contribution: CliInteractionContribution): string {
  const placement = typeof contribution.metadata?.placement === "string" ? contribution.metadata.placement : contribution.kind;
  return `${contribution.pluginId ?? contribution.source}: ${placement}`;
}

function suggestion(
  id: string,
  title: string,
  kind: ChatTuiCommandSuggestionKind,
  source: ChatTuiCommandSuggestion["source"],
  rank: number,
  commandName?: string,
  targetKind?: string,
  pluginId?: string
): ChatTuiCommandSuggestion {
  return {
    id,
    title,
    kind,
    source,
    ...(commandName ? { commandName } : {}),
    ...(targetKind ? { targetKind } : {}),
    ...(pluginId ? { pluginId } : {}),
    rank
  };
}

function isJsonObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
