import { asId } from "@deepseek/platform-contracts";

export const coreToolIds = {
  fileRead: asId<"capability">("core.file.read"),
  fileWrite: asId<"capability">("core.file.write"),
  fileEdit: asId<"capability">("core.file.edit"),
  fileList: asId<"capability">("core.file.list"),
  searchText: asId<"capability">("core.search.text"),
  shellRun: asId<"capability">("core.shell.run"),
  shellOutput: asId<"capability">("core.shell.output"),
  shellKill: asId<"capability">("core.shell.kill"),
  gitStatus: asId<"capability">("core.git.status"),
  gitDiff: asId<"capability">("core.git.diff"),
  testRun: asId<"capability">("core.test.run"),
  todoPlan: asId<"capability">("core.todo.plan"),
  webFetch: asId<"capability">("core.web.fetch"),
  webSearch: asId<"capability">("core.web.search"),
  agentSpawn: asId<"capability">("core.agent.spawn"),
  agentContinue: asId<"capability">("core.agent.continue"),
  agentStop: asId<"capability">("core.agent.stop"),
  hookList: asId<"capability">("core.hook.list"),
  skillList: asId<"capability">("core.skill.list"),
  skillActivate: asId<"capability">("core.skill.activate")
} as const;
