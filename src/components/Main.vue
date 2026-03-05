<template>
  <div class="mainbody">
    <RouterView v-slot="{ Component }">
      <transition mode="out-in">
        <keep-alive>
          <component :is="Component" />
        </keep-alive>
      </transition>
    </RouterView>
  </div>
</template>

<script setup>
import { RouterView } from 'vue-router';
</script>

<style scoped>
.mainbody{
  flex:1;
  height: 0;
  background-color: var(--bgColor);
  color: var(--text-color);
}
.v-enter-from,.v-leave-to{
  opacity: 0
}
.v-enter-active,.v-leave-active{
  transition: opacity .2s;
}
.v-enter-to,.v-leave-from{
  opacity: 1;
}
</style>