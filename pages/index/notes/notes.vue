<template>
  <div class="notes-container">
    <NoteCard v-for="n in 20" :key="n"
	title="AI研究记录"
	  time="2025-06-26 13:32"
	  content="西安视途科技有限公司是一家专注于 AI Agent 和 大模型核心技术研发 的人工智能企业，成立于2024年，总部位于西安市经济技术开发区。我们致力于提供本地化部署能力、行业适配性强的智能体平台解决方案，产品涵盖 智能知识管理、自动化调研、多形态智能体客户端 等领域，已服务政务、能源、企业IT、交通等多个行业客户。"
	  repo="大模型研究"
	  :tags="[
	      { text: 'AI', type: 'warning' },
	      { text: '技术', type: 'success' },
	    ]"
	  >
      笔记卡片 {{ n }}
    </NoteCard>
  </div>
</template>

<script setup>
import NoteCard from '@/components/cards/NoteCard.vue' // 按需调整路径
</script>

<style scoped>
.notes-container {
  display: flex;
  flex-wrap: wrap;
  gap: 4vw;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
}

</style>
