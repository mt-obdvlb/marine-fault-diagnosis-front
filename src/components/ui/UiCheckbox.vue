<template>
  <label :class="['uiCheckbox', variant, { disabled }]">
    <input
      :checked="Boolean(modelValue)"
      :disabled="disabled"
      type="checkbox"
      @change="handleChange"
    >
    <span class="control" aria-hidden="true"></span>
    <span v-if="$slots.default" class="labelText">
      <slot></slot>
    </span>
  </label>
</template>

<script setup>
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  },
  variant: {
    type: String,
    default: 'box'
  }
});

const emit = defineEmits(['update:modelValue', 'change']);

function handleChange(event) {
  const value = event.target.checked;
  emit('update:modelValue', value);
  emit('change', event);
}
</script>

<style scoped>
.uiCheckbox {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  user-select: none;
}

.uiCheckbox input {
  position: absolute;
  opacity: 0;
  width: 1px;
  height: 1px;
  pointer-events: none;
}

.uiCheckbox .control {
  box-sizing: border-box;
  border: 1px solid color-mix(in oklab, var(--holder-color) 72%, #7ca0d8);
  background: color-mix(in oklab, var(--bgColor) 85%, #edf4ff);
  transition: all .2s ease;
}

.uiCheckbox.box .control {
  width: 17px;
  height: 17px;
  border-radius: 5px;
  position: relative;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.38);
}

.uiCheckbox.box input:checked + .control {
  background: linear-gradient(135deg, #1677ff 0%, #0aa2ff 45%, #00c7a1 100%);
  border-color: transparent;
  box-shadow: 0 4px 10px rgba(22, 119, 255, 0.26);
}

.uiCheckbox.box input:checked + .control::after {
  content: '';
  position: absolute;
  left: 5px;
  top: 2px;
  width: 4px;
  height: 8px;
  border: solid #fff;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.uiCheckbox.switch .control {
  width: 50px;
  height: 24px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.29);
  border: 2px solid var(--holder-color);
  position: relative;
  box-shadow: 0 1px 1px #def3f8, inset 0 .125em .125em #0d1112;
}

.uiCheckbox.switch .control::after {
  content: '';
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--text-color);
  position: absolute;
  left: 4px;
  top: 3px;
  box-shadow: 0 .125em .125em #3b4547;
  transition: transform .25s ease;
}

.uiCheckbox.switch input:checked + .control::after {
  transform: translateX(24px);
}

.uiCheckbox input:focus-visible + .control {
  box-shadow: 0 0 0 3px rgba(22, 119, 255, .18);
}

.uiCheckbox:hover .control {
  border-color: color-mix(in oklab, #1677ff 55%, var(--holder-color));
}

.uiCheckbox.disabled {
  opacity: .6;
  cursor: not-allowed;
}

.labelText {
  color: var(--text-color);
}
</style>
