import {invoke} from '@tauri-apps/api/core';

function isTauriRuntime() {
  return typeof window !== 'undefined' && Boolean(window.__TAURI_INTERNALS__);
}

export async function computeGraphLayoutWithRust(rows = []) {
  if (!isTauriRuntime()) return null;
  if (!Array.isArray(rows) || rows.length === 0) return null;
  try {
    const payload = {
      rows: rows.map((row) => ({
        entry_id: row.entryId,
        identifier: row.identifier,
        relation_targets: (Array.isArray(row.relationTargets) ? row.relationTargets : []).map((rel) => ({
          rel_type: rel.relType,
          target_identifier: rel.targetIdentifier
        }))
      }))
    };
    const result = await invoke('compute_graph_layout', {payload});
    return result && typeof result === 'object' ? result : null;
  } catch (e) {
    console.warn('Rust graph layout unavailable, fallback to JS layout', e);
    return null;
  }
}

