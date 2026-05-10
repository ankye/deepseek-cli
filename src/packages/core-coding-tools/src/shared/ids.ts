import { asId } from "@deepseek/platform-contracts";

export const coreToolIds = {
  fileRead: asId<"capability">("core.file.read"),
  fileWrite: asId<"capability">("core.file.write"),
  fileEdit: asId<"capability">("core.file.edit"),
  fileList: asId<"capability">("core.file.list"),
  searchText: asId<"capability">("core.search.text"),
  shellRun: asId<"capability">("core.shell.run"),
  gitStatus: asId<"capability">("core.git.status"),
  gitDiff: asId<"capability">("core.git.diff"),
  testRun: asId<"capability">("core.test.run"),
  todoPlan: asId<"capability">("core.todo.plan"),
  webFetch: asId<"capability">("core.web.fetch"),
  webSearch: asId<"capability">("core.web.search")
} as const;
