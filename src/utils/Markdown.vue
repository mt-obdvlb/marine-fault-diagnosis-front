<template>
    <MdPreview v-model="markdown" :theme="theme" @on-html-changed="htmlChanged"></MdPreview>
</template>
<script setup>
import {MdPreview} from 'md-editor-v3';
import 'md-editor-v3/lib/style.css';
import { ref,watchEffect } from 'vue'
const {md,theme} = defineProps({"md":{default:""},"theme":{default:'light'}})
const markdown=ref("")
const emit=defineEmits(['onHtmlChanged'])
function htmlChanged(h){ emit('onHtmlChanged',h) }
watchEffect(()=>{
    markdown.value=md
})

</script>

<style>
.md-editor{
    --md-color: var(--text-color);
    background-color: inherit;
    font-family: inherit;
}
.md-editor-preview-wrapper{
    padding: 0;
}
.md-editor-preview{
    overflow: auto;
    scrollbar-width: thin;
}
.md-editor-code-block{
    width: 0px;
    overflow: visible;
}
</style>