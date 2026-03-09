import Graph from 'graphology';
import api from './api';

export const RELATION_TARGET_LABEL = {
    relationship_fault: '故障现象',
    relationship_reason: '故障原因',
    relationship_solution: '维修步骤',
    relationship_component: '零部件',
    relationship_precaution: '注意事项',
    relationship_material: '使用材料'
};

const DEFAULT_COLORS = {
    type: '#722ED1',
    entry: '#1677FF',
    desc: '#13A8A8'
};

export const LABEL_OPTIONS = ['使用材料', '故障原因', '故障现象', '注意事项', '维修步骤', '设备', '零部件'];
export const DB_TYPE_OPTIONS = ['static', 'dynamic'];

function cleanText(value) {
    return String(value ?? '').trim();
}

function toDescList(item = {}) {
    if (Array.isArray(item?.desc)) {
        return item.desc.map(cleanText).filter(Boolean);
    }
    const fromDesc = cleanText(item?.desc);
    if (fromDesc) return [fromDesc];
    const fromContent = cleanText(item?.content ?? item?.description);
    return fromContent ? [fromContent] : [];
}

export function normalizeKnowledgeList(list = []) {
    const seenEntryIds = new Set();
    return (Array.isArray(list) ? list : []).map((item, index) => {
        const fallbackId = `unknown_${index}`;
        const rawIdentifier = cleanText(item?.identifier ?? item?.id ?? item?.name ?? fallbackId) || fallbackId;
        let entryId = `entry_${rawIdentifier}`;
        if (seenEntryIds.has(entryId)) entryId = `${entryId}_${index}`;
        seenEntryIds.add(entryId);

        const labelText = cleanText(item?.label ?? item?.category ?? '未分类') || '未分类';
        const dbType = cleanText(item?.type ?? item?.db_type ?? 'static') || 'static';
        const descList = toDescList(item);
        const desc = cleanText(item?.desc) || descList.join('；');
        const sourceFile = cleanText(item?.source_file ?? item?.sourceFile);
        const createdAt = cleanText(item?.created_at ?? item?.createdAt);
        const relationships = typeof item?.relationships === 'object' && item.relationships !== null
            ? item.relationships
            : {};

        const relationTargets = Object.entries(relationships)
            .map(([relType, targetIdentifier]) => ({
                relType,
                relName: RELATION_TARGET_LABEL[relType] || relType,
                targetIdentifier: cleanText(targetIdentifier)
            }))
            .filter(v => v.targetIdentifier);

        const displayName = cleanText(item?.name ?? item?.title) || `${labelText} ${rawIdentifier}`;

        return {
            entryId,
            id: item?.id ?? rawIdentifier,
            identifier: rawIdentifier,
            label: labelText,
            name: displayName,
            type: dbType,
            equipment: cleanText(item?.equipment ?? ''),
            category: cleanText(item?.category ?? labelText),
            desc,
            descList,
            relationships,
            relationTargets,
            source_file: sourceFile,
            created_at: createdAt,
            searchText: `${displayName} ${rawIdentifier} ${labelText} ${dbType} ${desc} ${relationTargets.map(v => `${v.relType} ${v.targetIdentifier}`).join(' ')}`.toLowerCase(),
            raw: item
        };
    });
}

export function filterKnowledges(list = [], filters = {}) {
    const keyword = cleanText(filters?.keyword).toLowerCase();
    const equipment = cleanText(filters?.equipment).toLowerCase();
    const labels = Array.isArray(filters?.labels) ? new Set(filters.labels) : null;
    const types = Array.isArray(filters?.types) ? new Set(filters.types) : null;

    return (Array.isArray(list) ? list : []).filter(item => {
        if (keyword) {
            const text = cleanText(item?.searchText).toLowerCase();
            if (!text.includes(keyword)) return false;
        }
        if (equipment) {
            const equipText = cleanText(item?.equipment).toLowerCase();
            if (!equipText.includes(equipment)) return false;
        }
        if (labels && labels.size > 0 && !labels.has(item?.label)) return false;
        if (types && types.size > 0 && !types.has(item?.type)) return false;
        return true;
    });
}

export function filterKnowledgesByEquipment(list = [], keyword = '') {
    return filterKnowledges(list, { equipment: keyword });
}

export function paginateList(list = [], page = 1, pageSize = 20) {
    const safePage = Math.max(1, Number(page) || 1);
    const safePageSize = Math.max(1, Number(pageSize) || 20);
    const total = Array.isArray(list) ? list.length : 0;
    const totalPages = Math.max(1, Math.ceil(total / safePageSize));
    const currentPage = Math.min(safePage, totalPages);
    const start = (currentPage - 1) * safePageSize;
    return {
        page: currentPage,
        pageSize: safePageSize,
        total,
        totalPages,
        items: (Array.isArray(list) ? list : []).slice(start, start + safePageSize)
    };
}

export function buildKnowledgeOverview(normalizedList = [], topTypes = 8) {
    const labelCount = new Map();
    const typeCount = new Map();
    const relationCount = new Map();
    let edgeTotal = 0;

    normalizedList.forEach(item => {
        const label = cleanText(item?.label) || '未分类';
        const type = cleanText(item?.type) || 'dynamic';
        labelCount.set(label, (labelCount.get(label) || 0) + 1);
        typeCount.set(type, (typeCount.get(type) || 0) + 1);

        (Array.isArray(item?.relationTargets) ? item.relationTargets : []).forEach(rel => {
            const relName = cleanText(rel?.relName || rel?.relType);
            if (!relName) return;
            relationCount.set(relName, (relationCount.get(relName) || 0) + 1);
            edgeTotal += 1;
        });
    });

    const nodeTypes = Array.from(labelCount.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, Math.max(1, Number(topTypes) || 8))
        .map(([type, count]) => ({ type, label: type, count }));

    const relationTypes = Array.from(relationCount.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([type, count]) => ({ type, label: type, count }));

    return {
        node_count: normalizedList.length,
        relation_count: edgeTotal,
        node_types: nodeTypes,
        relation_types: relationTypes,
        db_types: Array.from(typeCount.entries()).map(([type, count]) => ({ type, label: type, count }))
    };
}

export function collectKnowledgeFacets(normalizedList = []) {
    const labels = new Set();
    const types = new Set();

    normalizedList.forEach(item => {
        if (item?.label) labels.add(item.label);
        if (item?.type) types.add(item.type);
    });

    return {
        labels: Array.from(labels),
        types: Array.from(types)
    };
}

export function buildKnowledgeRelationGraphData(normalizedList = [], options = {}) {
    const g = new Graph({ multi: true, type: 'directed' });
    const selectedLabels = new Set(options?.selectedLabels || []);
    const selectedTypes = new Set(options?.selectedTypes || []);
    const keyword = cleanText(options?.keyword).toLowerCase();
    const maxNodes = Math.max(200, Number(options?.maxNodes) || 3000);
    const maxEdges = Math.max(500, Number(options?.maxEdges) || 20000);
    const includeGhostNodes = Boolean(options?.includeGhostNodes);

    const filteredRows = normalizedList.filter(item => {
        if (selectedLabels.size > 0 && !selectedLabels.has(item.label)) return false;
        if (selectedTypes.size > 0 && !selectedTypes.has(item.type)) return false;
        if (keyword && !cleanText(item.searchText).toLowerCase().includes(keyword)) return false;
        return true;
    });
    const rows = filteredRows.slice(0, maxNodes);

    const identifierMap = new Map(rows.map(item => [item.identifier, item]));
    const labelPalette = {
        使用材料: '#4f7cff',
        故障原因: '#ff8a00',
        故障现象: '#ff4d6d',
        注意事项: '#00a884',
        维修步骤: '#6b5bff',
        设备: '#0a9396',
        零部件: '#bc5090',
        未分类: '#7a7a7a'
    };

    const relationColors = {
        relationship_fault: '#ff4d6d',
        relationship_reason: '#ff8a00',
        relationship_solution: '#6b5bff',
        relationship_component: '#bc5090',
        relationship_precaution: '#00a884',
        relationship_material: '#4f7cff'
    };

    const edgeTypeCount = new Map();
    let edgeCount = 0;

    rows.forEach((item, idx) => {
        if (g.hasNode(item.entryId)) return;
        const angle = (Math.PI * 2 * idx) / Math.max(rows.length, 1);
        const radius = 10 + (idx % 30) * 1.6;
        g.addNode(item.entryId, {
            id: item.identifier,
            label: `${item.identifier}`,
            subLabel: item.label,
            kind: item.label,
            dbType: item.type,
            desc: item.desc,
            x: Math.cos(angle) * radius,
            y: Math.sin(angle) * radius,
            size: 5,
            color: labelPalette[item.label] || labelPalette.未分类,
            searchText: item.searchText
        });
    });

    rows.forEach(item => {
        item.relationTargets.forEach((rel, relIndex) => {
            if (edgeCount >= maxEdges) return;
            const target = identifierMap.get(rel.targetIdentifier);
            const targetNodeId = target ? target.entryId : `ghost_${rel.targetIdentifier}`;

            if (!target && !includeGhostNodes) return;

            if (!g.hasNode(targetNodeId)) {
                g.addNode(targetNodeId, {
                    id: rel.targetIdentifier,
                    label: rel.targetIdentifier,
                    subLabel: rel.relName,
                    kind: rel.relName,
                    dbType: 'unknown',
                    desc: `未在当前筛选结果中找到节点 ${rel.targetIdentifier}`,
                    x: Math.random() * 30 - 15,
                    y: Math.random() * 30 - 15,
                    size: 3,
                    color: '#c0c0c0',
                    searchText: `${rel.targetIdentifier} ${rel.relName}`.toLowerCase()
                });
            }

            const edgeKey = `${item.entryId}_${rel.relType}_${targetNodeId}_${relIndex}`;
            if (!g.hasEdge(edgeKey)) {
                g.addEdgeWithKey(edgeKey, item.entryId, targetNodeId, {
                    label: RELATION_TARGET_LABEL[rel.relType] || rel.relType,
                    relType: rel.relType,
                    size: 1,
                    color: relationColors[rel.relType] || '#d0d0d0'
                });
                edgeCount += 1;
            }
            const relName = RELATION_TARGET_LABEL[rel.relType] || rel.relType;
            edgeTypeCount.set(relName, (edgeTypeCount.get(relName) || 0) + 1);
        });
    });

    return {
        graph: g,
        metrics: {
            entries: filteredRows.length,
            renderedEntries: rows.length,
            nodes: g.order,
            edges: g.size,
            labels: Array.from(new Set(rows.map(v => v.label))).length,
            types: Array.from(new Set(rows.map(v => v.type))).length,
            matched: 0,
            truncated: filteredRows.length > rows.length,
            edgeTypes: Array.from(edgeTypeCount.entries()).map(([name, count]) => ({ name, count }))
        }
    };
}

export function buildKnowledgeGraphData(normalizedList = [], colors = DEFAULT_COLORS) {
    const g = new Graph({ multi: false, type: 'directed' });
    const typeToEntries = new Map();
    const descToEntries = new Map();

    normalizedList.forEach(item => {
        const typeName = cleanText(item?.type) || 'unknown';
        if (!typeToEntries.has(typeName)) typeToEntries.set(typeName, []);
        typeToEntries.get(typeName).push(item);

        const uniqueDesc = new Set((Array.isArray(item?.descList) ? item.descList : []).filter(Boolean));
        uniqueDesc.forEach(desc => {
            if (!descToEntries.has(desc)) descToEntries.set(desc, []);
            descToEntries.get(desc).push(item);
        });
    });

    const typeNames = Array.from(typeToEntries.keys()).sort((a, b) => a.localeCompare(b));
    const typeCount = typeNames.length || 1;
    const typeRing = Math.max(24, Math.sqrt(normalizedList.length || 1) * 2.5);
    let edgeCount = 0;

    typeNames.forEach((typeName, tIndex) => {
        const angle = (Math.PI * 2 * tIndex) / typeCount;
        const tx = typeRing * Math.cos(angle);
        const ty = typeRing * Math.sin(angle);
        const typeId = `type_${typeName}`;

        g.addNode(typeId, {
            id: typeId,
            label: typeName,
            kind: '分类',
            desc: `知识类型: ${typeName}`,
            x: tx,
            y: ty,
            size: 8,
            color: colors.type
        });

        const entries = typeToEntries.get(typeName);
        const localCount = entries.length;
        const localRadius = 6 + Math.sqrt(localCount || 1) * 1.6;

        entries.forEach((entry, i) => {
            const localAngle = (Math.PI * 2 * i) / Math.max(1, localCount);
            const ex = tx + localRadius * Math.cos(localAngle);
            const ey = ty + localRadius * Math.sin(localAngle);

            g.addNode(entry.entryId, {
                id: entry.entryId,
                label: entry.label,
                kind: '条目',
                desc: `标识: ${entry.identifier}${entry.descList.length ? `; 描述: ${entry.descList.join('、')}` : ''}`,
                x: ex,
                y: ey,
                size: 3.2,
                color: colors.entry,
                searchText: entry.searchText
            });

            const edgeId = `te_${typeId}_${entry.entryId}`;
            if (!g.hasEdge(edgeId)) {
                g.addEdgeWithKey(edgeId, typeId, entry.entryId, {
                    color: '#BFBFBF',
                    size: 0.5,
                    label: '包含'
                });
                edgeCount += 1;
            }
        });
    });

    let descIndex = 0;
    const descRadiusBase = typeRing + 12;
    descToEntries.forEach((entries, desc) => {
        const descId = `desc_${descIndex}`;
        descIndex += 1;
        const angle = (Math.PI * 2 * descIndex) / Math.max(1, descToEntries.size);
        const radius = descRadiusBase + (descIndex % 7) * 4;
        const dx = radius * Math.cos(angle);
        const dy = radius * Math.sin(angle);

        g.addNode(descId, {
            id: descId,
            label: desc,
            kind: '属性',
            desc,
            x: dx,
            y: dy,
            size: 2.4,
            color: colors.desc,
            searchText: desc.toLowerCase()
        });

        entries.forEach(entry => {
            const edgeId = `ed_${entry.entryId}_${descId}`;
            if (!g.hasEdge(edgeId)) {
                g.addEdgeWithKey(edgeId, entry.entryId, descId, {
                    color: '#D9D9D9',
                    size: 0.35,
                    label: '描述'
                });
                edgeCount += 1;
            }
        });
    });

    return {
        graph: g,
        metrics: {
            entries: normalizedList.length,
            types: typeNames.length,
            descs: descToEntries.size,
            nodes: g.order,
            edges: edgeCount,
            matched: 0
        }
    };
}

const KNOWLEDGE_CACHE = {
    loaded: false,
    rows: [],
    promise: null
};

export function clearKnowledgeCache() {
    KNOWLEDGE_CACHE.loaded = false;
    KNOWLEDGE_CACHE.rows = [];
    KNOWLEDGE_CACHE.promise = null;
}

export async function fetchAllKnowledges(query = {}, requestArg = {}, options = {}) {
    const onProgress = typeof options.onProgress === 'function' ? options.onProgress : null;
    const force = Boolean(options.force);
    const queryKeys = Object.keys(query || {}).filter(key => query[key] !== '' && query[key] !== undefined && query[key] !== null);
    const useCache = queryKeys.length === 0;

    if (useCache && !force && KNOWLEDGE_CACHE.loaded) return KNOWLEDGE_CACHE.rows;
    if (useCache && !force && KNOWLEDGE_CACHE.promise) return KNOWLEDGE_CACHE.promise;

    const runner = (async () => {
        if (onProgress) onProgress({ page: 1, pageSize: 0, loaded: 0, total: 0 });
        const r = await api.knowledgeList(query, requestArg);
        if (!r) return null;
        const payload = r.data || {};
        const all = Array.isArray(payload.items) ? payload.items : [];
        if (useCache) {
            KNOWLEDGE_CACHE.loaded = true;
            KNOWLEDGE_CACHE.rows = all;
        }
        return all;
    })();

    if (useCache) {
        KNOWLEDGE_CACHE.promise = runner;
        try {
            return await KNOWLEDGE_CACHE.promise;
        } finally {
            KNOWLEDGE_CACHE.promise = null;
        }
    }

    return await runner;
}
