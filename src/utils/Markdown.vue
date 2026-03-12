<template>
  <div class="markdown-body" v-html="renderedHtml"></div>
</template>

<script setup>
import MarkdownIt from 'markdown-it'
import markdownItSub from 'markdown-it-sub'
import markdownItSup from 'markdown-it-sup'
import markdownItImageFigures from 'markdown-it-image-figures'
import {computed} from 'vue'

const {md} = defineProps({
  md: {default: ''},
  theme: {default: 'light'}
})

const parser = new MarkdownIt({
  html: false,
  linkify: true,
  breaks: true
})

parser.use(markdownItSub)
parser.use(markdownItSup)
parser.use(markdownItImageFigures)

const renderedHtml = computed(() => parser.render(md || ''))
</script>

<style>
.markdown-body {
  color: var(--text-color);
  line-height: 1.75;
  word-break: break-word;
}

.markdown-body > :first-child {
  margin-top: 0;
}

.markdown-body > :last-child {
  margin-bottom: 0;
}

.markdown-body p,
.markdown-body ul,
.markdown-body ol,
.markdown-body blockquote,
.markdown-body pre,
.markdown-body table,
.markdown-body figure,
.markdown-body h1,
.markdown-body h2,
.markdown-body h3,
.markdown-body h4,
.markdown-body h5,
.markdown-body h6 {
  margin: 0 0 12px;
}

.markdown-body ul,
.markdown-body ol {
  padding-left: 22px;
}

.markdown-body pre {
  overflow: auto;
  padding: 12px 14px;
  border-radius: 10px;
  background: color-mix(in srgb, var(--subBgColor) 78%, transparent);
}

.markdown-body code {
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
  font-size: 0.92em;
}

.markdown-body :not(pre) > code {
  padding: 2px 6px;
  border-radius: 6px;
  background: color-mix(in srgb, var(--subBgColor) 70%, transparent);
}

.markdown-body blockquote {
  margin-left: 0;
  padding-left: 12px;
  border-left: 3px solid var(--mainColor);
  opacity: 0.88;
}

.markdown-body a {
  color: var(--mainColor);
}

.markdown-body img {
  max-width: 100%;
}

.markdown-body table {
  width: 100%;
  border-collapse: collapse;
}

.markdown-body th,
.markdown-body td {
  padding: 8px 10px;
  border: 1px solid color-mix(in srgb, var(--subTextColor, var(--text-color)) 22%, transparent);
}
</style>
