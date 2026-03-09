<template>
  <div class="kg-explorer">
    <div class="toolbar">
      <div class="leftControls">
        <div class="title">知识图谱综合视图</div>
        <div class="status">{{ statusText }}</div>
      </div>
      <div class="rightControls">
        <input
          v-model.trim="searchKeyword"
          class="input"
          type="text"
          placeholder="查找 identifier / label / desc"
          @keyup.enter="applyFiltersAndRender"
        />
        <button class="btn" @click="applyFiltersAndRender">查找</button>
        <button class="btn" @click="zoomIn">放大</button>
        <button class="btn" @click="zoomOut">缩小</button>
        <button class="btn" @click="resetCamera">重置视角</button>
        <select v-model.number="maxRenderNodes" class="input mini" @change="applyFiltersAndRender">
          <option :value="1000">1000 节点</option>
          <option :value="2000">2000 节点</option>
          <option :value="3000">3000 节点</option>
          <option :value="5000">5000 节点</option>
          <option :value="8000">8000 节点</option>
        </select>
      </div>
    </div>

    <div class="filterBar">
      <div class="filterGroup">
        <div class="groupTitle">label 筛选</div>
        <label v-for="label in labelOptions" :key="label" class="checkItem">
          <input type="checkbox" :checked="selectedLabels.has(label)" @change="toggleLabel(label)">
          <span>{{ label }}</span>
        </label>
      </div>

      <div class="filterGroup">
        <div class="groupTitle">数据库类型</div>
        <label v-for="dbType in typeOptions" :key="dbType" class="checkItem">
          <input type="checkbox" :checked="selectedTypes.has(dbType)" @change="toggleType(dbType)">
          <span>{{ dbType === 'static' ? '内置' : '用户' }}</span>
        </label>
      </div>

      <div class="filterGroup compact">
        <div class="groupTitle">显示控制</div>
        <label class="checkItem">
          <input type="checkbox" v-model="showNodeLabel" @change="refreshRender">
          <span>显示节点标签</span>
        </label>
        <label class="colorItem">
          主题色
          <input type="color" v-model="accentColor" @change="refreshRender">
        </label>
      </div>
    </div>

    <div ref="graphEl" class="graph"></div>

    <div class="metaBar">
      <div>命中条目: {{ metrics.entries }}</div>
      <div>渲染条目: {{ metrics.renderedEntries || metrics.entries }}</div>
      <div>节点: {{ metrics.nodes }}</div>
      <div>关系: {{ metrics.edges }}</div>
      <div>label种类: {{ metrics.labels }}</div>
      <div>库类型: {{ metrics.types }}</div>
      <div v-if="metrics.truncated" class="warn">已启用性能截断</div>
      <div>方向键可平移画布，拖拽节点可调整布局</div>
    </div>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue';
import Sigma from 'sigma';
import {
  DB_TYPE_OPTIONS,
  LABEL_OPTIONS,
  buildKnowledgeRelationGraphData,
  collectKnowledgeFacets,
  fetchAllKnowledges,
  normalizeKnowledgeList
} from '@/utils/knowledge';

const graphEl = ref(null);
const searchKeyword = ref('');
const statusText = ref('准备加载...');
const metrics = ref({ entries: 0, renderedEntries: 0, nodes: 0, edges: 0, labels: 0, types: 0, matched: 0, truncated: false });
const showNodeLabel = ref(true);
const accentColor = ref('#1677ff');
const maxRenderNodes = ref(3000);

const labelOptions = ref([...LABEL_OPTIONS]);
const typeOptions = ref([...DB_TYPE_OPTIONS]);

const selectedLabels = ref(new Set(LABEL_OPTIONS));
const selectedTypes = ref(new Set(DB_TYPE_OPTIONS));

const allRows = ref([]);
let graph = null;
let renderer = null;
let draggedNode = null;
let dragging = false;

function toggleLabel(label) {
  if (selectedLabels.value.has(label)) selectedLabels.value.delete(label);
  else selectedLabels.value.add(label);
  applyFiltersAndRender();
}

function toggleType(type) {
  if (selectedTypes.value.has(type)) selectedTypes.value.delete(type);
  else selectedTypes.value.add(type);
  applyFiltersAndRender();
}

function zoomIn() {
  if (!renderer) return;
  renderer.getCamera().animatedZoom({ duration: 180, factor: 1.3 });
}

function zoomOut() {
  if (!renderer) return;
  renderer.getCamera().animatedUnzoom({ duration: 180, factor: 1.3 });
}

function resetCamera() {
  if (!renderer) return;
  renderer.getCamera().animatedReset({ duration: 300 });
}

function refreshRender() {
  if (!renderer) return;
  renderer.refresh();
}

function installReducers() {
  if (!renderer || !graph) return;
  renderer.setSetting('nodeReducer', (_, data) => {
    const next = { ...data };
    if (!showNodeLabel.value) next.label = '';
    if (!data.color || data.type === 'unknown') next.color = accentColor.value;
    return next;
  });
  renderer.setSetting('edgeReducer', (_, data) => ({
    ...data,
    color: accentColor.value
  }));
}

function installDragAndKeys() {
  if (!renderer || !graph) return;

  renderer.on('downNode', ({ node, event }) => {
    dragging = true;
    draggedNode = node;
    const camera = renderer.getCamera();
    camera.disable();
    if (event?.original) event.original.preventDefault();
  });

  renderer.getMouseCaptor().on('mousemovebody', e => {
    if (!dragging || !draggedNode) return;
    const pos = renderer.viewportToGraph({ x: e.x, y: e.y });
    graph.setNodeAttribute(draggedNode, 'x', pos.x);
    graph.setNodeAttribute(draggedNode, 'y', pos.y);
    e.preventSigmaDefault();
    if (e.original) {
      e.original.preventDefault();
      e.original.stopPropagation();
    }
  });

  renderer.getMouseCaptor().on('mouseup', () => {
    if (!dragging) return;
    dragging = false;
    draggedNode = null;
    renderer.getCamera().enable();
  });
}

function onKeydown(e) {
  if (!renderer) return;
  const camera = renderer.getCamera();
  const state = camera.getState();
  const step = 0.15 / Math.max(0.3, state.ratio);
  if (e.key === 'ArrowUp') camera.setState({ ...state, y: state.y - step });
  else if (e.key === 'ArrowDown') camera.setState({ ...state, y: state.y + step });
  else if (e.key === 'ArrowLeft') camera.setState({ ...state, x: state.x - step });
  else if (e.key === 'ArrowRight') camera.setState({ ...state, x: state.x + step });
}

function initRenderer(newGraph) {
  if (renderer) {
    renderer.kill();
    renderer = null;
  }

  graph = newGraph;
  renderer = new Sigma(graph, graphEl.value, {
    renderEdgeLabels: false,
    renderLabels: true,
    labelDensity: 0.01,
    labelGridCellSize: 80,
    labelRenderedSizeThreshold: 12,
    defaultEdgeType: 'line',
    minCameraRatio: 0.03,
    maxCameraRatio: 30,
    hideLabelsOnMove: true,
    hideEdgesOnMove: true,
    allowInvalidContainer: false
  });

  installReducers();
  installDragAndKeys();
}

async function applyFiltersAndRender() {
  if (!allRows.value.length) return;
  statusText.value = '正在构建图谱...';

  const built = buildKnowledgeRelationGraphData(allRows.value, {
    selectedLabels: Array.from(selectedLabels.value),
    selectedTypes: Array.from(selectedTypes.value),
    keyword: searchKeyword.value,
    maxNodes: maxRenderNodes.value,
    maxEdges: maxRenderNodes.value * 5,
    includeGhostNodes: false
  });

  initRenderer(built.graph);
  metrics.value = built.metrics;
  statusText.value = built.metrics.truncated
    ? `渲染完成（性能模式）：${built.metrics.nodes} 节点 / ${built.metrics.edges} 关系`
    : `渲染完成：${built.metrics.nodes} 节点 / ${built.metrics.edges} 关系`;
}

async function loadData() {
  const rows = await fetchAllKnowledges(
    {},
    {
      errorText: '知识数据查询失败',
      onError(text, e) {
        console.error(text, e);
      }
    },
    {
      onProgress({ page }) {
        statusText.value = `正在加载知识（第 ${page} 页）...`;
      }
    }
  );

  if (!Array.isArray(rows) || rows.length === 0) {
    statusText.value = '无可用数据';
    return;
  }

  const normalized = normalizeKnowledgeList(rows);
  allRows.value = normalized;

  const facets = collectKnowledgeFacets(normalized);
  if (facets.labels.length > 0) {
    labelOptions.value = facets.labels;
    selectedLabels.value = new Set(facets.labels);
  }
  if (facets.types.length > 0) {
    typeOptions.value = facets.types;
    selectedTypes.value = new Set(facets.types);
  }

  await applyFiltersAndRender();
}

onMounted(async () => {
  window.addEventListener('keydown', onKeydown);
  await loadData();
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown);
  if (renderer) renderer.kill();
  renderer = null;
  graph = null;
});
</script>

<style scoped>
.kg-explorer {
  display: grid;
  grid-template-rows: 64px auto 1fr 36px;
  gap: 8px;
  width: 100%;
  height: 100%;
  padding: 10px;
  box-sizing: border-box;
  background: var(--bgColor);
}
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  border: 1px solid var(--card-border);
  border-radius: 10px;
  background: var(--card-bg);
  padding: 8px 10px;
}
.leftControls { min-width: 220px; }
.title { font-weight: 800; color: var(--text-color); }
.status { font-size: 12px; color: var(--holder-color); }
.rightControls { display: flex; flex-wrap: wrap; gap: 8px; justify-content: flex-end; }
.input, .btn {
  border: 1px solid var(--card-border);
  background: var(--subBgColor4);
  color: var(--text-color);
  border-radius: 8px;
  height: 32px;
  box-sizing: border-box;
}
.input { width: 260px; padding: 0 10px; }
.input.mini { width: 116px; }
.btn { padding: 0 10px; cursor: pointer; }
.filterBar {
  border: 1px solid var(--card-border);
  border-radius: 10px;
  background: var(--card-bg);
  padding: 8px 10px;
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: 8px;
}
.filterGroup { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }
.filterGroup.compact { justify-content: flex-end; }
.groupTitle { font-size: 12px; color: var(--holder-color); margin-right: 4px; }
.checkItem { display: inline-flex; align-items: center; gap: 4px; font-size: 12px; color: var(--text-color); }
.colorItem { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text-color); }
.graph {
  border: 1px solid var(--card-border);
  border-radius: 12px;
  background: var(--card-bg);
  overflow: hidden;
}
.metaBar {
  display: flex;
  gap: 14px;
  align-items: center;
  font-size: 12px;
  color: var(--holder-color);
}
.warn { color: #d46b08; font-weight: 700; }
@media (max-width: 1180px) {
  .kg-explorer { grid-template-rows: auto auto 1fr auto; }
  .toolbar, .filterBar, .metaBar { display: flex; flex-direction: column; align-items: flex-start; }
  .rightControls, .filterGroup.compact { justify-content: flex-start; }
  .input { width: 220px; }
}
</style>
