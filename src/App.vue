<template>
  <transition>
    <Dialog />
  </transition>
  <AsideMenu v-show="screen.type==='ver'"></AsideMenu>
  <Header />
  <Main />
</template>

<script setup>
import { screen } from './utils/GLO';

import Header from "./components/Header.vue";
import Main from "./components/Main.vue";
import Dialog from './components/Dialog.vue';
import AsideMenu from "./components/AsideMenu.vue";

</script>

<style scoped>
.v-enter-from,.v-leave-to{
  opacity: 0
}
.v-enter-active,.v-leave-active{
  transition: opacity .3s
}
.v-enter-to,.v-leave-from{
  opacity: 1
}
</style>
