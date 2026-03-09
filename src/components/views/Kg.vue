<template>
  <div class='kg-explorer'>
    <div class='toolbar'>
      <div class='leftControls'>
        <div class='title'>知识图谱综合视图</div>
        <div class='status'>{{ statusText }}</div>
      </div>
      <div class='rightControls'>
        <input
          v-model.trim='searchKeyword'
          class='input'
          placeholder='查找：知识编号 / 描述 / 标签'
          type='text'
          @keyup.enter='applyFiltersAndRender'
        />
        <button class='btn' @click='applyFiltersAndRender'>
          查找
        </button>
        <button class='btn' @click='zoomIn'>放大</button>
        <button class='btn' @click='zoomOut'>缩小</button>
        <button class='btn' @click='resetCamera'>重置视角
        </button>
        <button class='btn' :class="{ active: isLayoutRunning }"
                @click='toggleLayout'>
          {{ isLayoutRunning ? '暂停物理' : '继续物理' }}
        </button>
        <button class='btn' :class="{ active: animationEnabled }"
                @click='toggleAnimation'>
          {{ animationEnabled ? '关闭动效' : '开启动效' }}
        </button>
      </div>
    </div>
    
    <div class='filterBar'>
      <div class='filterGroup'>
        <div class='groupTitle'>label 筛选</div>
        <UiCheckbox v-for='label in labelOptions' :key='label'
                    :model-value='selectedLabels.has(label)'
                    class='checkItem'
                    @change='toggleLabel(label)'>
          {{ label }}
        </UiCheckbox>
      </div>
      
      <div class='filterGroup'>
        <div class='groupTitle'>数据库类型</div>
        <UiCheckbox v-for='dbType in typeOptions' :key='dbType'
                    :model-value='selectedTypes.has(dbType)'
                    class='checkItem'
                    @change='toggleType(dbType)'>
          {{
              dbType === 'static' ? '内置' : '用户'
            }}
        </UiCheckbox>
      </div>
      
      <div class='filterGroup compact'>
        <div class='groupTitle'>显示控制</div>
        <UiCheckbox v-model='showNodeLabel' class='checkItem'
                    @change='refreshRender'>
          显示节点标签
        </UiCheckbox>
        <label class='colorItem'>
          主题色
          <input v-model='accentColor' type='color'
                 @change='refreshRender'>
        </label>
      </div>
    </div>
    
    <div ref='graphWrapEl' class='graphWrap' :class="{ loading: loadingOverlay.visible }">
      <div ref='graphEl' class='graph' :class="{ ready: graphReady }"></div>
      <canvas ref='fxCanvas' class='fxCanvas'></canvas>
      <transition name='fade'>
        <div v-if='loadingOverlay.visible' class='loadingOverlay'>
          <div class='loadingPanel'>
            <div class='loadingRing'></div>
            <div class='loadingTitle'>{{ loadingOverlay.title }}</div>
            <div class='loadingDetail'>{{ loadingOverlay.detail }}</div>
            <div class='progressTrack'>
              <div class='progressFill' :style="{ width: `${loadingOverlay.percent}%` }"></div>
            </div>
            <div class='progressText'>{{ loadingOverlay.percent }}%</div>
          </div>
        </div>
      </transition>
    </div>
    
    <div class='metaBar'>
      <div>命中条目: {{ metrics.entries }}</div>
      <div>渲染条目:
        {{ metrics.renderedEntries || metrics.entries }}
      </div>
      <div>节点: {{ metrics.nodes }}</div>
      <div>关系: {{ metrics.edges }}</div>
      <div v-if='selectedNodeId' class='focusTip'>
        <span>当前焦点: {{ selectedNodeLabel || selectedNodeId }}</span>
        <button class='closeFocusBtn' @click='clearSelection'>关闭</button>
      </div>
      <div>label种类: {{ metrics.labels }}</div>
      <div>库类型: {{ metrics.types }}</div>
      <div v-if='metrics.truncated' class='warn'>
        已启用性能截断
      </div>
      <div>方向键可平移画布，拖拽节点可调整布局</div>
    </div>
  </div>
</template>

<script setup>
import {nextTick, onBeforeUnmount, onMounted, ref} from 'vue';
import Sigma from 'sigma';
import FA2Layout from 'graphology-layout-forceatlas2/worker';
import forceAtlas2 from 'graphology-layout-forceatlas2';
import noverlap from 'graphology-layout-noverlap';
import EdgeCurveProgram from '@sigma/edge-curve';
import {
  DB_TYPE_OPTIONS,
  LABEL_OPTIONS,
  buildKnowledgeRelationGraphFromProjection,
  buildKnowledgeRelationGraphData,
  collectKnowledgeFacets,
  fetchAllKnowledges,
  normalizeKnowledgeList
} from '@/utils/knowledge.js';
import {
  computeGraphLayoutWithRust,
  computeGraphProjectionWithRust
} from '@/utils/tauriGraphLayout.js';
import UiCheckbox from '@/components/ui/UiCheckbox.vue';

const graphEl = ref(null);
const graphWrapEl = ref(null);
const fxCanvas = ref(null);
const searchKeyword = ref('');
const statusText = ref('准备加载...');
const metrics = ref({
  entries: 0,
  renderedEntries: 0,
  nodes: 0,
  edges: 0,
  labels: 0,
  types: 0,
  matched: 0,
  truncated: false
});
const showNodeLabel = ref(true);
const accentColor = ref('#1677ff');
const selectedNodeId = ref('');
const selectedNodeLabel = ref('');
const hoveredNodeId = ref('');
const isLayoutRunning = ref(false);
const animationEnabled = ref(true);
const graphReady = ref(false);
const loadingOverlay = ref({
  visible: false,
  title: '正在处理',
  detail: '初始化中...',
  percent: 0
});

const labelOptions = ref([...LABEL_OPTIONS]);
const typeOptions = ref([...DB_TYPE_OPTIONS]);

const selectedLabels = ref(new Set(LABEL_OPTIONS));
const selectedTypes = ref(new Set(DB_TYPE_OPTIONS));

const allRows = ref([]);
let graph = null;
let renderer = null;
let layoutRunner = null;
let layoutTimeout = null;
let draggingNode = null;
let draggingMoved = false;
let suppressClickUntil = 0;
let effectFrame = null;
let effectLastTs = 0;
const selectedNeighborSet = ref(new Set());
const hoverNeighborSet = ref(new Set());
const selectedEdgeSet = ref(new Set());
const hoverEdgeSet = ref(new Set());
const selectedEdgeSeedMap = ref(new Map());
const nodeRelationTypeMap = ref(new Map());
const RELATION_PULSE_COLORS = {
  relationship_fault: '#ff4d6d',
  relationship_reason: '#ff8a00',
  relationship_solution: '#6b5bff',
  relationship_component: '#bc5090',
  relationship_precaution: '#00a884',
  relationship_material: '#4f7cff',
  default: '#2db7f5'
};

const NOVERLAP_SETTINGS = {
  maxIterations: 30,
  ratio: 1.08,
  margin: 8,
  expansion: 1.04
};

function hexToRgb(hex) {
  const matched = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || '');
  if (!matched) return {r: 100, g: 100, b: 110};
  return {
    r: parseInt(matched[1], 16),
    g: parseInt(matched[2], 16),
    b: parseInt(matched[3], 16)
  };
}

function rgbToHex(r, g, b) {
  return `#${[r, g, b].map((v) => {
    const safe = Math.max(0, Math.min(255, Math.round(v)));
    const s = safe.toString(16);
    return s.length === 1 ? `0${s}` : s;
  }).join('')}`;
}

function dimColor(hex, amount = 0.2) {
  const rgb = hexToRgb(hex);
  const bg = {r: 16, g: 20, b: 28};
  return rgbToHex(
    bg.r + (rgb.r - bg.r) * amount,
    bg.g + (rgb.g - bg.g) * amount,
    bg.b + (rgb.b - bg.b) * amount
  );
}

function brightenColor(hex, factor = 1.35) {
  const rgb = hexToRgb(hex);
  return rgbToHex(
    rgb.r + (255 - rgb.r) * (factor - 1) / factor,
    rgb.g + (255 - rgb.g) * (factor - 1) / factor,
    rgb.b + (255 - rgb.b) * (factor - 1) / factor
  );
}

function getFA2Settings(nodeCount) {
  const isSmall = nodeCount < 500;
  const isMedium = nodeCount >= 500 && nodeCount < 2000;
  const isLarge = nodeCount >= 2000 && nodeCount < 10000;
  return {
    gravity: isSmall ? 0.72 : isMedium ? 0.44 : isLarge ? 0.28 : 0.14,
    scalingRatio: isSmall ? 22 : isMedium ? 40 : isLarge ? 68 : 100,
    slowDown: isSmall ? 1.2 : isMedium ? 2 : isLarge ? 3.5 : 5.2,
    barnesHutOptimize: nodeCount > 220,
    barnesHutTheta: isLarge ? 1 : 0.85,
    strongGravityMode: false,
    outboundAttractionDistribution: true,
    linLogMode: false,
    adjustSizes: true,
    edgeWeightInfluence: 1
  };
}

function getLayoutDuration(nodeCount) {
  if (nodeCount > 10000) return 16000;
  if (nodeCount > 5000) return 12000;
  if (nodeCount > 2000) return 10000;
  if (nodeCount > 1000) return 9000;
  return 7000;
}

function getInitialLayoutDuration(nodeCount) {
  if (nodeCount > 2500) return 5000;
  return getLayoutDuration(nodeCount);
}

function rebuildNeighborSet(nodeId, targetRef) {
  const next = new Set();
  if (graph && nodeId && graph.hasNode(nodeId)) {
    graph.forEachNeighbor(nodeId, (neighborId) => next.add(neighborId));
  }
  targetRef.value = next;
}

function hashCode(str) {
  let h = 0;
  for (let i = 0; i < str.length; i += 1) {
    h = ((h << 5) - h) + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function rebuildEdgeSets() {
  const selectedEdges = new Set();
  const hoverEdges = new Set();
  const edgeSeedMap = new Map();
  if (graph) {
    if (selectedNodeId.value && graph.hasNode(selectedNodeId.value)) {
      graph.forEachEdge(selectedNodeId.value, (edgeKey) => {
        const key = edgeKey.toString();
        selectedEdges.add(key);
        edgeSeedMap.set(key, (hashCode(key) % 360) / 360);
      });
    }
    if (hoveredNodeId.value && graph.hasNode(hoveredNodeId.value)) {
      graph.forEachEdge(hoveredNodeId.value, (edgeKey) => hoverEdges.add(edgeKey.toString()));
    }
  }
  selectedEdgeSet.value = selectedEdges;
  hoverEdgeSet.value = hoverEdges;
  selectedEdgeSeedMap.value = edgeSeedMap;
}

function getRelationColor(nodeId, fallback = '#2db7f5') {
  const relationType = nodeRelationTypeMap.value.get(nodeId) || 'default';
  return RELATION_PULSE_COLORS[relationType] || RELATION_PULSE_COLORS.default || fallback;
}

function ensureFxCanvasSize() {
  if (!graphWrapEl.value || !fxCanvas.value) return false;
  const rect = graphWrapEl.value.getBoundingClientRect();
  if (!rect.width || !rect.height) return false;
  const dpr = window.devicePixelRatio || 1;
  const targetW = Math.floor(rect.width * dpr);
  const targetH = Math.floor(rect.height * dpr);
  if (fxCanvas.value.width !== targetW || fxCanvas.value.height !== targetH) {
    fxCanvas.value.width = targetW;
    fxCanvas.value.height = targetH;
    fxCanvas.value.style.width = `${rect.width}px`;
    fxCanvas.value.style.height = `${rect.height}px`;
  }
  return {rect, dpr};
}

function clearFxCanvas() {
  if (!fxCanvas.value) return;
  const ctx = fxCanvas.value.getContext('2d');
  if (!ctx) return;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, fxCanvas.value.width, fxCanvas.value.height);
}

function drawRippleAtNode(ctx, nodeId, ts, isPrimary = false) {
  if (!renderer || !graph || !graph.hasNode(nodeId)) return;
  const attrs = graph.getNodeAttributes(nodeId);
  const point = renderer.graphToViewport({x: attrs.x, y: attrs.y});
  const color = getRelationColor(nodeId, attrs.color || accentColor.value);
  const base = Math.max(8, (attrs.size || 6) * 1.5);
  const progress = ((ts * 0.0008) + (hashCode(nodeId) % 97) / 97) % 1;
  const rings = isPrimary ? 3 : 2;
  for (let i = 0; i < rings; i += 1) {
    const local = (progress + i / rings) % 1;
    const radius = base + local * (isPrimary ? 42 : 28);
    const alpha = (1 - local) * (isPrimary ? 0.55 : 0.32);
    ctx.beginPath();
    ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
    ctx.lineWidth = isPrimary ? 2.2 : 1.4;
    ctx.strokeStyle = brightenColor(color, 1.15);
    ctx.globalAlpha = alpha;
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
}

function drawSelectedEdgeFlow(ctx, ts) {
  if (!renderer || !graph || !selectedEdgeSet.value.size) return;
  selectedEdgeSet.value.forEach((edgeKey) => {
    if (!graph.hasEdge(edgeKey)) return;
    const [source, target] = graph.extremities(edgeKey);
    if (!graph.hasNode(source) || !graph.hasNode(target)) return;
    const s = graph.getNodeAttributes(source);
    const t = graph.getNodeAttributes(target);
    const sp = renderer.graphToViewport({x: s.x, y: s.y});
    const tp = renderer.graphToViewport({x: t.x, y: t.y});
    const seed = selectedEdgeSeedMap.value.get(edgeKey) || 0;
    const p = ((ts * 0.00055) + seed) % 1;
    const q = 0.12;
    const x = sp.x + (tp.x - sp.x) * p;
    const y = sp.y + (tp.y - sp.y) * p;
    const nx = sp.x + (tp.x - sp.x) * Math.min(1, p + q);
    const ny = sp.y + (tp.y - sp.y) * Math.min(1, p + q);
    const ang = Math.atan2(ny - y, nx - x);
    const len = 8;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(ang);
    ctx.beginPath();
    ctx.moveTo(len, 0);
    ctx.lineTo(-len * 0.65, len * 0.42);
    ctx.lineTo(-len * 0.65, -len * 0.42);
    ctx.closePath();
    ctx.fillStyle = '#8ed0ff';
    ctx.globalAlpha = 0.9;
    ctx.fill();
    ctx.restore();
    ctx.globalAlpha = 1;
  });
}

function drawLabelPill(ctx, x, y, text, options = {}) {
  const content = String(text || '').trim();
  if (!content) return;
  const fontSize = options.fontSize || 12;
  const fontWeight = options.fontWeight || 600;
  const padX = options.padX || 8;
  const padY = options.padY || 5;
  const radius = options.radius || 7;
  ctx.font = `${fontWeight} ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
  const width = Math.ceil(ctx.measureText(content).width) + padX * 2;
  const height = fontSize + padY * 2;
  const left = Math.round(x - width / 2);
  const top = Math.round(y - height - 10);

  ctx.beginPath();
  ctx.roundRect(left, top, width, height, radius);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.96)';
  ctx.fill();
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.18)';
  ctx.stroke();

  ctx.fillStyle = '#111';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(content, x, top + height / 2 + 0.5);
}

function drawHoverNeighborLabels(ctx) {
  if (!renderer || !graph || !hoveredNodeId.value) return;
  const ids = [hoveredNodeId.value, ...Array.from(hoverNeighborSet.value).slice(0, 24)];
  ids.forEach((nodeId, idx) => {
    if (!graph.hasNode(nodeId)) return;
    const attrs = graph.getNodeAttributes(nodeId);
    const label = String(attrs?.label || '').trim();
    if (!label) return;
    const point = renderer.graphToViewport({x: attrs.x, y: attrs.y});
    drawLabelPill(ctx, point.x, point.y, label, {
      fontSize: idx === 0 ? 13 : 12,
      fontWeight: idx === 0 ? 700 : 600
    });
  });
}

function drawEffectFrame(ts = performance.now()) {
  if (!renderer || !graph || !animationEnabled.value) return;
  const frame = ensureFxCanvasSize();
  if (!frame) return;
  const ctx = fxCanvas.value.getContext('2d');
  if (!ctx) return;
  const {rect, dpr} = frame;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, rect.width, rect.height);
  const hasSelection = Boolean(selectedNodeId.value);
  const hasHover = Boolean(hoveredNodeId.value);
  if (!hasSelection && !hasHover) return;
  drawSelectedEdgeFlow(ctx, ts);
  if (hasSelection) drawRippleAtNode(ctx, selectedNodeId.value, ts, true);
  if (hasHover && hoveredNodeId.value !== selectedNodeId.value) {
    drawRippleAtNode(ctx, hoveredNodeId.value, ts, false);
  }
  if (hasHover) drawHoverNeighborLabels(ctx);
}

function stopAnimationLoop() {
  if (effectFrame) cancelAnimationFrame(effectFrame);
  effectFrame = null;
  clearFxCanvas();
}

function startAnimationLoop() {
  if (!animationEnabled.value) return;
  stopAnimationLoop();
  const animate = (ts) => {
    if (!renderer) return;
    const elapsed = ts - effectLastTs;
    if (elapsed >= 24) {
      drawEffectFrame(ts);
      effectLastTs = ts;
    }
    effectFrame = requestAnimationFrame(animate);
  };
  effectFrame = requestAnimationFrame(animate);
}

function toggleAnimation() {
  animationEnabled.value = !animationEnabled.value;
  if (!renderer) return;
  if (animationEnabled.value) {
    drawEffectFrame();
    if (selectedNodeId.value || hoveredNodeId.value) startAnimationLoop();
  }
  else {
    stopAnimationLoop();
    renderer.refresh();
  }
}

function computeNodeDominantRelationType() {
  const map = new Map();
  if (!graph) return map;
  graph.forEachNode((node) => {
    const counter = new Map();
    graph.forEachOutboundEdge(node, (_, attrs) => {
      const relType = attrs?.relType || 'default';
      counter.set(relType, (counter.get(relType) || 0) + 1);
    });
    graph.forEachInboundEdge(node, (_, attrs) => {
      const relType = attrs?.relType || 'default';
      counter.set(relType, (counter.get(relType) || 0) + 1);
    });
    let topType = 'default';
    let topCount = 0;
    counter.forEach((count, relType) => {
      if (count > topCount) {
        topCount = count;
        topType = relType;
      }
    });
    map.set(node, topType);
  });
  return map;
}

function getFilteredRowsForLayout() {
  const selectedLabelSet = selectedLabels.value;
  const selectedTypeSet = selectedTypes.value;
  const keyword = (searchKeyword.value || '').trim().toLowerCase();
  return allRows.value
    .filter((item) => {
      if (selectedLabelSet.size > 0 && !selectedLabelSet.has(item.label)) return false;
      if (selectedTypeSet.size > 0 && !selectedTypeSet.has(item.type)) return false;
      if (keyword && !String(item.searchText || '').toLowerCase().includes(keyword)) return false;
      return true;
    });
}

function updateLoading(percent, title, detail) {
  const safe = Math.max(0, Math.min(100, Math.round(percent)));
  if (title) loadingOverlay.value.title = title;
  if (detail) loadingOverlay.value.detail = detail;
  loadingOverlay.value.percent = safe;
}

function startLoading(title = '正在处理', detail = '请稍候...') {
  graphReady.value = false;
  loadingOverlay.value.visible = true;
  loadingOverlay.value.title = title;
  loadingOverlay.value.detail = detail;
  loadingOverlay.value.percent = 0;
}

function finishLoading(detail = '完成') {
  updateLoading(100, '渲染完成', detail);
  setTimeout(() => {
    loadingOverlay.value.visible = false;
    graphReady.value = true;
  }, 240);
}

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
  renderer.getCamera().animatedZoom({
    duration: 180,
    factor: 1.3
  });
}

function zoomOut() {
  if (!renderer) return;
  renderer.getCamera().animatedUnzoom({
    duration: 180,
    factor: 1.3
  });
}

function resetCamera() {
  if (!renderer) return;
  renderer.getCamera().animatedReset({duration: 300});
}

function refreshRender() {
  if (!renderer) return;
  renderer.refresh();
  if (animationEnabled.value && (selectedNodeId.value || hoveredNodeId.value)) drawEffectFrame();
}

function clearSelection() {
  selectedNodeId.value = '';
  selectedNodeLabel.value = '';
  selectedNeighborSet.value = new Set();
  rebuildEdgeSets();
  drawEffectFrame();
  if (!hoveredNodeId.value) stopAnimationLoop();
  renderer?.refresh();
}

function clearLayoutResources() {
  if (layoutTimeout) {
    clearTimeout(layoutTimeout);
    layoutTimeout = null;
  }
  if (layoutRunner) {
    layoutRunner.stop();
    layoutRunner.kill();
    layoutRunner = null;
  }
  isLayoutRunning.value = false;
}

function stopLayout(applyOverlapFix = true) {
  if (layoutTimeout) {
    clearTimeout(layoutTimeout);
    layoutTimeout = null;
  }
  if (layoutRunner) {
    layoutRunner.stop();
    layoutRunner.kill();
    layoutRunner = null;
  }
  if (applyOverlapFix && graph) {
    noverlap.assign(graph, NOVERLAP_SETTINGS);
    renderer?.refresh();
  }
  isLayoutRunning.value = false;
}

function runLayout(initial = false) {
  if (!graph || graph.order === 0 || !renderer) return;
  stopLayout(false);
  const settings = {
    ...forceAtlas2.inferSettings(graph),
    ...getFA2Settings(graph.order)
  };
  layoutRunner = new FA2Layout(graph, {settings});
  layoutRunner.start();
  isLayoutRunning.value = true;
  layoutTimeout = setTimeout(() => {
    stopLayout(true);
  }, initial ? getInitialLayoutDuration(graph.order) : getLayoutDuration(graph.order));
}

function toggleLayout() {
  if (isLayoutRunning.value) stopLayout(true);
  else runLayout(false);
}

function installReducers() {
  if (!renderer || !graph) return;
  renderer.setSetting('nodeReducer', (_, data) => {
    const next = {...data};
    const nodeId = _.toString();
    const isSelected = selectedNodeId.value && nodeId === selectedNodeId.value;
    const isSelectedNeighbor = selectedNeighborSet.value.has(nodeId);
    const isHovered = hoveredNodeId.value && nodeId === hoveredNodeId.value;
    const isHoverNeighbor = hoverNeighborSet.value.has(nodeId);
    const activeBaseColor = data.color || accentColor.value;

    const originalLabel = data.label || '';
    if (!showNodeLabel.value) next.label = '';

    if (isSelected) {
      next.size = (data.size || 6) * 1.9;
      next.zIndex = 5;
      next.color = brightenColor(activeBaseColor, 1.4);
      next.label = '';
      next.forceLabel = false;
      return next;
    }
    if (selectedNodeId.value && isSelectedNeighbor) {
      next.size = (data.size || 6) * 1.34;
      next.zIndex = 4;
      next.color = activeBaseColor;
      next.label = '';
      next.forceLabel = false;
      return next;
    }
    if (selectedNodeId.value && !isSelected && !isSelectedNeighbor) {
      next.size = (data.size || 6) * 0.62;
      next.color = dimColor(activeBaseColor, 0.22);
      next.zIndex = 1;
      return next;
    }

    if (isHovered) {
      next.size = (data.size || 6) * 1.45;
      next.zIndex = 4;
      next.color = brightenColor(activeBaseColor, 1.3);
      // Hover labels are rendered by overlay canvas pills to avoid duplicate text.
      next.label = '';
      next.forceLabel = false;
      return next;
    }
    if (hoveredNodeId.value && isHoverNeighbor) {
      next.size = (data.size || 6) * 1.18;
      next.zIndex = 3;
      next.color = activeBaseColor;
      next.label = '';
      next.forceLabel = false;
      return next;
    }
    if (hoveredNodeId.value && !isHoverNeighbor) {
      next.size = (data.size || 6) * 0.78;
      next.color = dimColor(activeBaseColor, 0.32);
      next.zIndex = 1;
      return next;
    }

    if (!data.color || data.dbType === 'unknown') next.color = accentColor.value;
    return next;
  });
  renderer.setSetting('edgeReducer', (edgeKey, data) => {
    const next = {...data};
    const edgeId = edgeKey.toString();
    const connectedToSelected = selectedEdgeSet.value.has(edgeId);
    const connectedToHovered = hoverEdgeSet.value.has(edgeId);

    if (selectedNodeId.value) {
      if (connectedToSelected) {
        next.size = Math.max(2.8, (data.size || 1) * 3.2);
        next.zIndex = 4;
        next.color = brightenColor(data.color || accentColor.value, 1.32);
      } else {
        next.size = 0.25;
        next.zIndex = 1;
        next.color = dimColor(data.color || accentColor.value, 0.08);
      }
      return next;
    }

    if (hoveredNodeId.value) {
      if (connectedToHovered) {
        next.size = Math.max(1.8, (data.size || 1) * 1.95);
        next.zIndex = 3;
        next.color = brightenColor(data.color || accentColor.value, 1.2);
      } else {
        next.size = Math.max(0.2, (data.size || 1) * 0.5);
        next.zIndex = 1;
        next.color = dimColor(data.color || accentColor.value, 0.24);
      }
      return next;
    }
    return next;
  });
}

function bindGraphEvents() {
  if (!renderer || !graph) return;

  renderer.on('enterNode', ({node}) => {
    hoveredNodeId.value = node;
    rebuildNeighborSet(node, hoverNeighborSet);
    rebuildEdgeSets();
    drawEffectFrame();
    if (animationEnabled.value && (selectedNodeId.value || hoveredNodeId.value)) startAnimationLoop();
    renderer.refresh();
  });

  renderer.on('leaveNode', () => {
    hoveredNodeId.value = '';
    hoverNeighborSet.value = new Set();
    rebuildEdgeSets();
    drawEffectFrame();
    if (!(selectedNodeId.value || hoveredNodeId.value)) stopAnimationLoop();
    renderer.refresh();
  });

  renderer.on('clickNode', ({node}) => {
    if (Date.now() < suppressClickUntil) return;
    selectedNodeId.value = node;
    if (graph?.hasNode(node)) {
      const attrs = graph.getNodeAttributes(node);
      selectedNodeLabel.value = attrs?.desc || attrs?.label || node;
    } else selectedNodeLabel.value = node;
    rebuildNeighborSet(node, selectedNeighborSet);
    rebuildEdgeSets();
    drawEffectFrame();
    if (animationEnabled.value) startAnimationLoop();
    renderer.refresh();
  });

  renderer.on('clickStage', () => {
    clearSelection();
  });

  renderer.on('downNode', ({node}) => {
    draggingNode = node;
    draggingMoved = false;
    stopLayout(false);
    if (!renderer.getCustomBBox()) renderer.setCustomBBox(renderer.getBBox());
  });

  const captor = renderer.getMouseCaptor();
  captor.on('mousemovebody', (e) => {
    if (!draggingNode || !graph) return;
    const pos = renderer.viewportToGraph(e);
    graph.setNodeAttribute(draggingNode, 'x', pos.x);
    graph.setNodeAttribute(draggingNode, 'y', pos.y);
    draggingMoved = true;
    if (animationEnabled.value && (selectedNodeId.value || hoveredNodeId.value)) drawEffectFrame();
    e.preventSigmaDefault();
    e.original.preventDefault();
    e.original.stopPropagation();
  });

  captor.on('mouseup', () => {
    if (!draggingNode) return;
    if (draggingMoved) suppressClickUntil = Date.now() + 220;
    draggingNode = null;
    draggingMoved = false;
    renderer.setCustomBBox(null);
    if (animationEnabled.value && (selectedNodeId.value || hoveredNodeId.value)) drawEffectFrame();
    renderer.refresh();
  });

  renderer.getCamera().on('updated', () => {
    if (animationEnabled.value && (selectedNodeId.value || hoveredNodeId.value)) drawEffectFrame();
  });
}

function onKeydown(e) {
  if (!renderer) return;
  const camera = renderer.getCamera();
  const state = camera.getState();
  const step = 0.15 / Math.max(0.3, state.ratio);
  if (e.key === 'ArrowUp') camera.setState({
    ...state,
    y: state.y - step
  });
  else if (e.key === 'ArrowDown') camera.setState({
    ...state,
    y: state.y + step
  });
  else if (e.key === 'ArrowLeft') camera.setState({
    ...state,
    x: state.x - step
  });
  else if (e.key === 'ArrowRight') camera.setState({
    ...state,
    x: state.x + step
  });
}

function initRenderer(newGraph) {
  clearLayoutResources();
  stopAnimationLoop();
  if (renderer) {
    renderer.kill();
    renderer = null;
  }
  
  graph = newGraph;
  selectedNodeId.value = '';
  selectedNodeLabel.value = '';
  hoveredNodeId.value = '';
  selectedNeighborSet.value = new Set();
  hoverNeighborSet.value = new Set();
  selectedEdgeSet.value = new Set();
  hoverEdgeSet.value = new Set();
  selectedEdgeSeedMap.value = new Map();
  renderer = new Sigma(graph, graphEl.value, {
    renderEdgeLabels: false,
    renderLabels: true,
    labelDensity: 0.035,
    labelGridCellSize: 80,
    labelRenderedSizeThreshold: 11,
    defaultEdgeType: 'curved',
    edgeProgramClasses: {
      curved: EdgeCurveProgram
    },
    minCameraRatio: 0.03,
    maxCameraRatio: 30,
    hideLabelsOnMove: true,
    hideEdgesOnMove: true,
    allowInvalidContainer: true,
    zIndex: true,
    defaultDrawNodeHover: () => {}
  });
  
  installReducers();
  bindGraphEvents();
  runLayout(true);
  drawEffectFrame();
  requestAnimationFrame(() => {
    if (renderer) renderer.refresh();
  });
}

async function applyFiltersAndRender() {
  if (!allRows.value.length) return;
  statusText.value = '正在构建图谱...';
  startLoading('正在构建知识图谱', '准备筛选数据...');
  
  try {
    const maxNodes = Math.max(allRows.value.length, 8000);
    const maxEdges = Math.min(maxNodes * 4, 24000);
    const selectedLabelList = Array.from(selectedLabels.value);
    const selectedTypeList = Array.from(selectedTypes.value);
    updateLoading(41, '正在构建知识图谱', '调用 Rust 构建节点与边...');
    let built = null;

    const projection = await computeGraphProjectionWithRust({
      rows: allRows.value,
      selectedLabels: selectedLabelList,
      selectedTypes: selectedTypeList,
      keyword: searchKeyword.value,
      maxNodes,
      maxEdges,
      includeGhostNodes: false
    });

    if (projection?.nodes && projection?.edges) {
      built = buildKnowledgeRelationGraphFromProjection(projection);
    } else {
      const layoutRows = getFilteredRowsForLayout().slice(0, maxNodes);
      updateLoading(44, '正在构建知识图谱', 'Rust 不可用，回退 JS 构图...');
      const rustLayout = await computeGraphLayoutWithRust(layoutRows);
      const layoutPositions = rustLayout?.positions && typeof rustLayout.positions === 'object'
        ? rustLayout.positions
        : null;
      const dominantRelTypes = rustLayout?.dominant_rel_types && typeof rustLayout.dominant_rel_types === 'object'
        ? rustLayout.dominant_rel_types
        : null;
      built = buildKnowledgeRelationGraphData(allRows.value, {
        selectedLabels: selectedLabelList,
        selectedTypes: selectedTypeList,
        keyword: searchKeyword.value,
        maxNodes,
        maxEdges,
        includeGhostNodes: false,
        layoutPositions,
        dominantRelTypes,
        onProgress(info) {
          const phaseText = {
            filter: '筛选知识条目...',
            nodes: '构建节点...',
            edges: '构建关系边...'
          };
          const detail = phaseText[info?.phase] || '处理中...';
          const percent = 35 + (Number(info?.percent) || 0) * 60;
          updateLoading(percent, '正在构建知识图谱', detail);
        }
      });
    }

    updateLoading(96, '正在渲染画布', '初始化渲染器...');
    await nextTick();
    initRenderer(built.graph);
    if (built?.dominantRelTypes && typeof built.dominantRelTypes === 'object') {
      nodeRelationTypeMap.value = new Map(Object.entries(built.dominantRelTypes));
    } else {
      nodeRelationTypeMap.value = computeNodeDominantRelationType();
    }
    renderer?.refresh();
    await nextTick();
    updateLoading(99, '正在渲染画布', '应用视觉效果...');
    metrics.value = built.metrics;
    statusText.value = built.metrics.truncated
      ? `渲染完成（性能模式）：${built.metrics.nodes} 节点 / ${built.metrics.edges} 关系`
      : `渲染完成：${built.metrics.nodes} 节点 / ${built.metrics.edges} 关系`;
    finishLoading(`${built.metrics.nodes} 节点 / ${built.metrics.edges} 关系`);
  } catch (e) {
    console.error(e);
    loadingOverlay.value.visible = false;
    statusText.value = `图谱渲染失败：${e?.message || '未知错误'}`;
  }
}

async function loadData() {
  startLoading('正在加载知识数据', '准备请求数据...');
  const rows = await fetchAllKnowledges(
    {},
    {
      errorText: '知识数据查询失败',
      onError(text, e) {
        console.error(text, e);
      }
    }, {
      onProgress() {
        statusText.value = '正在加载知识...';
        updateLoading(22, '正在加载知识数据', '正在拉取知识列表...');
      }
    }
  );
  
  if (!Array.isArray(rows) || rows.length === 0) {
    statusText.value = '无可用数据';
    return;
  }
  
  const normalized = normalizeKnowledgeList(rows);
  allRows.value = normalized;
  updateLoading(30, '正在加载知识数据', '正在规范化数据...');
  
  const facets = collectKnowledgeFacets(normalized);
  if (facets.labels.length > 0) {
    labelOptions.value = facets.labels;
    selectedLabels.value = new Set(facets.labels);
  }
  if (facets.types.length > 0) {
    typeOptions.value = facets.types;
    selectedTypes.value = new Set(facets.types);
  }
  updateLoading(34, '正在加载知识数据', '准备进入图谱渲染...');
  await applyFiltersAndRender();
}

onMounted(async () => {
  window.addEventListener('keydown', onKeydown);
  window.addEventListener('resize', refreshRender);
  try {
    await loadData();
  } catch (e) {
    console.error(e);
    statusText.value = `数据加载失败：${e?.message || '未知错误'}`;
  }
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown);
  window.removeEventListener('resize', refreshRender);
  stopAnimationLoop();
  clearLayoutResources();
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

.leftControls {
  min-width: 220px;
}

.title {
  font-weight: 800;
  color: var(--text-color);
}

.status {
  font-size: 12px;
  color: var(--holder-color);
}

.rightControls {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
}

.input, .btn {
  border: 1px solid var(--card-border);
  background: var(--subBgColor4);
  color: var(--text-color);
  border-radius: 8px;
  height: 32px;
  box-sizing: border-box;
}

.input {
  width: 260px;
  padding: 0 10px;
}

.btn {
  padding: 0 10px;
  cursor: pointer;
}

.btn.active {
  border-color: #1677ff;
  color: #1677ff;
  box-shadow: 0 0 0 1px rgba(22, 119, 255, 0.12) inset;
}

.filterBar {
  border: 1px solid var(--card-border);
  border-radius: 10px;
  background: var(--card-bg);
  padding: 8px 10px;
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: 8px;
}

.filterGroup {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}

.filterGroup.compact {
  justify-content: flex-end;
}

.groupTitle {
  font-size: 12px;
  color: var(--holder-color);
  margin-right: 4px;
}

.checkItem {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--text-color);
}

.colorItem {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--text-color);
}

.graphWrap {
  position: relative;
  border: 1px solid var(--card-border);
  border-radius: 12px;
  background:
    radial-gradient(circle at 52% 45%, rgba(124, 58, 237, 0.12) 0%, rgba(124, 58, 237, 0) 60%),
    linear-gradient(180deg, #06060a 0%, #0b0b12 100%);
  overflow: hidden;
}

.graphWrap.loading::before {
  content: '';
  position: absolute;
  inset: -20%;
  background: radial-gradient(circle at 30% 30%, rgba(22, 119, 255, 0.16), transparent 45%),
  radial-gradient(circle at 70% 70%, rgba(0, 168, 132, 0.14), transparent 42%);
  animation: bgPulse 2.8s ease-in-out infinite;
  pointer-events: none;
}

.graph {
  width: 100%;
  height: 100%;
  border: 1px solid color-mix(in oklab, var(--card-border) 60%, #2a2a3d);
  border-radius: 12px;
  opacity: 0;
  transform: scale(1.01);
  transition: opacity 0.35s ease, transform 0.35s ease;
}

.graph.ready {
  opacity: 1;
  transform: scale(1);
}

.fxCanvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 2;
}

.loadingOverlay {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  backdrop-filter: blur(4px);
  background: color-mix(in oklab, var(--bgColor) 72%, transparent);
  z-index: 3;
}

.loadingPanel {
  width: min(520px, calc(100% - 32px));
  border: 1px solid color-mix(in oklab, var(--card-border) 85%, #1677ff);
  border-radius: 14px;
  background: color-mix(in oklab, var(--card-bg) 88%, #e9f2ff);
  box-shadow: 0 14px 36px rgba(18, 40, 74, 0.18);
  padding: 20px;
}

.loadingRing {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 3px solid rgba(22, 119, 255, 0.18);
  border-top-color: #1677ff;
  animation: spin 0.9s linear infinite;
  margin-bottom: 10px;
}

.loadingTitle {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-color);
}

.loadingDetail {
  font-size: 12px;
  margin-top: 6px;
  color: var(--holder-color);
}

.progressTrack {
  margin-top: 14px;
  height: 10px;
  border-radius: 999px;
  overflow: hidden;
  background: color-mix(in oklab, var(--subBgColor4) 75%, #dbe8ff);
}

.progressFill {
  height: 100%;
  background: linear-gradient(90deg, #1677ff 0%, #2db7f5 60%, #00b89c 100%);
  border-radius: inherit;
  transition: width 0.24s ease;
  position: relative;
}

.progressFill::after {
  content: '';
  position: absolute;
  top: 0;
  left: -28%;
  width: 24%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.8), transparent);
  animation: shimmer 1.35s linear infinite;
}

.progressText {
  margin-top: 8px;
  font-weight: 700;
  color: #1677ff;
  font-size: 13px;
}

.metaBar {
  display: flex;
  gap: 14px;
  align-items: center;
  font-size: 12px;
  color: var(--holder-color);
}

.focusTip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.closeFocusBtn {
  border: 1px solid var(--card-border);
  background: var(--subBgColor4);
  color: var(--text-color);
  border-radius: 999px;
  height: 22px;
  padding: 0 8px;
  font-size: 11px;
  cursor: pointer;
}

.warn {
  color: #d46b08;
  font-weight: 700;
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.25s ease;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes shimmer {
  to {
    left: 108%;
  }
}

@keyframes bgPulse {
  0%, 100% {
    transform: translate3d(0, 0, 0) scale(1);
    opacity: 0.7;
  }
  50% {
    transform: translate3d(0, -2%, 0) scale(1.03);
    opacity: 1;
  }
}

@media (max-width: 1180px) {
  .kg-explorer {
    grid-template-rows: auto auto 1fr auto;
  }
  
  .toolbar, .filterBar, .metaBar {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }
  
  .rightControls, .filterGroup.compact {
    justify-content: flex-start;
  }
  
  .input {
    width: 220px;
  }
}
</style>
