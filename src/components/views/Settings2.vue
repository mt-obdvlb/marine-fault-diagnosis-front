<template>
    <div :class="['area',screen.type]">
        <div class="aside">
            <div v-for="c in description" :class="['asideItem','buttonEffect',{'active':current.name===c.name}]"
                @click="current=c">{{ c.name }}</div>
        </div>
        <div class="main">
            <h2>{{ current.name }}</h2>
            <div v-for="i in current.items" v-show="!i.show||i.show()" :class="['item',i.type]">
                <div class="text">{{ i.text||i.textF(ArgPool[i.key]) }} <img v-show="i.dscr" alt="?" src="/icon/help.svg" :title="i.dscr" style="height:15px;margin-left:4px;"/></div>
                
                <label class="input switch" v-if="i.type==='bool'" @click="settings[i.key]=!settings[i.key]">
                    <input type="checkbox" :checked="settings[i.key]" disabled/>
                    <span class="slider"></span>
                </label>
                <input class="input range" v-else-if="i.type==='range'" type="range" :min="i.min" :max="i.max" :step="i.step||1" v-model.number="ArgPool[i.key]" @mouseup="settings[i.key]=ArgPool[i.key]"/>
                <div v-else-if="i.type==='text'">
                    <textarea v-if="i.multiline" class="input text" v-model="ArgPool[i.key]" @change="settings[i.key]=ArgPool[i.key]"></textarea>
                    <input v-else class="input text" type="text" v-model="ArgPool[i.key]" @change="settings[i.key]=ArgPool[i.key]"/>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { reactive,ref } from 'vue'
import { settings,description } from '@/utils/Settings'
import { screen } from '@/utils/GLO'
let ArgPool=reactive({})

let current=ref(description[0])
description.forEach(cls => {
    cls.items.forEach(item => {
        if(item.type==='range' || item.type==='text')
            ArgPool[item.key]=settings[item.key]
    });
});
</script>

<style scoped>
.area{
    height: 100%;
    overflow-y: auto;
    scrollbar-width: none;
    display: flex;
}
.area.ver{
    flex-direction: column;
}
.area.hor .aside{
    width: 20%;
    min-width: 130px;
    max-width: 260px;
    padding: 20px;
    border-right: 1px solid var(--subBgColor);
}
.area.ver .aside{
    overflow-x: auto;
    scrollbar-width: none;
    padding: 5px;
    padding-bottom: 0px;
    box-shadow: 0px -2px 0px 0px var(--subBgColor) inset;
    display: flex;
}
.area .asideItem{
    text-wrap: nowrap;
}
.area.hor .asideItem{
    position: relative;
    padding: 10px;
    padding-left: 10px;
    margin-top: 3px;
    background-color: var(--bgColor);
    font-size: 17px;
    display: flex;
    align-items: center;
    border-radius: 3px;
}
.area.hor .asideItem.active{
    background-color: var(--setting-item-bg);
}
.area.hor .asideItem.active::before{
    content: "";
    position: absolute;
    left: 1px;
    top: 20%;
    background-color: var(--header-item);
    height: 60%;
    width: 3px;
    border-radius: 8px;
}
.area.ver .asideItem{
    flex-shrink: 0;
    text-align: center;
    box-sizing: border-box;
    width: 100px;
    padding: 8px;
    margin-right: 10px;
    background-color: var(--subBgColor);
    border: 3px solid var(--subBgColor);
    border-top-left-radius: 8px;
    border-top-right-radius: 8px;
}
.area.ver .asideItem.active{
    background-color: var(--bgColor);
    border-bottom: 3px solid var(--bgColor);
}

.main{
    flex: 1;
    user-select: none;
}
.area.hor .main{
    margin-left: 30px;
    margin-right: 30px;
    width: 0;
}
.area.ver .main{
    margin-left: 10px;
    margin-right: 10px;
    height: 0;
}
.item{
    display: flex;
    align-items: center;
    border-left: 3px solid var(--subBgColor);
    background-color: var(--setting-item-bg);
    padding: 7px;
    padding-top: 10px;
    padding-bottom: 10px;
    margin-top: 5px;
}
.item .text{
    flex: 1;
    display: flex;
    align-items: center;
    text-wrap: nowrap;
}
.item .input.range{
    width: 200px;
}
.area.area.ver .item.text{
    align-items: unset;
    flex-direction: column;
}
.item.text{
    align-items: start;
}
.item.text .input{
    display: inline;
    font-size:15px; 
    width: 380px;
}
.area.area.ver .item.text .input{
    width: 100%;
}
.item.text .input{
    font-size:15px; 
}
.item.text textarea.input{
    resize: vertical;
    height: 80px;
}

/* .item{
    margin: 5px;
    margin-bottom: 8px;
    padding: 7px;
    border-radius: 10px;
    font-size: 15px;
    font-weight: bold;
    user-select: none;
    display: flow-root;
    background-color: var(--subBgColor);
    display: flex;
} */

/* .item.text{
    flex-direction: column;
}
.item.text textarea.input{
    resize: vertical;
} */


/* switch开关 */
/* 隐藏默认的复选框 */
.switch input {
  display: none;
}
/* 开关容器的样式 */
.switch {
  position: relative;
  display: inline-block;
  width: 50px; /* 开关的宽度 */
  height: 24px; /* 开关的高度 */
}
/* 滑块的样式 */
.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.29); /* 关闭状态的背景色 */
  border: 2px solid var(--holder-color);
  transition: 0.3s; /* 过渡效果 */
  border-radius: 12px; /* 圆角 */
  box-shadow: 0 1px 1px #def3f8, inset 0 .125em .125em #0d1112; /*轨道内置阴影效果*/
}
/* 滑块上的圆形按钮 */
.slider::before {
  position: absolute;
  content: "";
  height: 14px; /* 圆形按钮的高度 */
  width: 14px; /* 圆形按钮的宽度 */
  left: 4px; /* 初始位置 */
  top: 3px;
  background-color: var(--text-color);
  transition: 0.3s; /* 过渡效果 */
  border-radius: 50%; /* 圆形 */
  box-shadow: 0 .125em .125em #3b4547; /*添加底部阴影*/
}
/* 选中状态下圆形按钮的位置 */
.switch input:checked + .slider::before {
  transform: translateX(24px); /* 移动到右侧 */
}


/* 自定义滑条 */
/* 基本样式 */

/* 滑块轨道样式 */
input[type=range] {
    appearance: none;
    background: linear-gradient(#ffffff, #ffffff);
    background-size: 0% 100%;
    border-radius: 10px; /*这个属性设置使填充进度条时的图形为圆角*/
}
input[type=range]:hover {
    cursor: pointer;
}
input[type=range]:focus {
    outline: none;
}
input[type=range]::-webkit-slider-runnable-track {
    height: 8px;
    border-radius: 10px;
    box-shadow: 0 1px 1px #c1c1c1, inset 0 .125em .125em #0d1112;
}
input[type=range]::-moz-range-track{
    height: 8px;
    border-radius: 10px;
    box-shadow: 0 1px 1px #def3f8, inset 0 .125em .125em #0d1112;
}
input[type=range]::-webkit-slider-thumb{
    appearance: none;
    height: 20px;
    width: 20px;
    margin-top: -6px;
    background: white; 
    border-radius: 50%; /*外观设置为圆形*/
    border: solid 0.125em rgba(205, 224, 230, 0.5); /*设置边框*/
    box-shadow: 0 .125em .125em #3b4547; /*添加底部阴影*/
    transition: filter .3s;
}
input[type=range]::-moz-range-thumb{
    appearance: none;
    height: 20px;
    width: 20px;
    margin-top: -6px;
    background: white; 
    border-radius: 50%; /*外观设置为圆形*/
    border: solid 0.125em rgba(205, 224, 230, 0.5); /*设置边框*/
    box-shadow: 0 .125em .125em #3b4547; /*添加底部阴影*/
    transition: filter .3s;
}
input[type=range]::-webkit-slider-thumb:hover{
    filter: brightness(.8)
}
input[type=range]::-webkit-slider-thumb:active{
    filter: brightness(.7)
}
input[type=range]::-moz-range-thumb:hover{
    filter: brightness(.8)
}
input[type=range]::-moz-range-thumb:active{
    filter: brightness(.7)
}

/* input[type='range']{
    appearance: none;
    background: var(--bgColor);
    height: 5px;
    margin: 8px;
    border-radius: 5px;
    transition: filter .3s;
}
:root[theme='dark'] input[type='range']:hover{
    filter: brightness(0.7);
}
:root[theme='light'] input[type='range']:hover{
    filter: brightness(1.3);
}
input[type='range']::-webkit-slider-thumb{
    appearance: none;
    width: 18px;
    height: 18px;
    background: var(--text-color);
    cursor: pointer;
    border-radius: 50%;
    border: 2px solid var(--bgColor);
    border-image: linear-gradient(#f44336,#f44336) 0 fill / 8 20 8 0 / 0 0 0 99vw;
}
input[type='range']::-moz-range-thumb{
    appearance: none;
    width: 14px;
    height: 14px;
    background: var(--text-color);
    cursor: pointer;
    border-radius: 50%;
    border: 2px solid var(--bgColor);
} */
</style>