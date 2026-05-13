import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { asId } from "@deepseek/platform-contracts";
import { NoopRemoteRuntimeConnectivity } from "@deepseek/platform-abstraction";
import { getReferencePitFixture } from "@deepseek/testing-regression";

describe("remote identity reference pit fixtures", () => {
  it("keeps remote binding, session, transport, display, and audit identities separate", async () => {
    const fixture = getReferencePitFixture("pit.remote-identity.separate-domains");
    assert.equal(fixture?.evidenceIds.includes("remote:identity-separation"), true);
    const remote = new NoopRemoteRuntimeConnectivity();
    await remote.bind({
      id: "remote-binding-1",
      sessionId: asId<"session">("session-1"),
      transport: "relay",
      trustedDevice: {
        displayId: "terminal-left",
        auditCorrelationId: "audit-corr-1",
        deviceKeyRef: "credentialRef:remote-device"
      }
    });

    const binding = await remote.reconnect("remote-binding-1");
    assert.equal(binding?.id, "remote-binding-1");
    assert.equal(binding?.sessionId, "session-1");
    assert.equal(binding?.transport, "relay");
    assert.equal(binding?.trustedDevice.displayId, "terminal-left");
    assert.equal(binding?.trustedDevice.auditCorrelationId, "audit-corr-1");
  });

  it("targets cancellation by remote binding id without rewriting session identity", async () => {
    const remote = new NoopRemoteRuntimeConnectivity();
    await remote.bind({
      id: "remote-binding-cancel",
      sessionId: asId<"session">("session-cancel"),
      transport: "local-server",
      trustedDevice: { displayId: "daemon", auditCorrelationId: "audit-cancel" }
    });

    await remote.cancelRemote("remote-binding-cancel", "user-cancelled");
    const [cancellation] = remote.cancellationHistory();
    const binding = await remote.reconnect("remote-binding-cancel");

    assert.equal(cancellation?.id, "remote-binding-cancel");
    assert.equal(cancellation?.reason, "user-cancelled");
    assert.equal(binding?.sessionId, "session-cancel");
    assert.equal(binding?.trustedDevice.auditCorrelationId, "audit-cancel");
  });
});
