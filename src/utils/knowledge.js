import Graph from 'graphology';
import api from './api';

const DEFAULT_COLORS = {
    type: '#722ED1',
    entry: '#1677FF',
    desc: '#13A8A8'
};

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

        const label = cleanText(item?.label ?? item?.name ?? rawIdentifier) || rawIdentifier;
        const equipment = cleanText(item?.equipment ?? item?.type);
        const category = cleanText(item?.category);
        const type = cleanText(item?.type ?? item?.equipment ?? item?.category ?? 'unknown') || 'unknown';
        const descList = toDescList(item);
        const desc = cleanText(item?.desc) || descList.join('；');
        const sourceFile = cleanText(item?.source_file ?? item?.sourceFile);
        const createdAt = cleanText(item?.created_at ?? item?.createdAt);

        return {
            entryId,
            id: item?.id ?? rawIdentifier,
            identifier: rawIdentifier,
            label,
            name: label,
            type,
            equipment,
            category,
            desc,
            descList,
            source_file: sourceFile,
            created_at: createdAt,
            searchText: `${label} ${rawIdentifier} ${type} ${equipment} ${category} ${descList.join(' ')}`.toLowerCase(),
            raw: item
        };
    });
}

export function filterKnowledgesByEquipment(list = [], keyword = '') {
    const search = cleanText(keyword).toLowerCase();
    if (!search) return Array.isArray(list) ? list : [];
    return (Array.isArray(list) ? list : []).filter(item => {
        const equipment = cleanText(item?.equipment ?? item?.type).toLowerCase();
        return equipment.includes(search);
    });
}

export function buildKnowledgeOverview(normalizedList = [], topTypes = 8) {
    const typeToEntries = new Map();
    const descToEntries = new Map();
    let descRelationCount = 0;

    normalizedList.forEach(item => {
        const typeName = cleanText(item?.type) || 'unknown';
        if (!typeToEntries.has(typeName)) typeToEntries.set(typeName, []);
        typeToEntries.get(typeName).push(item);

        const uniqueDesc = new Set((Array.isArray(item?.descList) ? item.descList : []).filter(Boolean));
        uniqueDesc.forEach(desc => {
            if (!descToEntries.has(desc)) descToEntries.set(desc, []);
            descToEntries.get(desc).push(item);
            descRelationCount += 1;
        });
    });

    const nodeTypes = Array.from(typeToEntries.entries())
        .sort((a, b) => b[1].length - a[1].length)
        .slice(0, Math.max(1, Number(topTypes) || 8))
        .map(([type, entries]) => ({ type, label: type, count: entries.length }));

    return {
        node_count: normalizedList.length + typeToEntries.size + descToEntries.size,
        relation_count: normalizedList.length + descRelationCount,
        node_types: nodeTypes,
        relation_types: [
            { type: 'contains', label: '包含', count: normalizedList.length },
            { type: 'describes', label: '描述', count: descRelationCount }
        ]
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

export async function fetchAllKnowledges(query = {}, requestArg = {}, options = {}) {
    const pageSize = Number(options.pageSize) > 0 ? Number(options.pageSize) : 100;
    const maxPages = Number(options.maxPages) > 0 ? Number(options.maxPages) : 500;
    const onProgress = typeof options.onProgress === 'function' ? options.onProgress : null;

    const all = [];
    let total = 0;

    for (let page = 1; page <= maxPages; page += 1) {
        if (onProgress) onProgress({ page, pageSize, loaded: all.length, total });
        const r = await api.knowledgeList(
            { ...query, page, page_size: pageSize },
            requestArg
        );
        if (!r) return null;

        const payload = r.data || {};
        const pageItems = Array.isArray(payload.items) ? payload.items : [];
        if (page === 1) total = Number(payload.total) || pageItems.length;
        all.push(...pageItems);

        if (pageItems.length <= 0 || all.length >= total || pageItems.length < pageSize) break;
    }

    return all;
}
