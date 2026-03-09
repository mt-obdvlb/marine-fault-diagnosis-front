<template>
  <div :class="['area',screen.type]">
    <section class='hero'>
      <div class='brand'>
        <img alt='船舶装备故障诊断智能问答系统' class='logo'
             src='/logo.svg'>
        <div class='brandText'>
          <div class='brandEyebrow'>Marine Fault Diagnosis
          </div>
          <h1 class='brandTitle'>
            船舶装备故障诊断智能问答系统</h1>
        </div>
      </div>
      <p class='headline'>
        面向主推进发动机、液压系统、电气设备等船舶关键装备的故障诊断辅助平台。</p>
      <p class='subline'>系统集成 RAG
        检索、知识图谱和本地会话管理，支持故障问答、知识库维护、图谱浏览与参考资料回溯。</p>
    </section>
    
    <section class='mainModules'>
      <RouterLink :to="{ name: 'AskAnswer' }"
                  class='moduleCard askCard'>
        <div class='eyebrow'>Fault QA</div>
        <div class='title'>智能问答</div>
        <div class='dscr'>
          输入故障现象、工况参数和检修记录，系统基于船舶故障知识返回诊断建议与处理步骤。
        </div>
      </RouterLink>
      <RouterLink :to="{ name: 'Kg' }"
                  class='moduleCard graphCard'>
        <div class='eyebrow'>Knowledge Graph</div>
        <div class='title'>知识图谱</div>
        <div class='dscr'>
          查看故障现象、故障原因、维修步骤、零部件与装备类型之间的关联关系。
        </div>
      </RouterLink>
    </section>
    
    <section class='utilityPanel'>
      <RouterLink :to="{ name: 'AskAnswer' }"
                  class='utilityLink'>会话诊断
      </RouterLink>
      <RouterLink :to="{ name: 'Knowledge' }"
                  class='utilityLink'>知识库管理
      </RouterLink>
      <RouterLink :to="{ name: 'Settings' }"
                  class='utilityLink'>设置
      </RouterLink>
    </section>
  </div>
</template>

<script setup>
import {RouterLink} from 'vue-router';
import {screen} from '@/utils/GLO';
</script>

<style scoped>
.area {
  box-sizing: border-box;
  padding: 40px 28px 32px;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 28px;
  overflow-y: auto;
  background: radial-gradient(circle at top left, rgba(255, 125, 79, 0.18), transparent 28%),
  radial-gradient(circle at 85% 20%, rgba(0, 166, 255, 0.18), transparent 26%),
  linear-gradient(180deg, var(--bgColor), color-mix(in srgb, var(--bgColor) 84%, #dbe9f4));
}

.hero {
  width: min(1080px, 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  text-align: center;
}

.brand {
  display: flex;
  align-items: center;
  gap: 18px;
}

.brandText {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
}

.logo {
  width: 88px;
  filter: drop-shadow(0 12px 24px rgba(0, 166, 255, 0.2));
}

.brandEyebrow {
  font-size: 12px;
  letter-spacing: 0.24em;
  text-transform: uppercase;
  color: #1976d2;
  font-weight: 700;
}

.brandTitle {
  margin: 0;
  font-size: clamp(24px, 3vw, 36px);
  line-height: 1.12;
  color: var(--text-color);
}

.headline {
  margin: 0;
  max-width: 780px;
  font-size: clamp(28px, 4vw, 46px);
  line-height: 1.1;
  font-weight: 800;
  letter-spacing: 0.02em;
  color: var(--text-color);
}

.subline {
  margin: 0;
  max-width: 760px;
  font-size: 16px;
  line-height: 1.7;
  color: var(--holder-color);
}

.mainModules {
  width: min(1080px, 100%);
  display: flex;
  gap: 22px;
}

.moduleCard {
  position: relative;
  flex: 1;
  min-height: 260px;
  padding: 28px;
  border-radius: 28px;
  color: #fff;
  text-decoration: none;
  overflow: hidden;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.12);
  transition: transform .25s, box-shadow .25s;
}

.moduleCard::before {
  content: "";
  position: absolute;
  inset: auto -10% -40% auto;
  width: 240px;
  height: 240px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.14);
  filter: blur(8px);
}

.moduleCard:hover {
  transform: translateY(-6px);
  box-shadow: 0 30px 72px rgba(0, 0, 0, 0.18);
}

.askCard {
  background: linear-gradient(135deg, #0d3b66, #1976d2 58%, #49c6e5);
}

.graphCard {
  background: linear-gradient(135deg, #3d1f56, #7a306c 50%, #ef8354);
}

.eyebrow {
  position: relative;
  z-index: 1;
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.18em;
  opacity: 0.78;
}

.title {
  position: relative;
  z-index: 1;
  margin-top: 18px;
  font-size: 40px;
  font-weight: 800;
  letter-spacing: 0.04em;
}

.dscr {
  position: relative;
  z-index: 1;
  margin-top: 14px;
  max-width: 420px;
  font-size: 16px;
  line-height: 1.7;
  opacity: 0.94;
}

.utilityPanel {
  width: min(1080px, 100%);
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
}

.utilityLink {
  min-width: 144px;
  padding: 14px 18px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--bgColor) 72%, #ffffff);
  border: 1px solid color-mix(in srgb, var(--subBgColor) 78%, transparent);
  color: var(--text-color);
  text-decoration: none;
  text-align: center;
  font-weight: 700;
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.05);
  transition: transform .2s, box-shadow .2s, border-color .2s;
}

.utilityLink:hover {
  transform: translateY(-2px);
  box-shadow: 0 14px 32px rgba(0, 0, 0, 0.08);
  border-color: rgba(25, 118, 210, 0.28);
}

@media (max-width: 900px) {
  .area {
    justify-content: flex-start;
    padding-top: 32px;
  }
  
  .brand {
    flex-direction: column;
    gap: 12px;
  }
  
  .brandText {
    align-items: center;
  }
  
  .mainModules {
    flex-direction: column;
  }
  
  .moduleCard {
    min-height: 220px;
  }
}
</style>
