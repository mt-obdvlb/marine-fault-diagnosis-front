import './assets/main.css'
import '@fortawesome/fontawesome-free/css/all.css'
import Markdown from './utils/Markdown.vue';
import router from './utils/router';

import {createApp} from 'vue'
import App from './App.vue'

const app=createApp(App)

//Markdown组件
app.component("Markdown",Markdown)

app.use(router)

app.mount('#app')
