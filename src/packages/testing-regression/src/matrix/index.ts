import { FakePlatformRuntime } from "@deepseek/platform-abstraction";

export function createFakePlatformMatrix() {
  return [
    new FakePlatformRuntime("macos", "/workspace/macos", { environmentKind: "local", searchProvider: "rg", secureStorageStatus: "available", nativeStatus: "degraded" }),
    new FakePlatformRuntime("windows", "C:/workspace/windows", { environmentKind: "local", searchProvider: "select-string", secureStorageStatus: "available", nativeStatus: "degraded" }),
    new FakePlatformRuntime("linux", "/workspace/linux", { environmentKind: "local", searchProvider: "grep", secureStorageStatus: "degraded", nativeStatus: "degraded" }),
    new FakePlatformRuntime("linux", "/mnt/c/workspace/wsl", { environmentKind: "wsl", searchProvider: "rg", secureStorageStatus: "degraded", nativeStatus: "degraded" }),
    new FakePlatformRuntime("linux", "/workspace/ci", { environmentKind: "ci", searchProvider: "js", secureStorageStatus: "unavailable", nativeStatus: "unavailable" }),
    new FakePlatformRuntime("linux", "/workspace/remote", { environmentKind: "remote", noLocalShell: true, searchProvider: "js", secureStorageStatus: "unavailable", nativeStatus: "unavailable" }),
    new FakePlatformRuntime("linux", "/workspace/readonly", { environmentKind: "local", searchProvider: "js", secureStorageStatus: "available", nativeStatus: "degraded", readOnlyFilesystem: true }),
    new FakePlatformRuntime("linux", "/workspace/offline", { environmentKind: "local", searchProvider: "js", secureStorageStatus: "available", nativeStatus: "degraded", networkStatus: "unavailable" })
  ];
}
