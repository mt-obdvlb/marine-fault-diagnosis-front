#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Deserialize)]
struct LayoutPayload {
    rows: Vec<LayoutRow>,
}

#[derive(Debug, Deserialize)]
struct LayoutRow {
    entry_id: String,
    identifier: String,
    relation_targets: Vec<RelationTarget>,
}

#[derive(Debug, Deserialize)]
struct RelationTarget {
    rel_type: String,
    target_identifier: String,
}

#[derive(Debug, Serialize)]
struct NodePos {
    x: f64,
    y: f64,
}

#[derive(Debug, Serialize)]
struct LayoutResult {
    positions: HashMap<String, NodePos>,
    dominant_rel_types: HashMap<String, String>,
}

fn stable_hash(s: &str) -> u64 {
    let mut hash: u64 = 1469598103934665603;
    for b in s.as_bytes() {
        hash ^= *b as u64;
        hash = hash.wrapping_mul(1099511628211);
    }
    hash
}

#[tauri::command]
fn compute_graph_layout(payload: LayoutPayload) -> LayoutResult {
    let rows = payload.rows;
    let n = rows.len().max(1) as f64;
    let golden_angle = std::f64::consts::PI * (3.0 - 5.0f64.sqrt());
    let spread = (n.sqrt() * 28.0).max(80.0);
    let jitter = spread * 0.08;

    let mut positions: HashMap<String, NodePos> = HashMap::with_capacity(rows.len());
    let mut id_to_entry: HashMap<String, String> = HashMap::with_capacity(rows.len());
    let mut rel_counter: HashMap<String, HashMap<String, u32>> = HashMap::with_capacity(rows.len());

    for (idx, row) in rows.iter().enumerate() {
        let angle = (idx as f64) * golden_angle;
        let radius = spread * (((idx + 1) as f64) / n).sqrt();
        let h = stable_hash(&row.entry_id);
        let jx = (((h & 0xffff) as f64) / 65535.0 - 0.5) * jitter;
        let jy = ((((h >> 16) & 0xffff) as f64) / 65535.0 - 0.5) * jitter;
        positions.insert(
            row.entry_id.clone(),
            NodePos {
                x: angle.cos() * radius + jx,
                y: angle.sin() * radius + jy,
            },
        );
        id_to_entry.insert(row.identifier.clone(), row.entry_id.clone());
        rel_counter.insert(row.entry_id.clone(), HashMap::new());
    }

    for row in rows.iter() {
        for rel in row.relation_targets.iter() {
            if let Some(counter) = rel_counter.get_mut(&row.entry_id) {
                *counter.entry(rel.rel_type.clone()).or_insert(0) += 1;
            }
            if let Some(target_entry_id) = id_to_entry.get(&rel.target_identifier) {
                if let Some(counter) = rel_counter.get_mut(target_entry_id) {
                    *counter.entry(rel.rel_type.clone()).or_insert(0) += 1;
                }
            }
        }
    }

    let mut dominant_rel_types: HashMap<String, String> = HashMap::with_capacity(rows.len());
    for row in rows.iter() {
        let dominant = rel_counter
            .get(&row.entry_id)
            .and_then(|counter| {
                counter
                    .iter()
                    .max_by_key(|(_, count)| *count)
                    .map(|(rel_type, _)| rel_type.clone())
            })
            .unwrap_or_else(|| "default".to_string());
        dominant_rel_types.insert(row.entry_id.clone(), dominant);
    }

    LayoutResult {
        positions,
        dominant_rel_types,
    }
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![compute_graph_layout])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
