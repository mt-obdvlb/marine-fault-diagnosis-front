<template>
  <div :class="['header',screen.type]">
    <img v-show="screen.type==='ver'"
         class='menuButton buttonEffect'
         src='/icon/menu.svg'
         @click="eventBus.emit('toggleMenu')"/>
    <div :class="['title',screen.type]">
      <RouterLink to='/'>
        <div class='brand'>
          <img alt='logo' class='logo' src='/logo.svg'>
          <div class='nameWrap'>
            <div class='systemName'>
              船舶装备故障诊断智能问答系统
            </div>
            <div class='systemSub'>Ship Equipment Fault
              Diagnosis QA
            </div>
          </div>
        </div>
      </RouterLink>
      <img
        :alt="'切换' + (settings.theme=='light' ? '深色' : '浅色') + '主题'"
        :title="'切换' + (settings.theme=='light' ? '深色' : '浅色') + '主题'"
        class='themeButton'
        src='/icon/light_dark.svg'
        @click='changeTheme($event)'>
    </div>
    <div v-show="screen.type==='hor'" class='menu'>
      <template v-for='item in items' :key='item.name'>
        <RouterLink v-show='item.show' :to='item.to'
                    class='item'>
          <div
            :class="['text',{'active':item.to.name===route.name}]">
            {{ item.name }}
          </div>
        </RouterLink>
      </template>
    
    </div>
    <div v-show="screen.type==='hor'" class='utilityMenu'>
      <template v-for='item in utilityItems'
                :key='item.name'>
        <RouterLink v-if='item.show'
                    :to='item.to'
                    class='utilityItem buttonEffect'>
          <img :src='item.icon' alt='' class='icon'>
          <div class='text'>{{ item.name }}</div>
        </RouterLink>
      </template>
    </div>
  </div>
</template>

<script setup>
import {RouterLink, useRoute} from 'vue-router';
import {computed} from 'vue';
import {screen} from '@/utils/GLO';
import {settings} from '@/utils/Settings';
import eventBus from '@/utils/eventBus';

const route = useRoute()
window.route = route

const items = computed(() => [
  {
    name: '智能问答',
    to: {name: 'AskAnswer'},
    show: true
  },
  {
    name: '知识图谱',
    to: {name: 'Kg'},
    show: true
  }
])

const utilityItems = computed(() => [
  {
    name: '知识库管理',
    to: {name: 'Knowledge'},
    icon: '/icon/knowledge.svg',
    show: true
  }, {
    name: '设置',
    to: {name: 'Settings'},
    icon: '/icon/setting.svg',
    show: true
  }
])

function toggleTheme() {
  if (settings.theme == 'light') settings.theme = 'dark'
  else settings.theme = 'light'
}

function changeTheme(event) {
  const root = document.documentElement
  const x = event?.clientX ?? window.innerWidth / 2
  const y = event?.clientY ?? window.innerHeight / 2
  const maxRadius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y)
  )
  
  root.style.setProperty('--vt-x', `${x}px`)
  root.style.setProperty('--vt-y', `${y}px`)
  root.style.setProperty('--vt-r', `${maxRadius}px`)
  
  if (!document.startViewTransition) {
    toggleTheme()
    return
  }
  
  root.classList.add('theme-transition')
  const transition = document.startViewTransition(() => {
    toggleTheme()
  })
  
  transition.finished.finally(() => {
    root.classList.remove('theme-transition')
    root.style.removeProperty('--vt-x')
    root.style.removeProperty('--vt-y')
    root.style.removeProperty('--vt-r')
  })
}

</script>

<style scoped>
.header {
  border-bottom: 1.5px solid var(--header-border);
  display: flex;
  align-items: center;
  background-color: var(--bgColor);
  box-shadow: var(--header-shadow);
  user-select: none;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: var(--app-header-height);
  z-index: 20;
}

.menuButton {
  position: relative;
  box-sizing: border-box;
  padding: 5px;
  height: 50px;
  object-fit: contain;
  z-index: 10;
}

.title.hor {
  flex: 1;
  display: flex;
  padding: 10px 0 10px 18px;
}

.title.ver {
  position: absolute;
  top: 0;;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  align-items: center
}

.title > RouterLink {
  display: flex;
  align-items: center;
  text-decoration: none;
  color: var(--text-color);
  text-align: center;
  font-size: 20px;
  width: fit-content;
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo {
  height: 38px;
  width: 38px;
  filter: drop-shadow(0 2px 8px #00d9ff44);
}

.nameWrap {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.systemName {
  font-size: 16px;
  font-weight: 800;
  line-height: 1.15;
  color: var(--text-color);
}

.systemSub {
  font-size: 11px;
  line-height: 1.1;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--holder-color);
}

.themeButton {
  width: 38px;
  margin-left: 18px;
  border-radius: 50%;
  transition: all .3s;
  cursor: pointer;
}

:root[theme='dark'] .themeButton {
  transform: rotate(180deg);
  filter: brightness(2);
}

.themeButton:hover {
  filter: drop-shadow(0 0 8px #00d9ffcc);
  transform: scale(1.1);
}

:root[theme='dark'] .themeButton:hover {
  transform: rotate(180deg) scale(1.1);
  filter: drop-shadow(0 0 8px #00d9ffcc) brightness(2);
}

.menu {
  display: flex;
  height: 100%;
  align-items: center;
  gap: 8px;
}

.header.ver .systemName {
  font-size: 13px;
}

.header.ver .systemSub {
  display: none;
}

.menu .item {
  margin: 0 4px;
  border-radius: 10px;
  transition: background .2s, box-shadow .2s;
  text-decoration: none;
  display: flex;
  align-items: center;
  min-width: 80px;
  justify-content: center;
}

.menu .text {
  position: relative;
  padding: 8px 0;
  width: 100%;
  color: var(--header-item);
  text-align: center;
  font-weight: bold;
  background: linear-gradient(to right, var(--header-item), var(--header-item)) no-repeat bottom;
  background-size: 0px 2px;
  transition: all .3s;
}

.menu .text.active {
  color: var(--header-item-active);
  background: linear-gradient(to right, var(--header-item-active), var(--header-item-active)) no-repeat bottom;
  background-size: 100% 2px;
}

.menu .item:hover .text {
  background-size: 100% 2px;
}

.kgMenu {
  margin-right: 5px;
  width: 92px;
  background-image: inherit;
  display: flex;
  text-decoration: none;
  justify-content: center;
  align-items: center;
  position: relative;
}

.kgButton {
  color: var(--header-item);
  padding: 7px;
  font-weight: bold;
  cursor: pointer;
  background: linear-gradient(to right, var(--header-item), var(--header-item)) no-repeat bottom;
  background-size: 0px 2px;
  transition: all .3s;
}

.kgButton:hover {
  background-size: 100% 2px;
}

.kgButton.active {
  color: var(--header-item-active);
  background: linear-gradient(to right, var(--header-item-active), var(--header-item-active)) no-repeat bottom;
  background-size: 100% 2px;
}

.kgMenuItems {
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  position: absolute;
  top: 100%;
  left: -8px;
  background-color: var(--bgColor);
  border: 1px solid var(--subBgColor);
  border-radius: 8px;
  transition: opacity .2s ease, transform .2s ease, visibility 0s linear .2s;
  transform: translateY(4px);
  z-index: -1;
  width: 110px;
}

.kgButton:hover + .kgMenuItems,
.kgButton:focus-visible + .kgMenuItems,
.kgMenuItems:hover {
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
  transform: translateY(0);
  transition-delay: 0s;
  z-index: 10;
}

.kgMenuItem {
  border-radius: 8px;
  background-color: inherit;
  display: flex;
  justify-content: center;
  text-decoration: none;
  margin: 6px;
  padding: 6px;
  transition: all .3s;
}

.kgMenuItem .text {
  color: var(--text-color);
  width: fit-content;
}

.utilityMenu {
  padding: 0 18px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.utilityItem {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 38px;
  padding: 0 14px;
  border-radius: 999px;
  background: var(--subBgColor2);
  text-decoration: none;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.06);
  transition: transform .2s, box-shadow .2s, background .2s;
  cursor: pointer;
}

.utilityItem:hover {
  background: linear-gradient(90deg, var(--aside-menu-item-hover-from) 65%, var(--aside-menu-item-hover-to) 100%);
  transform: translateY(-1px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.08);
}

.utilityItem .icon {
  width: 18px;
  height: 18px;
}

.utilityItem .text {
  color: var(--text-color);
  font-size: 14px;
  font-weight: 600;
}

@media (max-width: 1200px) {
  .utilityMenu {
    gap: 6px;
    padding: 0 12px;
  }
  
  .utilityItem {
    padding: 0 10px;
  }
  
  .utilityItem .text {
    font-size: 13px;
  }
}
</style>
