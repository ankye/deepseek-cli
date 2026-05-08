import { FakePlatformRuntime } from "@deepseek/platform-abstraction";

export function createFakePlatformMatrix() {
  return [new FakePlatformRuntime("macos"), new FakePlatformRuntime("windows"), new FakePlatformRuntime("linux")];
}
