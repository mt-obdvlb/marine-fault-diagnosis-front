<template>
  <div class='panelArea'>
    <div v-show='loading' class='loading'>
      <img alt='' class='autoInvert'
           src='/icon/loading.svg'>
      加载中
    </div>
    
    <div class='heroCard'>
      <div class='heroTitle'>知识维护与概览</div>
      <div class='heroStats'>
        <div class='stat'>
          <div class='num'>{{ pagination.total }}</div>
          <div class='label'>知识条目</div>
        </div>
        <div class='stat'>
          <div class='num'>{{
              overview.node_count || 0
            }}
          </div>
          <div class='label'>节点数</div>
        </div>
        <div class='stat'>
          <div class='num'>{{
              overview.relation_count || 0
            }}
          </div>
          <div class='label'>关系数</div>
        </div>
      </div>
    </div>
    
    <div class='funcs'>
      <input v-model.trim='filters.keyword' class='input'
             placeholder='查找：知识编号 / 描述 / 标签'
             type='text'
             @keyup.enter='applyFilters'>
      <UiSelect v-model='filters.type' :options='typeSelectOptions'
                class='input small'
                @change='applyFilters' />
      <UiSelect v-model='filters.label' :options='labelSelectOptions'
                class='input'
                @change='applyFilters' />
      <div class='text buttonEffect' @click='reloadData'>
        刷新
      </div>
    </div>
    
    <div class='summaryGrid'>
      <div class='summaryCard'>
        <div class='cardTitle'>标签分布</div>
        <div class='pillWrap'>
          <div v-for='item in overview.node_types || []'
               :key='item.type' class='pill'>{{
              item.label
            }} · {{ item.count }}
          </div>
        </div>
      </div>
      <div class='summaryCard'>
        <div class='cardTitle'>关系分布</div>
        <div class='pillWrap'>
          <div v-for='item in overview.relation_types || []'
               :key='item.type' class='pill'>{{
              item.label
            }} · {{ item.count }}
          </div>
        </div>
      </div>
    </div>
    
    <div class='items'>
      <table border='1' cellspacing='0'>
        <thead
          style='position:sticky;top:0;background-color:var(--bgColor);z-index:5;'>
        <tr>
          <th width='140px'>知识编号</th>
          <th width='100px'>标签</th>
          <th width='90px'>来源</th>
          <th>知识描述</th>
          <th width='70px'>操作</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for='item in pagination.items'
            :key='item.entryId'>
          <td :title='item.identifier'>{{
              item.identifier
            }}
          </td>
          <td :title='item.label'>{{ item.label }}</td>
          <td :title='item.type'>{{
              getTypeText(item.type)
            }}
          </td>
          <td :title='item.desc' class='descCell'>
            {{ item.desc }}
          </td>
          <td>
            <div
              :class="{ disabledDelete: item.type !== 'dynamic' }"
              class='delBtn buttonEffect'
              @click='delItem(item)'>
              删除
            </div>
          </td>
        </tr>
        </tbody>
      </table>
    </div>
    
    <div class='pager'>
      <div>共 {{ pagination.total }} 条</div>
      <div class='pagerRight'>
        <UiSelect v-model='pageSize' :options='pageSizeOptions'
                  class='input mini'
                  @change='applyFilters' />
        <button :disabled='page<=1' class='pageBtn'
                @click='goPrev'>上一页
        </button>
        <div class='pageInfo'>第 {{ page }} /
          {{ pagination.totalPages }} 页
        </div>
        <button :disabled='page>=pagination.totalPages'
                class='pageBtn'
                @click='goNext'>下一页
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import {computed, reactive, ref} from 'vue';
import eventBus from '@/utils/eventBus';
import {settings} from '@/utils/Settings';
import api from '@/utils/api';
import UiSelect from '@/components/ui/UiSelect.vue';
import {
  buildKnowledgeOverview,
  collectKnowledgeFacets,
  fetchAllKnowledges,
  filterKnowledges,
  normalizeKnowledgeList,
  paginateList
} from '@/utils/knowledge';

const loading = ref(false);
const allItems = ref([]);
const filteredItems = ref([]);
const overview = ref({});
const pagination = ref({
  page: 1,
  pageSize: 20,
  total: 0,
  totalPages: 1,
  items: []
});
const page = ref(1);
const pageSize = ref(20);
const labelOptions = ref([]);
const typeOptions = ref([]);
const pageSizeOptions = [
  {label: '20/页', value: 20},
  {label: '50/页', value: 50},
  {label: '100/页', value: 100}
];
const typeSelectOptions = computed(() => [
  {label: '全部来源', value: ''},
  ...typeOptions.value.map((t) => ({label: getTypeText(t), value: t}))
]);
const labelSelectOptions = computed(() => [
  {label: '全部标签', value: ''},
  ...labelOptions.value.map((label) => ({label, value: label}))
]);

const filters = reactive({
  keyword: '',
  label: '',
  type: ''
});

function getTypeText(type) {
  return type === 'static' ? '内置库' : '用户库';
}

function recalcPage() {
  pagination.value = paginateList(filteredItems.value, page.value, pageSize.value);
  page.value = pagination.value.page;
}

function applyFilters() {
  filteredItems.value = filterKnowledges(allItems.value, {
    keyword: filters.keyword,
    labels: filters.label ? [filters.label] : [],
    types: filters.type ? [filters.type] : []
  });
  overview.value = buildKnowledgeOverview(filteredItems.value);
  recalcPage();
}

async function reloadData() {
  loading.value = true;
  try {
    const rows = await fetchAllKnowledges({}, {errorText: '知识列表获取失败'});
    if (!rows) return;
    allItems.value = normalizeKnowledgeList(rows);
    const facets = collectKnowledgeFacets(allItems.value);
    labelOptions.value = facets.labels;
    typeOptions.value = facets.types;
    page.value = 1;
    applyFilters();
  } finally {
    loading.value = false;
  }
}

function goPrev() {
  if (page.value <= 1) return;
  page.value -= 1;
  recalcPage();
}

function goNext() {
  if (page.value >= pagination.value.totalPages) return;
  page.value += 1;
  recalcPage();
}

function delItem(item) {
  if (item.type !== 'dynamic') {
    eventBus.emit('dialog', {text: '内置库知识不允许删除，仅用户库可删除。'});
    return;
  }
  
  const run = async () => {
    loading.value = true;
    try {
      const r = await api.knowledgeDelete(
        {identifier: item.identifier, label: item.label},
        {errorText: `${item.identifier} 删除失败`}
      );
      if (!r) return;
      eventBus.emit('dialog', {text: r.message || '删除成功'});
      await reloadData();
    } finally {
      loading.value = false;
    }
  };
  
  if (settings.comfBefDelKnow) {
    eventBus.emit('dialog', {
      text: `确定删除 ${item.identifier} 吗？`,
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

reloadData();
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
  background-color: rgba(125, 125, 125, .451);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 7;
}

.heroCard {
  padding: 14px;
  border-radius: 14px;
  background: linear-gradient(135deg, rgba(13, 59, 102, .94), rgba(0, 119, 182, .9));
  color: #fff;
}

.heroTitle {
  font-size: 20px;
  font-weight: 800;
}

.heroStats {
  display: flex;
  gap: 10px;
  margin-top: 12px;
  flex-wrap: wrap;
}

.stat {
  min-width: 120px;
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(255, 255, 255, .12);
}

.num {
  font-size: 24px;
  font-weight: 800;
}

.label {
  margin-top: 2px;
  font-size: 12px;
  opacity: .86;
}

.funcs {
  display: flex;
  gap: 8px;
}

.input {
  box-sizing: border-box;
  border: 1px solid var(--subBgColor);
  border-radius: 10px;
  background-color: var(--bgColor);
  color: var(--text-color);
  padding: 10px 12px;
  font-size: 14px;
}

.input.small {
  max-width: 120px;
}

.input.mini {
  width: 90px;
  padding: 6px 8px;
}

.funcs > .input:first-child {
  flex: 1;
}

.text {
  background: var(--bgColor);
  border: 1px solid var(--subBgColor);
  border-radius: 10px;
  padding: 10px 14px;
  white-space: nowrap;
}

.summaryGrid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.summaryCard {
  padding: 12px;
  border-radius: 12px;
  background-color: var(--subBgColor);
}

.cardTitle {
  font-weight: 700;
  margin-bottom: 8px;
}

.pillWrap {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.pill {
  padding: 6px 10px;
  border-radius: 999px;
  background-color: var(--bgColor);
  font-size: 12px;
}

.items {
  flex: 1;
  overflow: auto;
}

.items table {
  width: 100%;
  border-collapse: collapse;
  border: 1px solid var(--subBgColor);
}

.items th, .items td {
  box-sizing: border-box;
  padding: 8px;
  font-size: 13px;
  vertical-align: top;
}

.descCell {
  min-width: 320px;
  max-width: 0;
  white-space: pre-wrap;
  word-break: break-word;
}

.delBtn {
  font-size: 12px;
  color: #d4380d;
  cursor: pointer;
  border: 1px solid #ffd8bf;
  border-radius: 8px;
  text-align: center;
  padding: 4px 0;
  background: #fff7e6;
}

.disabledDelete {
  color: #999;
  border-color: #ddd;
  background: #f7f7f7;
  cursor: not-allowed;
}

.pager {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex: 0 1 0;
  min-height: 60px;
  padding: 5px 0;
}

.pagerRight {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pageBtn {
  height: 32px;
  border: 1px solid var(--subBgColor);
  background: var(--bgColor);
  color: var(--text-color);
  border-radius: 999px;
  padding: 0 14px;
  cursor: pointer;
}

.pageBtn:disabled {
  opacity: .45;
  cursor: not-allowed;
}

.pageInfo {
  min-width: 110px;
  text-align: center;
  padding: 0 8px;
  font-size: 13px;
  color: var(--holder-color);
}

@media (max-width: 900px) {
  .funcs, .summaryGrid, .pager {
    display: flex;
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
