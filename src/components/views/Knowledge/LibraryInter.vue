<template>
    <div class="panelArea">
        <div v-show="loading" class="loading">
            <img class="autoInvert" src="/icon/loading.svg" alt="">
            加载中
        </div>

        <div class="heroCard">
            <div class="heroTitle">船舶故障知识库概览</div>
            <div class="heroText">统一查看知识条目数量、装备过滤条件和图谱总览入口，便于维护 RAG 检索基础数据。</div>
            <div class="heroStats">
                <div class="stat">
                    <div class="num">{{ total }}</div>
                    <div class="label">知识条目</div>
                </div>
                <div class="stat">
                    <div class="num">{{ overview.node_count ?? '-' }}</div>
                    <div class="label">图谱节点</div>
                </div>
                <div class="stat">
                    <div class="num">{{ overview.relation_count ?? '-' }}</div>
                    <div class="label">图谱关系</div>
                </div>
            </div>
        </div>

        <div class="funcs">
            <div class="funcSearch">
                <div class="text buttonEffect" @click="reloadData">检索知识</div>
                <input class="input" type="text" v-model.trim="query.keyword" @keyup.enter="reloadData" placeholder="输入知识名称关键词">
            </div>
            <input class="filterInput" type="text" v-model.trim="query.equipment" @keyup.enter="reloadData" placeholder="按装备类型过滤">
        </div>

        <div class="summaryGrid">
            <div class="summaryCard">
                <div class="cardTitle">节点类型分布</div>
                <div class="pillWrap">
                    <div v-for="item in overview.node_types || []" :key="item.type" class="pill">{{ item.label }} · {{ item.count }}</div>
                </div>
            </div>
            <div class="summaryCard">
                <div class="cardTitle">关系类型分布</div>
                <div class="pillWrap">
                    <div v-for="item in overview.relation_types || []" :key="item.type" class="pill">{{ item.label }} · {{ item.count }}</div>
                </div>
            </div>
        </div>

        <div class="items">
            <table border="1" cellspacing="0">
                <thead style="position:sticky;top:0;background-color:var(--bgColor);z-index:5;">
                    <tr>
                        <th width="70px">ID</th>
                        <th width="180px">名称</th>
                        <th width="140px">装备</th>
                        <th width="120px">分类</th>
                        <th>摘要</th>
                        <th width="120px">创建时间</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="item in items" :key="item.id">
                        <td>{{ item.id }}</td>
                        <td :title="item.name">{{ item.name }}</td>
                        <td :title="item.equipment">{{ item.equipment || '-' }}</td>
                        <td :title="item.category">{{ item.category || '-' }}</td>
                        <td class="descCell" :title="item.desc">{{ item.desc }}</td>
                        <td>{{ item.created_at || '-' }}</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>

<script setup>
import { reactive, ref } from 'vue';
import {
    buildKnowledgeOverview,
    fetchAllKnowledges,
    filterKnowledgesByEquipment,
    normalizeKnowledgeList
} from '@/utils/knowledge';

const loading = ref(false);
const total = ref(0);
const items = ref([]);
const overview = ref({});

const query = reactive({
    equipment: '',
    keyword: '',
    page: 1,
    page_size: 50
});

async function reloadData() {
    loading.value = true;
    try {
        const rows = await fetchAllKnowledges(
            { keyword: query.keyword },
            { errorText: '知识列表获取失败' }
        );
        if (!rows) return;

        const normalized = normalizeKnowledgeList(rows);
        const filtered = filterKnowledgesByEquipment(normalized, query.equipment);

        total.value = filtered.length;
        items.value = filtered.slice(0, query.page_size);
        overview.value = buildKnowledgeOverview(filtered);
    } finally {
        loading.value = false;
    }
}

reloadData();
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
.heroCard{
    padding: 18px;
    border-radius: 18px;
    background: linear-gradient(135deg, rgba(13, 59, 102, 0.94), rgba(0, 119, 182, 0.9));
    color: #fff;
}
.heroTitle{
    font-size: 24px;
    font-weight: 800;
}
.heroText{
    margin-top: 8px;
    line-height: 1.7;
    opacity: 0.9;
}
.heroStats{
    display: flex;
    gap: 12px;
    margin-top: 16px;
    flex-wrap: wrap;
}
.stat{
    min-width: 120px;
    padding: 12px 14px;
    border-radius: 14px;
    background: rgba(255, 255, 255, 0.12);
}
.num{
    font-size: 26px;
    font-weight: 800;
}
.label{
    margin-top: 4px;
    font-size: 13px;
    opacity: 0.86;
}
.funcs{
    display: flex;
    gap: 10px;
}
.funcSearch{
    flex: 1;
    display: flex;
    background-color: var(--bgColor);
    border: 1px solid var(--subBgColor);
    border-radius: 10px;
    overflow: hidden;
}
.funcSearch .text{
    padding: 10px 14px;
    border-right: 1px solid var(--subBgColor);
    white-space: nowrap;
}
.input,
.filterInput{
    box-sizing: border-box;
    border: 1px solid var(--subBgColor);
    border-radius: 10px;
    background-color: var(--bgColor);
    color: var(--text-color);
    padding: 10px 12px;
    font-size: 14px;
}
.funcSearch .input{
    flex: 1;
    border: none;
    border-radius: 0;
}
.filterInput{
    width: 220px;
}
.summaryGrid{
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
}
.summaryCard{
    padding: 14px;
    border-radius: 14px;
    background-color: var(--subBgColor);
}
.cardTitle{
    font-weight: 700;
    margin-bottom: 10px;
}
.pillWrap{
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}
.pill{
    padding: 8px 10px;
    border-radius: 999px;
    background-color: var(--bgColor);
    font-size: 13px;
}
.items{
    flex: 1;
    overflow: auto;
}
.items table{
    width: 100%;
    border-collapse: collapse;
    border: 1px solid var(--subBgColor);
}
.items th,
.items td{
    box-sizing: border-box;
    padding: 10px;
    font-size: 14px;
    vertical-align: top;
}
.descCell{
    min-width: 340px;
    max-width: 0;
    white-space: pre-wrap;
    word-break: break-word;
}
@media (max-width: 900px) {
    .funcs,
    .summaryGrid{
        grid-template-columns: 1fr;
        display: flex;
        flex-direction: column;
    }
    .filterInput{
        width: 100%;
    }
}
</style>
