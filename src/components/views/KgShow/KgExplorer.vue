<template>
  <div class="kg-explorer">
    <div class="toolbar">
      <div class="title-wrap">
        <div class="title">关系知识图谱（全量渲染）</div>
        <div class="status">{{ statusText }}</div>
      </div>
      <div class="controls">
        <input
          v-model.trim="searchKeyword"
          class="input"
          type="text"
          placeholder="搜索 label / identifier / desc"
          @input="applySearchHighlight"
        />
        <button class="btn" @click="resetCamera">视角重置</button>
        <button class="btn" @click="clearSearch">清除高亮</button>
      </div>
    </div>

    <div ref="graphEl" class="graph"></div>

    <div class="panel">
      <div class="panel-title">节点详情</div>
      <div v-if="selectedNode" class="panel-content">
        <div><b>名称：</b>{{ selectedNode.label }}</div>
        <div><b>类型：</b>{{ selectedNode.kind }}</div>
        <div><b>ID：</b>{{ selectedNode.id }}</div>
        <div><b>描述：</b>{{ selectedNode.desc }}</div>
      </div>
      <div v-else class="panel-content">点击节点查看详情</div>

      <div class="panel-meta">
        <div>知识条目：{{ metrics.entries }}</div>
        <div>类型节点：{{ metrics.types }}</div>
        <div>描述节点：{{ metrics.descs }}</div>
        <div>节点总数：{{ metrics.nodes }}</div>
        <div>边总数：{{ metrics.edges }}</div>
        <div>命中节点：{{ metrics.matched }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import Sigma from 'sigma'
import {
  buildKnowledgeGraphData,
  fetchAllKnowledges,
  normalizeKnowledgeList
} from '@/utils/knowledge'

const graphEl = ref(null)
const searchKeyword = ref('')
const selectedNode = ref(null)
const statusText = ref('准备加载...')
const metrics = ref({ entries: 0, types: 0, descs: 0, nodes: 0, edges: 0, matched: 0 })

let graph = null
let renderer = null
const highlightedNodeIds = new Set()
const highlightedEdgeIds = new Set()

function installReducers() {
  if (!renderer || !graph) return

  renderer.setSetting('nodeReducer', (node, data) => {
    if (highlightedNodeIds.size === 0) return data

    if (highlightedNodeIds.has(node)) {
      return {
        ...data,
        zIndex: 1,
        size: Math.max(data.size || 2, 4),
        color: '#FA541C'
      }
    }

    return {
      ...data,
      label: '',
      color: '#D9D9D9'
    }
  })

  renderer.setSetting('edgeReducer', (edge, data) => {
    if (highlightedNodeIds.size === 0) {
      return {
        ...data,
        hidden: false,
        color: data.color || '#D9D9D9'
      }
    }

    if (highlightedEdgeIds.has(edge)) {
      return {
        ...data,
        hidden: false,
        color: '#FA8C16',
        size: 1.1
      }
    }

    return {
      ...data,
      hidden: true
    }
  })
}

function applySearchHighlight() {
  if (!graph || !renderer) return

  const kw = searchKeyword.value.trim().toLowerCase()
  highlightedNodeIds.clear()
  highlightedEdgeIds.clear()

  if (!kw) {
    metrics.value = { ...metrics.value, matched: 0 }
    renderer.refresh()
    return
  }

  graph.forEachNode((node, attrs) => {
    const label = String(attrs.label || '').toLowerCase()
    const searchText = String(attrs.searchText || '').toLowerCase()
    const desc = String(attrs.desc || '').toLowerCase()
    if (label.includes(kw) || searchText.includes(kw) || desc.includes(kw)) {
      highlightedNodeIds.add(node)
    }
  })

  highlightedNodeIds.forEach(node => {
    graph.forEachEdge(node, edge => highlightedEdgeIds.add(edge))
  })

  metrics.value = { ...metrics.value, matched: highlightedNodeIds.size }
  renderer.refresh()
}

function resetCamera() {
  if (!renderer) return
  const camera = renderer.getCamera()
  camera.animatedReset({ duration: 350 })
}

function clearSearch() {
  searchKeyword.value = ''
  applySearchHighlight()
}

function initRenderer(newGraph) {
  if (renderer) {
    renderer.kill()
    renderer = null
  }

  graph = newGraph
  renderer = new Sigma(graph, graphEl.value, {
    renderEdgeLabels: false,
    renderLabels: true,
    labelDensity: 0.02,
    labelGridCellSize: 80,
    labelRenderedSizeThreshold: 10,
    minCameraRatio: 0.03,
    maxCameraRatio: 25,
    defaultEdgeType: 'line',
    allowInvalidContainer: false
  })

  installReducers()

  renderer.on('clickNode', ({ node }) => {
    const attrs = graph.getNodeAttributes(node)
    selectedNode.value = {
      id: attrs.id || node,
      label: attrs.label || '',
      kind: attrs.kind || '',
      desc: attrs.desc || ''
    }
  })

  renderer.on('clickStage', () => {
    selectedNode.value = null
  })
}

async function loadDataAndRender() {
  const rows = await fetchAllKnowledges(
    {},
    {
      errorText: '知识数据查询失败',
      onError(text, e) {
        console.error(text, e)
      }
    },
    {
      onProgress({ page }) {
        statusText.value = `正在查询知识库（第 ${page} 页）...`
      }
    }
  )
  if (!Array.isArray(rows) || rows.length === 0) {
    statusText.value = '接口失败或无数据'
    return
  }

  statusText.value = `接口返回 ${rows.length} 条，正在构建全量图...`
  const normalized = normalizeKnowledgeList(rows)
  const built = buildKnowledgeGraphData(normalized)
  initRenderer(built.graph)
  metrics.value = built.metrics

  statusText.value = `全量渲染完成：${built.metrics.nodes} 节点 / ${built.metrics.edges} 边`
}

onMounted(async () => {
  await loadDataAndRender()
})

onBeforeUnmount(() => {
  if (renderer) renderer.kill()
  renderer = null
  graph = null
})
</script>

<style scoped>
.kg-explorer {
  display: grid;
  grid-template-rows: 76px 1fr;
  grid-template-columns: 1fr 290px;
  grid-template-areas:
    "toolbar toolbar"
    "graph panel";
  width: 100%;
  height: 100%;
  gap: 10px;
  padding: 12px;
  box-sizing: border-box;
  background: var(--bgColor);
}

.toolbar {
  grid-area: toolbar;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 10px;
  padding: 10px 12px;
}

.title-wrap {
  min-width: 220px;
}

.title {
  color: var(--text-color);
  font-weight: 700;
  margin-bottom: 4px;
}

.status {
  font-size: 12px;
  color: var(--holder-color);
}

.controls {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  flex-wrap: wrap;
}

.input,
.btn {
  border: 1px solid var(--card-border);
  background: var(--subBgColor4);
  color: var(--text-color);
  border-radius: 8px;
  height: 32px;
  box-sizing: border-box;
}

.input {
  width: 280px;
  padding: 0 10px;
}

.btn {
  padding: 0 10px;
  cursor: pointer;
}

.graph {
  grid-area: graph;
  min-height: 0;
  border: 1px solid var(--card-border);
  border-radius: 12px;
  background: var(--card-bg);
  overflow: hidden;
}

.panel {
  grid-area: panel;
  border: 1px solid var(--card-border);
  border-radius: 12px;
  background: var(--card-bg);
  padding: 12px;
  color: var(--text-color);
  overflow: auto;
}

.panel-title {
  font-weight: 700;
  margin-bottom: 10px;
}

.panel-content {
  line-height: 1.6;
  color: var(--text-color);
  word-break: break-word;
}

.panel-meta {
  margin-top: 14px;
  padding-top: 10px;
  border-top: 1px dashed var(--card-border);
  color: var(--holder-color);
  font-size: 12px;
  line-height: 1.8;
}

@media (max-width: 1180px) {
  .kg-explorer {
    grid-template-rows: 112px 1fr 180px;
    grid-template-columns: 1fr;
    grid-template-areas:
      "toolbar"
      "graph"
      "panel";
  }

  .toolbar {
    flex-direction: column;
    align-items: flex-start;
  }

  .controls {
    justify-content: flex-start;
  }

  .input {
    width: 220px;
  }
}
</style>
