#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};

#[derive(Debug, Deserialize)]
struct LayoutPayload {
    rows: Vec<LayoutRow>,
}

#[derive(Debug, Deserialize)]
struct LayoutRow {
    entry_id: String,
    identifier: String,
    label: String,
    db_type: String,
    desc: String,
    search_text: String,
    relation_targets: Vec<RelationTarget>,
}

#[derive(Debug, Deserialize)]
struct RelationTarget {
    rel_type: String,
    target_identifier: String,
}

#[derive(Debug, Deserialize)]
struct ProjectionPayload {
    rows: Vec<LayoutRow>,
    selected_labels: Vec<String>,
    selected_types: Vec<String>,
    keyword: String,
    max_nodes: usize,
    max_edges: usize,
    include_ghost_nodes: bool,
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

#[derive(Debug, Serialize)]
struct ProjectionNode {
    entry_id: String,
    id: String,
    label: String,
    sub_label: String,
    kind: String,
    db_type: String,
    desc: String,
    x: f64,
    y: f64,
    size: f64,
    color: String,
    search_text: String,
}

#[derive(Debug, Serialize)]
struct ProjectionEdge {
    key: String,
    source: String,
    target: String,
    label: String,
    rel_type: String,
    size: f64,
    color: String,
}

#[derive(Debug, Serialize)]
struct EdgeTypeCount {
    name: String,
    count: usize,
}

#[derive(Debug, Serialize)]
struct ProjectionMetrics {
    entries: usize,
    rendered_entries: usize,
    nodes: usize,
    edges: usize,
    labels: usize,
    types: usize,
    matched: usize,
    truncated: bool,
    edge_types: Vec<EdgeTypeCount>,
}

#[derive(Debug, Serialize)]
struct ProjectionResult {
    nodes: Vec<ProjectionNode>,
    edges: Vec<ProjectionEdge>,
    metrics: ProjectionMetrics,
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
    let spread_factor = if rows.len() < 500 { 46.0 } else { 30.0 };
    let spread = (n.sqrt() * spread_factor).max(120.0);
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

fn relation_display_name(rel_type: &str) -> String {
    match rel_type {
        "relationship_fault" => "故障现象".to_string(),
        "relationship_reason" => "故障原因".to_string(),
        "relationship_solution" => "维修步骤".to_string(),
        "relationship_component" => "零部件".to_string(),
        "relationship_precaution" => "注意事项".to_string(),
        "relationship_material" => "使用材料".to_string(),
        _ => rel_type.to_string(),
    }
}

fn short_text(s: &str, max_len: usize) -> String {
    let t = s.trim();
    if t.is_empty() {
        return String::new();
    }
    let count = t.chars().count();
    if count <= max_len {
        return t.to_string();
    }
    let mut out: String = t.chars().take(max_len).collect();
    out.push('…');
    out
}

fn relation_color(rel_type: &str) -> String {
    match rel_type {
        "relationship_fault" => "#ff4d6d".to_string(),
        "relationship_reason" => "#ff8a00".to_string(),
        "relationship_solution" => "#6b5bff".to_string(),
        "relationship_component" => "#bc5090".to_string(),
        "relationship_precaution" => "#00a884".to_string(),
        "relationship_material" => "#4f7cff".to_string(),
        _ => "#d0d0d0".to_string(),
    }
}

#[tauri::command]
fn save_text_file(path: String, content: String) -> Result<(), String> {
    if path.trim().is_empty() {
        return Err("保存路径为空".to_string());
    }
    let target = std::path::PathBuf::from(path);
    if let Some(parent) = target.parent() {
        if !parent.as_os_str().is_empty() {
            std::fs::create_dir_all(parent).map_err(|e| format!("创建目录失败: {}", e))?;
        }
    }
    std::fs::write(&target, content).map_err(|e| format!("写入文件失败: {}", e))?;
    Ok(())
}

fn label_color(label: &str) -> String {
    match label {
        "使用材料" => "#4f7cff".to_string(),
        "故障原因" => "#ff8a00".to_string(),
        "故障现象" => "#ff4d6d".to_string(),
        "注意事项" => "#00a884".to_string(),
        "维修步骤" => "#6b5bff".to_string(),
        "设备" => "#0a9396".to_string(),
        "零部件" => "#bc5090".to_string(),
        _ => "#7a7a7a".to_string(),
    }
}

fn node_size_by_degree(degree: usize) -> f64 {
    let d = degree as f64;
    if d <= 8.0 {
        4.0 + d * 2.2
    } else {
        (21.6 + (d - 7.0).log2() * 1.4).min(26.0)
    }
}

#[tauri::command]
fn compute_graph_projection(payload: ProjectionPayload) -> ProjectionResult {
    let selected_labels: HashSet<String> = payload.selected_labels.into_iter().collect();
    let selected_types: HashSet<String> = payload.selected_types.into_iter().collect();
    let keyword = payload.keyword.trim().to_lowercase();

    let filtered_rows: Vec<&LayoutRow> = payload
        .rows
        .iter()
        .filter(|row| {
            if !selected_labels.is_empty() && !selected_labels.contains(&row.label) {
                return false;
            }
            if !selected_types.is_empty() && !selected_types.contains(&row.db_type) {
                return false;
            }
            if !keyword.is_empty() && !row.search_text.to_lowercase().contains(&keyword) {
                return false;
            }
            true
        })
        .collect();

    let max_nodes = payload.max_nodes.max(200);
    let max_edges = payload.max_edges.max(500);
    let rows: Vec<&LayoutRow> = filtered_rows.iter().take(max_nodes).copied().collect();
    let mut identifier_map: HashMap<String, &LayoutRow> = HashMap::with_capacity(rows.len());
    for row in rows.iter() {
        identifier_map.insert(row.identifier.clone(), *row);
    }

    let n = rows.len().max(1) as f64;
    let golden_angle = std::f64::consts::PI * (3.0 - 5.0f64.sqrt());
    let spread_factor = if rows.len() < 500 { 46.0 } else { 30.0 };
    let spread = (n.sqrt() * spread_factor).max(120.0);
    let jitter = spread * 0.08;

    let mut nodes: Vec<ProjectionNode> = Vec::with_capacity(rows.len());
    let mut node_id_set: HashSet<String> = HashSet::with_capacity(rows.len() * 2);
    let mut node_index: HashMap<String, usize> = HashMap::with_capacity(rows.len() * 2);
    let mut degree_count: HashMap<String, usize> = HashMap::with_capacity(rows.len() * 2);
    let mut rel_counter: HashMap<String, HashMap<String, u32>> = HashMap::with_capacity(rows.len());
    let mut labels_set: HashSet<String> = HashSet::new();
    let mut types_set: HashSet<String> = HashSet::new();

    for (idx, row) in rows.iter().enumerate() {
        let angle = (idx as f64) * golden_angle;
        let radius = spread * (((idx + 1) as f64) / n).sqrt();
        let h = stable_hash(&row.entry_id);
        let jx = (((h & 0xffff) as f64) / 65535.0 - 0.5) * jitter;
        let jy = ((((h >> 16) & 0xffff) as f64) / 65535.0 - 0.5) * jitter;
        let display = if row.desc.trim().is_empty() {
            row.identifier.clone()
        } else {
            short_text(&row.desc, 26)
        };
        nodes.push(ProjectionNode {
            entry_id: row.entry_id.clone(),
            id: row.identifier.clone(),
            label: display,
            sub_label: row.label.clone(),
            kind: row.label.clone(),
            db_type: row.db_type.clone(),
            desc: row.desc.clone(),
            x: angle.cos() * radius + jx,
            y: angle.sin() * radius + jy,
            size: 5.0,
            color: label_color(&row.label),
            search_text: row.search_text.clone(),
        });
        node_index.insert(row.entry_id.clone(), nodes.len() - 1);
        node_id_set.insert(row.entry_id.clone());
        degree_count.insert(row.entry_id.clone(), 0);
        rel_counter.insert(row.entry_id.clone(), HashMap::new());
        labels_set.insert(row.label.clone());
        types_set.insert(row.db_type.clone());
    }

    let mut edges: Vec<ProjectionEdge> = Vec::with_capacity(max_edges);
    let mut edge_key_set: HashSet<String> = HashSet::with_capacity(max_edges * 2);
    let mut edge_type_count: HashMap<String, usize> = HashMap::new();
    let mut edge_count = 0usize;

    for row in rows.iter() {
        for (rel_idx, rel) in row.relation_targets.iter().enumerate() {
            if edge_count >= max_edges {
                break;
            }

            let target_entry_id = identifier_map
                .get(&rel.target_identifier)
                .map(|target| target.entry_id.clone())
                .unwrap_or_else(|| format!("ghost_{}", rel.target_identifier));

            let target_exists = identifier_map.contains_key(&rel.target_identifier);
            if !target_exists && !payload.include_ghost_nodes {
                continue;
            }

            if !node_id_set.contains(&target_entry_id) {
                node_id_set.insert(target_entry_id.clone());
                nodes.push(ProjectionNode {
                    entry_id: target_entry_id.clone(),
                    id: rel.target_identifier.clone(),
                    label: rel.target_identifier.clone(),
                    sub_label: relation_display_name(&rel.rel_type),
                    kind: relation_display_name(&rel.rel_type),
                    db_type: "unknown".to_string(),
                    desc: format!("未在当前筛选结果中找到节点 {}", rel.target_identifier),
                    x: 0.0,
                    y: 0.0,
                    size: 3.0,
                    color: "#c0c0c0".to_string(),
                    search_text: format!("{} {}", rel.target_identifier, relation_display_name(&rel.rel_type)),
                });
                node_index.insert(target_entry_id.clone(), nodes.len() - 1);
                degree_count.insert(target_entry_id.clone(), 0);
            }

            let edge_key = format!(
                "{}_{}_{}_{}",
                row.entry_id, rel.rel_type, target_entry_id, rel_idx
            );
            if edge_key_set.contains(&edge_key) {
                continue;
            }
            edge_key_set.insert(edge_key.clone());

            edges.push(ProjectionEdge {
                key: edge_key,
                source: row.entry_id.clone(),
                target: target_entry_id.clone(),
                label: relation_display_name(&rel.rel_type),
                rel_type: rel.rel_type.clone(),
                size: 1.0,
                color: relation_color(&rel.rel_type),
            });
            edge_count += 1;
            *degree_count.entry(row.entry_id.clone()).or_insert(0) += 1;
            *degree_count.entry(target_entry_id.clone()).or_insert(0) += 1;
            *edge_type_count
                .entry(relation_display_name(&rel.rel_type))
                .or_insert(0) += 1;

            if let Some(counter) = rel_counter.get_mut(&row.entry_id) {
                *counter.entry(rel.rel_type.clone()).or_insert(0) += 1;
            }
            if let Some(counter) = rel_counter.get_mut(&target_entry_id) {
                *counter.entry(rel.rel_type.clone()).or_insert(0) += 1;
            }
        }
    }

    for (node_id, degree) in degree_count.iter() {
        if let Some(index) = node_index.get(node_id) {
            if let Some(node) = nodes.get_mut(*index) {
                node.size = node_size_by_degree(*degree);
            }
        }
    }

    let mut dominant_rel_types: HashMap<String, String> = HashMap::with_capacity(rel_counter.len());
    for (node_id, counter) in rel_counter.iter() {
        let dominant = counter
            .iter()
            .max_by_key(|(_, count)| *count)
            .map(|(rel_type, _)| rel_type.clone())
            .unwrap_or_else(|| "default".to_string());
        dominant_rel_types.insert(node_id.clone(), dominant);
    }

    let mut edge_types: Vec<EdgeTypeCount> = edge_type_count
        .iter()
        .map(|(name, count)| EdgeTypeCount {
            name: name.clone(),
            count: *count,
        })
        .collect();
    edge_types.sort_by(|a, b| b.count.cmp(&a.count));

    ProjectionResult {
        metrics: ProjectionMetrics {
            entries: filtered_rows.len(),
            rendered_entries: rows.len(),
            nodes: nodes.len(),
            edges: edges.len(),
            labels: labels_set.len(),
            types: types_set.len(),
            matched: 0,
            truncated: filtered_rows.len() > rows.len(),
            edge_types,
        },
        nodes,
        edges,
        dominant_rel_types,
    }
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            compute_graph_layout,
            compute_graph_projection,
            save_text_file
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
