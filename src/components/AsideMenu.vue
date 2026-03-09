<template>
  <div :class="['asideMenu',{active}]"
       @click='active=false'>
    <div class='bar' @click.stop>
      <div class='up_bar'>
        <div v-for='item of up_items'
             v-show='item.available'
             :title='item.name' class='item buttonEffect'
             @click='item.function'>
          <img :src='item.icon' class='icon'/>
          <div class='text'>{{ item.name }}</div>
        </div>
      </div>
      <div class='divider'></div>
      <div class='down_bar'>
        <div v-for='item of down_items'
             v-show='item.available'
             :title='item.name' class='item buttonEffect'
             @click='item.function'>
          <img :src='item.icon' class='icon'/>
          <div class='text'>{{ item.name }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import {ref, computed} from 'vue'
import {useRouter} from 'vue-router';
import eventBus from '@/utils/eventBus';

const router = useRouter()
const active = ref(false)
eventBus.on('toggleMenu', () => active.value = !active.value)

//侧边栏上部分选项
const up_items = ref([
  {
    name: '主页',
    icon: './icon/home.svg',
    function: () => {
      router.push({name: 'HomePage'})
    },
    available: true
  },
  {
    name: '智能问答',
    icon: './icon/question.svg',
    function: () => {
      router.push({name: 'AskAnswer'})
    },
    available: true
  },
  {
    name: '知识图谱',
    icon: './icon/knowledge.svg',
    function: () => {
      router.push({name: 'Kg'})
    },
    available: true
  },
  {
    name: '诊断会话',
    icon: './icon/chat.svg',
    function: () => {
      router.push({name: 'AskAnswer'})
    },
    available: true
  },
  {
    name: '知识库管理',
    icon: './icon/knowledge.svg',
    function: () => {
      router.push({name: 'Knowledge'})
    },
    available: true
  }
])
//侧边栏下部分选项
const down_items = ref([
  {
    name: '设置',
    icon: './icon/setting.svg',
    function: () => {
      router.push({name: 'Settings'})
    },
    available: true
  }
])
</script>

<style scoped>
.asideMenu {
  position: fixed;
  top: 0;
  left: 0;
  height: 100%;
  width: 0;
  transition: width 0.4s cubic-bezier(.4, 2, .6, 1);
  overflow-x: hidden;
  background: rgba(30, 34, 44, 0.18);
  z-index: 30;
  backdrop-filter: blur(6px);
}

.asideMenu.active {
  width: 100%;
}

.bar {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  width: 220px;
  height: 100%;
  background: var(--bgColor);
  box-shadow: 2px 0 24px 0 rgba(0, 0, 0, 0.12);
  border-top-right-radius: 18px;
  border-bottom-right-radius: 18px;
  padding: 18px 0 18px 0;
}

.up_bar, .down_bar {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.up_bar {
  flex: 1;
}

.divider {
  height: 1px;
  background: linear-gradient(to right, #e0e0e0 60%, transparent);
  margin: 18px 0 12px 24px;
  border-radius: 1px;
}

.item {
  display: flex;
  align-items: center;
  gap: 16px;
  width: 200px;
  height: 50px;
  margin-left: 12px;
  border-radius: 12px;
  background: var(--subBgColor2);
  box-shadow: 0 1px 4px 0 rgba(0, 0, 0, 0.03);
  transition: background 0.2s, box-shadow 0.2s, transform 0.15s;
  font-weight: 500;
  font-size: 17px;
  color: var(--text-color);
  cursor: pointer;
  user-select: none;
  border: none;
  outline: none;
}

.item:hover {
  background: linear-gradient(90deg, var(--aside-menu-item-hover-from) 65%, var(--aside-menu-item-hover-to) 100%);
  box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.08);
  transform: translateX(4px) scale(1.03);
}

.item:active {
  background: var(--aside-menu-item-active);
  color: #fff;
  transform: scale(0.98);
}

.item .icon {
  width: 32px;
  height: 32px;
  margin-left: 12px;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.08));
  transition: filter 0.2s;
}

.item .text {
  flex: 1;
  text-align: left;
  font-size: 17px;
  font-weight: bold;
  letter-spacing: 1px;
  padding-right: 12px;
  background: transparent;
  border: none;
  color: inherit;
  transition: color 0.2s;
}
</style>
