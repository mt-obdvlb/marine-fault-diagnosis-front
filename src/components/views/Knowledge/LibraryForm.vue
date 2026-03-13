<template>
  <div class='panelArea'>
    <div v-show='loading' class='loading'>
      <img alt='' class='autoInvert'
           src='/icon/loading.svg'>
      导入中
    </div>
    
    <div class='formCard'>
      <div class='header'>
        <div>
          <div class='eyebrow'>Knowledge Import</div>
          <div class='title'>上传 JSONL 文件</div>
        </div>
        <div class='badge'>用户知识库导入</div>
      </div>
      
      <div class='desc'>
        这里只接收一个 <code>.jsonl</code> 文件，每行一个知识对象。
        前端不传来源分类，后端按用户导入处理。
      </div>
      
      <div
        :class="['dropZone', {active: dragActive}]"
        @click='openUpload'
        @dragenter.prevent='dragActive = true'
        @dragover.prevent='dragActive = true'
        @dragleave.prevent='dragActive = false'
        @drop.prevent='handleDrop'
      >
        <div class='dropIcon'>{ }</div>
        <div class='dropTitle'>拖拽 JSONL 到这里</div>
        <div class='dropSub'>或者点击选择文件</div>
        <div class='dropHint'>格式为每行一个 JSON 对象</div>
        <div v-if='selectedFileName' class='fileTag'>
          已选择：{{ selectedFileName }}
        </div>
      </div>
      
      <div class='tips'>
        <div>推荐字段：<code>identifier</code>、<code>label</code>、<code>desc</code></div>
        <div><code>relationships</code> 的值填写目标知识编号，例如 <code>R0001</code></div>
        <div>上传成功后会清理本地缓存，并通知知识列表重新拉取</div>
      </div>
      
      <div class='actions'>
        <div class='func primary buttonEffect'
             @click='openUpload'>选择 JSONL 文件
        </div>
        <div class='func buttonEffect' @click='buildIndex'>
          重建索引
        </div>
      </div>
      
      <input
        ref='fileSelector'
        accept='.jsonl,application/x-ndjson,application/jsonl,text/plain'
        class='hiddenInput'
        type='file'
        @change='handleInputChange'
      >
    </div>
  </div>
</template>

<script setup>
import {ref} from 'vue';
import eventBus from '@/utils/eventBus';
import api from '@/utils/api';
import {clearKnowledgeCache} from '@/utils/knowledge';

const loading = ref(false);
const dragActive = ref(false);
const selectedFileName = ref('');
const fileSelector = ref();

function openUpload() {
  fileSelector.value.value = '';
  fileSelector.value.click();
}

async function validateJsonlFile(file) {
  const lowerName = String(file?.name || '').toLowerCase();
  if (!lowerName.endsWith('.jsonl')) {
    throw new Error('仅支持上传 .jsonl 文件');
  }
  
  const text = await file.text();
  const lines = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  if (lines.length <= 0) {
    throw new Error('JSONL 文件内容为空');
  }
  
  lines.forEach((line, index) => {
    let row;
    try {
      row = JSON.parse(line);
    } catch (error) {
      throw new Error(`第 ${index + 1} 行不是合法的 JSON`);
    }
    if (!row || typeof row !== 'object' || Array.isArray(row)) {
      throw new Error(`第 ${index + 1} 行必须是 JSON 对象`);
    }
  });
}

async function importFile(file) {
  if (!file) return;
  loading.value = true;
  selectedFileName.value = file.name;
  
  try {
    await validateJsonlFile(file);
    const formData = new FormData();
    formData.append('file', file);
    const r = await api.knowledgeImport(formData, {
      errorText: `${file.name} 导入失败`,
      onError(text, e) {
        console.error(text, e);
        eventBus.emit('dialog', {text: `${file.name} 导入失败：${text}`});
      }
    });
    if (!r) return;
    clearKnowledgeCache();
    eventBus.emit('knowledge:refresh');
    eventBus.emit('dialog', {text: `${file.name} 导入完成，已刷新知识列表缓存`});
  } catch (error) {
    console.error(error);
    eventBus.emit('dialog', {text: error?.message || 'JSONL 导入失败'});
  } finally {
    loading.value = false;
  }
}

function handleInputChange(event) {
  const file = event.target.files?.[0];
  importFile(file);
}

function handleDrop(event) {
  dragActive.value = false;
  const file = event.dataTransfer?.files?.[0];
  importFile(file);
}

async function buildIndex() {
  loading.value = true;
  try {
    const r = await api.knowledgeBuildIndex({errorText: '索引重建失败'});
    if (!r) return;
    clearKnowledgeCache();
    eventBus.emit('knowledge:refresh');
    const info = r.data ? `\n已索引 ${r.data.indexed_count} 条，耗时 ${r.data.time_cost_ms} ms` : '';
    eventBus.emit('dialog', {text: `${r.message || '索引重建成功'}${info}`});
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.panelArea {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 10px;
  height: 100%;
}

.loading {
  position: absolute;
  inset: 0;
  background-color: rgba(125, 125, 125, 0.451);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 7;
}

.formCard {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 18px;
  border-radius: 18px;
  background: radial-gradient(circle at top right, rgba(0, 168, 132, 0.12), transparent 30%),
  linear-gradient(160deg, rgba(8, 44, 77, 0.08), rgba(14, 116, 144, 0.03)),
  var(--subBgColor);
}

.header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.eyebrow {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  opacity: 0.65;
}

.title {
  font-size: 26px;
  font-weight: 800;
  line-height: 1.2;
}

.badge {
  padding: 8px 12px;
  border-radius: 999px;
  background-color: rgba(0, 168, 132, 0.12);
  color: #0a7f67;
  font-size: 13px;
  font-weight: 700;
}

.desc {
  line-height: 1.8;
  opacity: 0.92;
}

.desc code,
.tips code {
  padding: 2px 6px;
  border-radius: 6px;
  background-color: rgba(0, 0, 0, 0.08);
}

.dropZone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 240px;
  padding: 24px;
  border: 2px dashed rgba(10, 127, 103, 0.35);
  border-radius: 20px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.45), rgba(255, 255, 255, 0.12)),
  radial-gradient(circle at center, rgba(0, 168, 132, 0.12), transparent 55%);
  text-align: center;
  cursor: pointer;
  transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
}

.dropZone.active {
  transform: translateY(-2px) scale(1.01);
  border-color: #0a7f67;
  box-shadow: 0 18px 40px rgba(10, 127, 103, 0.16);
}

.dropIcon {
  display: grid;
  place-items: center;
  width: 72px;
  height: 72px;
  border-radius: 18px;
  background: linear-gradient(135deg, #0a7f67, #10b981);
  color: #fff;
  font-size: 28px;
  font-weight: 800;
  box-shadow: 0 12px 24px rgba(16, 185, 129, 0.28);
}

.dropTitle {
  font-size: 22px;
  font-weight: 800;
}

.dropSub {
  font-size: 15px;
  opacity: 0.8;
}

.dropHint {
  font-size: 14px;
  opacity: 0.75;
}

.fileTag {
  margin-top: 6px;
  padding: 8px 12px;
  border-radius: 999px;
  background-color: rgba(10, 127, 103, 0.12);
  color: #0a7f67;
  font-weight: 700;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tips {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px;
  border-radius: 14px;
  background-color: var(--bgColor);
  line-height: 1.7;
}

.actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.func {
  padding: 10px 16px;
  border-radius: 12px;
  background-color: var(--bgColor);
  border: 1px solid var(--subBgColor);
  cursor: pointer;
  user-select: none;
}

.func.primary {
  background: linear-gradient(135deg, #0a7f67, #10b981);
  color: #fff;
  border-color: transparent;
}

.hiddenInput {
  display: none;
}

@media (max-width: 720px) {
  .title {
    font-size: 22px;
  }
  
  .dropZone {
    min-height: 200px;
    padding: 20px;
  }
}
</style>
