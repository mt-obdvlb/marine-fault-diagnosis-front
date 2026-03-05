<template>
  <div class="iframe-container">
    <iframe 
      :src="iframeSrc" 
      frameborder="0" 
      width="100%" 
      height="100%"
    ></iframe>
  </div>
</template>
  
<script>
export default {
  data() {
    return {
      iframeSrc: import.meta.env.BASE_URL + 'kgshow/GraphNavigator.html'
    };
  }
};
</script>
  
<style scoped>
.iframe-container {
  width: 100%; /* 全屏宽度 */
  height: 100%; /* 全屏高度 */
  margin: 0;
  padding: 0;
  overflow: hidden;
}
</style>