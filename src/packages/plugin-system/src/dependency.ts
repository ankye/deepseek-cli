import type { PluginDependencyEdge, PluginDependencyResolution, PluginManifest, RedactedError } from "@deepseek/platform-contracts";
import { dependenciesFor, pluginValidationError, replayFingerprint, sortPluginManifestsById } from "./shared.js";

export function resolvePluginDependencyGraph(manifests: readonly PluginManifest[]): PluginDependencyResolution {
  const sorted = sortPluginManifestsById(manifests);
  const manifestIds = new Set(sorted.map((manifest) => manifest.id));
  const edges: PluginDependencyEdge[] = [];
  const diagnostics: RedactedError[] = [];
  for (const manifest of sorted) {
    for (const dependency of dependenciesFor(manifest)) {
      const exists = manifestIds.has(dependency.pluginId);
      const optional = dependency.optional === true;
      const status = exists ? "resolved" : optional ? "skipped-optional" : "missing";
      const edge: PluginDependencyEdge = {
        from: manifest.id,
        to: dependency.pluginId,
        optional,
        ...(dependency.versionRange ? { versionRange: dependency.versionRange } : {}),
        status
      };
      edges.push(edge);
      if (!exists && !optional) {
        diagnostics.push(
          pluginValidationError("PLUGIN_DEPENDENCY_MISSING", `Plugin ${manifest.id} requires missing plugin ${dependency.pluginId}.`, {
            pluginId: manifest.id,
            dependencyId: dependency.pluginId
          })
        );
      }
    }
  }
  const activationOrder = topologicalActivationOrder(sorted, edges);
  const status = diagnostics.length > 0 ? "blocked" : edges.some((edge) => edge.status === "skipped-optional") ? "degraded" : "resolved";
  return {
    status,
    activationOrder,
    edges,
    skippedOptionalEdges: edges.filter((edge) => edge.status === "skipped-optional"),
    diagnostics,
    replayFingerprint: replayFingerprint({ kind: "plugin-dependency-graph", activationOrder, edges, status })
  };
}

function topologicalActivationOrder(
  manifests: readonly PluginManifest[],
  edges: readonly PluginDependencyEdge[]
): readonly PluginManifest["id"][] {
  const ids = manifests.map((manifest) => manifest.id);
  const visited = new Set<string>();
  const visiting = new Set<string>();
  const order: PluginManifest["id"][] = [];
  const edgesByFrom = new Map<string, readonly PluginDependencyEdge[]>();
  for (const id of ids) {
    edgesByFrom.set(
      id,
      edges
        .filter((edge) => edge.from === id && edge.status === "resolved")
        .sort((left, right) => left.to.localeCompare(right.to, "en"))
    );
  }
  const visit = (id: PluginManifest["id"]) => {
    if (visited.has(id) || visiting.has(id)) return;
    visiting.add(id);
    for (const edge of edgesByFrom.get(id) ?? []) {
      visit(edge.to);
    }
    visiting.delete(id);
    visited.add(id);
    order.push(id);
  };
  for (const id of ids) visit(id);
  return order;
}
