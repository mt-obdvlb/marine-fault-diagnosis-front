<template>
  <div v-show="active" class="darkness" @click="click('cancel')">
    <div class="dialog" @click.stop>
      <div class="text">
        {{ t }}
      </div>
      <div class="checkbox" v-show="c">
        <label for="dialogCheckbox">{{ c }}</label>
        <input id="dialogCheckbox" type="checkbox" v-model="cv">
      </div>
      <div v-if="buttonType==='yes_no'" class="buttons">
        <div class="yes buttonEffect" @click="click('yes')">是</div>
        <div class="no buttonEffect" @click="click('no')">否</div>
      </div>
      <div v-else class="buttons">
        <div class="ok buttonEffect" @click="click('ok')">确定</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { shallowRef } from 'vue';
import eventBus from '@/utils/eventBus';
const active=shallowRef(false),t=shallowRef(""),c=shallowRef(""),cv=shallowRef(true),buttonType=shallowRef('ok')
let func={}
/**
 * arg.text - 显示的文本，默认为空
 * arg.type - 显示的类型，可选 `yes_no` 或 `ok`
 * arg.onYes/onNo,onOK,onCancel - 对应的按钮的回调事件
 */
eventBus.on("dialog",(arg)=>{
  if(!arg)arg={text:"",type:"ok"}
  let {text,onYes,onNo,onCancel,onOK,checkText,checkVal,type}=arg
  t.value=text
  func["yes"]=onYes
  func["no"]=onNo
  func["cancel"]=onCancel
  func["ok"]=onOK

  c.value=checkText||""
  cv.value=checkVal||cv.value

  buttonType.value=type||"ok"

  active.value=true
})
eventBus.on("destroyDialog",()=>{
  active.value=false
})

function click(decision){
  active.value=false
  if(func[decision]) func[decision](cv.value)
  func={}
}

</script>

<style scoped>
.darkness {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 40;
  display: flex;
  justify-content: center;
  align-items: center;
  backdrop-filter: blur(4px);
  transition: opacity 0.3s ease;
}

.dialog {
  display: flex;
  flex-direction: column;
  width: 400px;
  background: var(--bgColor);
  border-radius: 16px;
  padding: 24px;
  z-index: 50;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
  border: 1px solid var(--card-border);
}

.text {
  color: var(--text-color);
  flex: 1;
  height: 0;
  padding: 32px 24px;
  text-align: center;
  font-size: 18px;
  line-height: 1.6;
  white-space: pre-line;
}

.checkbox {
  text-align: center;
  user-select: none;
  margin: 8px 0;
}

.checkbox label {
  color: var(--text-color);
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.checkbox input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.buttons {
  justify-content: center;
  display: flex;
  gap: 16px;
  margin-top: 8px;
}

.buttons div {
  padding: 12px 24px;
  border-radius: 8px;
  min-width: 100px;
  font-size: 18px;
  font-weight: 500;
  transition: all 0.2s ease;
  text-align: center;
}

.yes {
  background-color: var(--header-item);
  color: white;
}

.no {
  background-color: #ff4d4f;
  color: white;
}

.ok {
  background-color: var(--header-item);
  color: white;
}

.yes:hover, .ok:hover {
  transform: translateY(-1px);
}

.no:hover {
  transform: translateY(-1px);
}

.yes:active, .no:active, .ok:active {
  transform: translateY(1px);
}
</style>