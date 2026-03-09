<template>
    <div :class="['area',screen.type]">
        <img v-show="screen.type==='ver'" src="/icon/more.svg" class="floatBtn buttonEffect" @click="panelMenuOn=!panelMenuOn">
        <div v-show="screen.type==='hor'||panelMenuOn" class="panels">
            <div v-for="p in panels" :class="['panel','buttonEffect',{'active':currentPanel.name===p.name}]" @click="currentPanel=p,panelMenuOn=false">{{ p.name }}</div>
        </div>
        <KeepAlive class="content">
            <component :is="currentPanel.component"></component>
        </KeepAlive>
    </div>
</template>

<script setup>
import Usage from './Knowledge/Usage.vue';
import LibraryForm from './Knowledge/LibraryForm.vue';
import LibraryManage from './Knowledge/LibraryManage.vue';
import { shallowRef } from 'vue';
import { screen } from '@/utils/GLO';
const panels=[
    {
        name:"导入说明",
        component:Usage,
    },
    {
        name:"条目录入",
        component:LibraryForm,
    },
    {
        name:"维护与概览",
        component:LibraryManage,
    },
]
const currentPanel = shallowRef(panels[1])
const panelMenuOn = shallowRef(false)
</script>

<style scoped>
.area{
    height: 100%;
    display: flex;
    min-height: 0;
    overflow: hidden;
}
.floatBtn{
    position: fixed;
    right: 0;
    top: var(--app-header-height);
    width: 50px;
    height: 50px;
}
.panels{
    width: 200px;
    display: flex;
    flex-direction: column;
    padding: 5px;
    margin: 5px;
    border: 2px solid var(--subBgColor);
    border-radius: 10px;
    overflow-y: auto;
    scrollbar-width: none;
    background-color: var(--bgColor);
    z-index: 10;
}
.area.ver .panels{
    position: fixed;
    right: 10px;
    top: calc(var(--app-header-height) + 10px);
}
.panels .panel{
    padding: 13px;
    padding-left: 10px;
    padding-right: 10px;
    border: 2px solid var(--subBgColor);
    background-color: var(--bgColor);
    border-radius: 15px;
    margin-bottom: 5px;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow-x: hidden;
    transition: filter .3s, background-color .3s;
}
.panels .panel.active{
    font-weight: bold;
    background-color: var(--subBgColor);
}
.content{
    flex: 1;
    width: 0;
    min-height: 0;
    margin: 5px;
    padding: 5px;
    border: 2px solid var(--subBgColor);
    border-radius: 10px;
    overflow: hidden;
}
</style>
