<template>
    <div class="panelArea">
        <div v-show="loading" class="loading">
            <img class="autoInvert" src="/icon/loading.svg" alt="">
            加载中
        </div>

        <div class="toolbar formCard">
            <div class="row">
                <input v-model.trim="form.name" class="input" type="text" placeholder="知识名称，例如：主机启动困难">
                <input v-model.trim="form.equipment" class="input" type="text" placeholder="所属装备，例如：主推进发动机">
                <input v-model.trim="form.category" class="input" type="text" placeholder="分类，例如：故障案例">
            </div>
            <textarea v-model.trim="form.desc" class="textarea" placeholder="输入故障现象、可能原因、排查步骤、处理建议等正文内容"></textarea>
            <div class="actions">
                <div class="func buttonEffect" @click="addKnowledge">新增知识</div>
                <div class="func buttonEffect" @click="openUpload">批量导入</div>
                <div class="func buttonEffect" @click="buildIndex">重建索引</div>
                <input type="file" ref="fileSelector" class="hiddenInput" accept=".txt,.jsonl,.pdf" multiple @change="importFiles">
            </div>
            <div class="row compact">
                <input v-model.trim="uploadMeta.equipment" class="input" type="text" placeholder="导入文件所属装备">
                <input v-model.trim="uploadMeta.category" class="input" type="text" placeholder="导入分类（可选）">
            </div>
        </div>

        <div class="funcs">
            <div class="funcSearch">
                <div class="text buttonEffect" @click="reloadItems">刷新列表</div>
                <input class="input" type="text" v-model.trim="query.keyword" @keyup.enter="reloadItems" placeholder="关键词搜索知识名称">
            </div>
            <input class="filterInput" type="text" v-model.trim="query.equipment" @keyup.enter="reloadItems" placeholder="按装备筛选">
        </div>

        <div class="items">
            <table border="1" cellspacing="0">
                <thead style="position:sticky;top:0;background-color:var(--bgColor);z-index:5;">
                    <tr>
                        <th width="70px">ID</th>
                        <th width="180px">名称</th>
                        <th width="140px">装备</th>
                        <th width="120px">分类</th>
                        <th>内容摘要</th>
                        <th width="110px">来源文件</th>
                        <th width="55px">操作</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="item in items" :key="item.id">
                        <td :title="String(item.id)">{{ item.id }}</td>
                        <td :title="item.name">{{ item.name }}</td>
                        <td :title="item.equipment">{{ item.equipment || '-' }}</td>
                        <td :title="item.category">{{ item.category || '-' }}</td>
                        <td class="descCell" :title="item.desc">{{ item.desc }}</td>
                        <td :title="item.source_file">{{ item.source_file || '-' }}</td>
                        <td>
                            <div class="delBtn buttonEffect" @click="delItem(item)">删除</div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div class="footer">
            <div>共 {{ total }} 条知识</div>
        </div>
    </div>
</template>

<script setup>
import { reactive, ref } from 'vue';
import eventBus from '@/utils/eventBus';
import { settings } from '@/utils/Settings';
import api from '@/utils/api';
import { filterKnowledgesByEquipment, normalizeKnowledgeList } from '@/utils/knowledge';

const loading = ref(false);
const items = ref([]);
const total = ref(0);
const fileSelector = ref();

const query = reactive({
    equipment: '',
    keyword: '',
    page: 1,
    page_size: 100
});

const form = reactive({
    name: '',
    equipment: '',
    category: '',
    desc: ''
});

const uploadMeta = reactive({
    equipment: '',
    category: ''
});

async function reloadItems() {
    loading.value = true;
    try {
        const r = await api.knowledgeList(query, { errorText: '知识库列表获取失败，请刷新重试' });
        if (!r) return;
        const normalized = normalizeKnowledgeList(r.data?.items || []);
        const filtered = filterKnowledgesByEquipment(normalized, query.equipment);
        total.value = filtered.length;
        items.value = filtered;
    } finally {
        loading.value = false;
    }
}

async function addKnowledge() {
    if (!form.name || !form.equipment || !form.desc) {
        eventBus.emit('dialog', { text: '请填写知识名称、所属装备和正文内容' });
        return;
    }
    loading.value = true;
    try {
        const r = await api.knowledgeAdd(form, { errorText: '新增知识失败' });
        if (!r) return;
        eventBus.emit('dialog', { text: r.message || '知识条目添加成功' });
        form.name = '';
        form.equipment = '';
        form.category = '';
        form.desc = '';
        await reloadItems();
    } finally {
        loading.value = false;
    }
}

function openUpload() {
    if (!uploadMeta.equipment) {
        eventBus.emit('dialog', { text: '请先填写导入文件所属装备' });
        return;
    }
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
            formData.append('equipment', uploadMeta.equipment);
            if (uploadMeta.category) formData.append('category', uploadMeta.category);
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
            await reloadItems();
        }
    } finally {
        loading.value = false;
    }
}

function delItem(item) {
    const run = async () => {
        loading.value = true;
        try {
            const r = await api.knowledgeDelete(item.id, { errorText: `${item.name} 删除失败` });
            if (!r) return;
            eventBus.emit('dialog', { text: r.message || '删除成功' });
            await reloadItems();
        } finally {
            loading.value = false;
        }
    };

    if (settings.comfBefDelKnow) {
        eventBus.emit('dialog', {
            text: '确定删除该条知识吗？',
            onYes(checkVal) {
                settings.comfBefDelKnow = checkVal;
                run();
            },
            checkText: '每次删除都提示确认',
            checkVal: true,
            type: 'yes_no'
        });
        return;
    }

    run();
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

reloadItems();
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
    gap: 10px;
    padding: 12px;
    border-radius: 14px;
    background-color: var(--subBgColor);
}
.row{
    display: flex;
    gap: 10px;
}
.row.compact .input{
    max-width: 280px;
}
.input,
.textarea,
.filterInput{
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
.textarea{
    min-height: 110px;
    resize: vertical;
}
.actions{
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
}
.funcs{
    display: flex;
    gap: 10px;
    min-height: 50px;
}
.func,
.funcSearch .text{
    padding: 10px 14px;
    border-radius: 10px;
    background-color: var(--bgColor);
    border: 1px solid var(--subBgColor);
    white-space: nowrap;
}
.funcSearch{
    flex: 1;
    display: flex;
    background-color: var(--bgColor);
    border: 1px solid var(--subBgColor);
    border-radius: 10px;
    overflow: hidden;
}
.funcSearch .input{
    border: none;
    border-radius: 0;
}
.filterInput{
    width: 220px;
}
.hiddenInput{
    display: none;
}
.items{
    flex: 1;
    overflow: auto;
}
.items table{
    width: 100%;
    border: 1px solid var(--subBgColor);
    border-collapse: collapse;
}
.items th,
.items td{
    box-sizing: border-box;
    padding: 10px;
    font-size: 14px;
    vertical-align: top;
}
.descCell{
    min-width: 320px;
    max-width: 0;
    white-space: pre-wrap;
    word-break: break-word;
}
.delBtn{
    color: rgb(255, 70, 70);
    border: 1px solid rgb(255, 70, 70);
    border-radius: 8px;
    text-align: center;
    padding: 4px 0;
}
.footer{
    display: flex;
    justify-content: flex-end;
    padding: 8px 4px 0;
    color: var(--holder-color);
}
@media (max-width: 900px) {
    .row,
    .funcs{
        flex-direction: column;
    }
    .filterInput{
        width: 100%;
    }
}
</style>
