// 路由组件
import {
  createRouter,
  createWebHashHistory
} from 'vue-router';

import AskAnswer from '@/components/views/AskAnswer.vue';

const
  HomePage = () => import('@/components/views/HomePage.vue'),
  Knowledge = () => import('@/components/views/Knowledge.vue'),
  Settings = () => import('@/components/views/Settings.vue'),
  // 知识图谱展示功能目前无需登录状态即可访问
  Kg = () => import('@/components/views/Kg.vue')

/** 路由配置 */
const routes = [
  {
    path: '/',
    name: 'HomePage',
    component: HomePage,
    meta: {title: '船舶装备故障诊断智能问答系统'}
  },
  {
    path: '/askanswer',
    name: 'AskAnswer',
    component: AskAnswer,
    meta: {title: '智能问答 - 船舶装备故障诊断系统'}
  },
  {
    path: '/knowledge',
    name: 'Knowledge',
    component: Knowledge,
    meta: {title: '知识库管理 - 船舶装备故障诊断系统'}
  },
  {
    path: '/settings',
    name: 'Settings',
    component: Settings,
    meta: {title: '系统设置 - 船舶装备故障诊断系统'}
  },
  {
    path: '/kg',
    name: 'Kg',
    component: Kg,
    meta: {title: '知识图谱 - 船舶装备故障诊断系统'}
  },
  {
    path: '/:all(.*)',
    redirect: '/'
  }
]

/** 路由器 */
const router = createRouter({
  history: createWebHashHistory(),
  routes
})

router.beforeEach((to, from) => {
  // 设置页面标题
  if (to.meta && to.meta.title) {
    document.title = to.meta.title;
  }
  
  // 其他情况正常访问
  return true
})

export default router
