<template>
  <div ref="rootEl" :class="['uiSelectWrap', { disabled }]">
    <button
      type="button"
      class="uiSelect"
      :disabled="disabled"
      v-bind="$attrs"
      @click="toggle"
    >
      <span class="uiSelectText">{{ currentLabel }}</span>
      <span class="uiSelectArrow" :class="{ open: open }"></span>
    </button>
    <div v-if="open" class="uiOptions">
      <button
        v-for="opt in normalizedOptions"
        :key="String(opt.value)"
        type="button"
        class="uiOption"
        :class="{ active: isActive(opt.value), disabled: opt.disabled }"
        :disabled="Boolean(opt.disabled)"
        @click="choose(opt)"
      >
        {{ opt.label }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';

defineOptions({ inheritAttrs: false });

const props = defineProps({
  modelValue: {
    type: [String, Number, Boolean, null],
    default: ''
  },
  options: {
    type: Array,
    default: () => []
  },
  placeholder: {
    type: String,
    default: ''
  },
  disabled: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:modelValue', 'change']);

const open = ref(false);
const rootEl = ref(null);

const normalizedOptions = computed(() =>
  props.options.map((opt) => ({
    label: String(opt?.label ?? opt?.text ?? ''),
    value: opt?.value,
    disabled: Boolean(opt?.disabled)
  }))
);

const currentLabel = computed(() => {
  const selected = normalizedOptions.value.find((opt) => isActive(opt.value));
  if (selected) return selected.label;
  return props.placeholder || '';
});

function isActive(value) {
  return value === props.modelValue;
}

function choose(opt) {
  if (opt.disabled) return;
  open.value = false;
  emit('update:modelValue', opt.value);
  emit('change', opt.value);
}

function toggle() {
  if (props.disabled) return;
  open.value = !open.value;
}

function handleGlobalClick(event) {
  if (!open.value || !rootEl.value) return;
  if (!rootEl.value.contains(event.target)) open.value = false;
}

onMounted(() => {
  document.addEventListener('mousedown', handleGlobalClick);
});

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', handleGlobalClick);
});
</script>

<style scoped>
.uiSelectWrap {
  position: relative;
}

.uiSelect {
  width: 100%;
  height: 100%;
  min-height: 34px;
  padding: 0 34px 0 12px;
  border-radius: 10px;
  border: 1px solid color-mix(in oklab, var(--holder-color) 30%, #7aa6ff);
  background-color: color-mix(in oklab, var(--bgColor) 90%, #eef5ff);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.28);
  color: var(--text-color);
  text-align: left;
  cursor: pointer;
  transition: border-color .2s ease, box-shadow .2s ease, background-color .2s ease;
}

.uiSelect:hover {
  border-color: color-mix(in oklab, #1677ff 55%, var(--holder-color));
  background-color: color-mix(in oklab, var(--bgColor) 85%, #e7f1ff);
}

.uiSelect:focus-visible {
  outline: none;
  border-color: #1677ff;
  box-shadow: 0 0 0 3px rgba(22, 119, 255, 0.18);
}

.uiSelectText {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.uiSelectArrow {
  position: absolute;
  right: 12px;
  top: 50%;
  width: 8px;
  height: 8px;
  border-right: 2px solid #7a8493;
  border-bottom: 2px solid #7a8493;
  transform: translateY(-70%) rotate(45deg);
  transition: transform .2s ease;
  pointer-events: none;
}

.uiSelectArrow.open {
  transform: translateY(-35%) rotate(225deg);
}

.uiOptions {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  z-index: 30;
  max-height: 240px;
  overflow-y: auto;
  border: 1px solid color-mix(in oklab, var(--holder-color) 25%, #89b0ff);
  border-radius: 10px;
  background: var(--bgColor);
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.18);
  padding: 4px;
}

.uiOption {
  width: 100%;
  border: none;
  background: transparent;
  color: var(--text-color);
  text-align: left;
  padding: 8px 10px;
  border-radius: 8px;
  cursor: pointer;
}

.uiOption:hover {
  background: color-mix(in oklab, var(--subBgColor4) 60%, #dbe9ff);
}

.uiOption.active {
  background: linear-gradient(90deg, rgba(22, 119, 255, 0.16), rgba(0, 184, 156, 0.16));
  color: color-mix(in oklab, var(--text-color) 80%, #1259d8);
  font-weight: 600;
}

.uiOption.disabled {
  opacity: .55;
  cursor: not-allowed;
}

.uiSelectWrap.disabled {
  opacity: .65;
}
</style>
