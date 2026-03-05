<template>
    <div class="usageArea" style="overflow-y:auto;scrollbar-width:thin;">
        <Markdown class="md" :md="UsgMd" :theme="settings.theme"></Markdown>
    </div>
</template>

<script setup>
import UsgMd from '@/assets/KnowUsage.md?raw'
import { settings } from '@/utils/Settings';
</script>

<style scoped>
</style>