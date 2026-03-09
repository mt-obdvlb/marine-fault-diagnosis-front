<template>
    <div class="panelArea">
        <div v-show="loading" class="loading">
            <img class="autoInvert" src="/icon/loading.svg" alt="">
            处理中
        </div>

        <div class="formCard">
            <div class="row">
                <select v-model="form.label" class="input">
                    <option v-for="label in labelOptions" :key="label" :value="label">{{ label }}</option>
                </select>
                <input v-model.trim="form.identifier" class="input" type="text" placeholder="知识编号，例如：R0437">
                <select v-model="form.type" class="input small">
                    <option v-for="dbType in DB_TYPE_OPTIONS" :key="dbType.value" :value="dbType.value">{{ dbType.text }}</option>
                </select>
            </div>

            <textarea
                v-model.trim="form.desc"
                class="textarea"
                placeholder="知识描述，例如：控制设备接线错误"
            ></textarea>

            <div class="relationCard">
                <div class="relationTitle">关系指向（可选）</div>
                <div class="relationGrid">
                    <div v-for="item in relationOptions" :key="item.key" class="relationItem">
                        <div class="relationLabel">{{ item.label }} ({{ item.key }})</div>
                        <input
                            v-model.trim="form.relationships[item.key]"
                            class="input"
                            type="text"
                            :placeholder="`目标知识编号，例如：${item.example}`"
                        >
                    </div>
                </div>
            </div>

            <div class="actions">
                <div class="func buttonEffect" @click="addKnowledge">新增知识条目</div>
                <div class="func buttonEffect" @click="openUpload">批量导入</div>
                <div class="func buttonEffect" @click="buildIndex">重建索引</div>
                <input type="file" ref="fileSelector" class="hiddenInput" accept=".txt,.jsonl,.pdf" multiple @change="importFiles">
            </div>

            <div class="row compact">
                <select v-model="uploadMeta.type" class="input small">
                    <option v-for="dbType in DB_TYPE_OPTIONS" :key="dbType.value" :value="dbType.value">{{ dbType.text }}</option>
                </select>
                <select v-model="uploadMeta.label" class="input">
                    <option value="">导入默认标签（可选）</option>
                    <option v-for="label in labelOptions" :key="label" :value="label">{{ label }}</option>
                </select>
            </div>
        </div>
    </div>
</template>

<script setup>
import { reactive, ref } from 'vue';
import eventBus from '@/utils/eventBus';
import api from '@/utils/api';
import { LABEL_OPTIONS, RELATION_TARGET_LABEL } from '@/utils/knowledge';

const loading = ref(false);
const fileSelector = ref();
const labelOptions = LABEL_OPTIONS;
const DB_TYPE_OPTIONS = [
    { value: 'dynamic', text: '用户库' },
    { value: 'static', text: '内置库' }
];
const relationOptions = Object.entries(RELATION_TARGET_LABEL).map(([key, label]) => ({
    key,
    label,
    example: key === 'relationship_solution' ? 'S0437' : 'C0437'
}));

function createEmptyForm() {
    return {
        label: '故障原因',
        identifier: '',
        desc: '',
        type: 'dynamic',
        relationships: {
            relationship_fault: '',
            relationship_reason: '',
            relationship_solution: '',
            relationship_component: '',
            relationship_precaution: '',
            relationship_material: ''
        }
    };
}

const form = reactive(createEmptyForm());

const uploadMeta = reactive({
    type: 'dynamic',
    label: ''
});

function resetForm() {
    const next = createEmptyForm();
    Object.assign(form, next);
}

async function addKnowledge() {
    if (!form.identifier || !form.desc || !form.label) {
        eventBus.emit('dialog', { text: '请填写标签、知识编号和知识描述' });
        return;
    }

    const relationships = {};
    Object.entries(form.relationships).forEach(([key, value]) => {
        const text = String(value || '').trim();
        if (text) relationships[key] = text;
    });

    const payload = {
        label: form.label,
        identifier: form.identifier,
        desc: form.desc,
        type: form.type,
        relationships,
        // 兼容旧字段
        name: `${form.label}-${form.identifier}`,
        category: form.label,
        equipment: form.label
    };

    loading.value = true;
    try {
        const r = await api.knowledgeAdd(payload, { errorText: '新增知识失败' });
        if (!r) return;
        eventBus.emit('dialog', { text: r.message || '知识条目添加成功' });
        resetForm();
    } finally {
        loading.value = false;
    }
}

function openUpload() {
    fileSelector.value.value = '';
    fileSelector.value.click();
}

async function importFiles(event) {
    const files = [...(event.target.files || [])];
    if (files.length <= 0) return;

    loading.value = true;
    try {
        const results = await Promise.all(files.map(async (file) => {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('type', uploadMeta.type);
            if (uploadMeta.label) formData.append('label', uploadMeta.label);
            return api.knowledgeImport(formData, {
                errorText: `${file.name} 导入失败`,
                onError(text, e) {
                    console.error(text, e);
                    eventBus.emit('dialog', { text: `${file.name} 导入失败：${text}` });
                }
            });
        }));

        if (results.some(Boolean)) {
            eventBus.emit('dialog', { text: '文件导入完成，建议执行一次重建索引' });
        }
    } finally {
        loading.value = false;
    }
}

async function buildIndex() {
    loading.value = true;
    try {
        const r = await api.knowledgeBuildIndex({ errorText: '索引重建失败' });
        if (!r) return;
        const info = r.data ? `\n已索引 ${r.data.indexed_count} 条，耗时 ${r.data.time_cost_ms} ms` : '';
        eventBus.emit('dialog', { text: `${r.message || '索引重建成功'}${info}` });
    } finally {
        loading.value = false;
    }
}
</script>

<style scoped>
.panelArea{
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 10px;
    height: 100%;
}
.loading{
    position: absolute;
    inset: 0;
    background-color: rgba(125, 125, 125, 0.451);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 7;
}
.formCard{
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 12px;
    border-radius: 14px;
    background-color: var(--subBgColor);
}
.row{
    display: flex;
    gap: 10px;
}
.row.compact .input{
    max-width: 220px;
}
.input,
.textarea{
    box-sizing: border-box;
    border: 1px solid var(--subBgColor);
    border-radius: 10px;
    background-color: var(--bgColor);
    color: var(--text-color);
    padding: 10px 12px;
    font-size: 14px;
}
.input{
    flex: 1;
}
.input.small{
    max-width: 140px;
}
.textarea{
    width: 100%;
    min-height: 120px;
    resize: vertical;
}
.relationCard{
    padding: 10px;
    border-radius: 12px;
    background-color: var(--bgColor);
    border: 1px solid var(--subBgColor);
}
.relationTitle{
    font-weight: 700;
    margin-bottom: 8px;
}
.relationGrid{
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
}
.relationItem{
    display: flex;
    flex-direction: column;
    gap: 6px;
}
.relationLabel{
    font-size: 12px;
    color: var(--holder-color);
}
.actions{
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}
.func{
    background-color: var(--bgColor);
    border: 1px solid var(--subBgColor);
    border-radius: 9px;
    padding: 8px 14px;
    font-size: 14px;
}
.hiddenInput{
    display: none;
}
@media (max-width: 900px){
    .row,
    .relationGrid{
        display: flex;
        flex-direction: column;
    }
    .input.small{
        max-width: none;
    }
}
</style>
