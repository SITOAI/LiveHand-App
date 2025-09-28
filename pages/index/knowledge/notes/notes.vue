<template>
  <div class="notes-container">
    <NoteCard
      v-for="note in notes"
      :key="note.id"
      :title="note.title"
      :time="note.time"
      :content="note.content"
      :repo="note.repo"
      :tags="note.tags"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import NoteCard from '@/components/cards/NoteCard.vue'

// 假数据结构
const notes = ref([
  {
    id: 1,
    title: 'AI研究记录',
    time: '2025-06-26',
    content: '西安视途科技有限公司是一家专注于 AI Agent 和 大模型核心技术研发 的人工智能企业，成立于2024年8月20号.',
    repo: '大模型研究',
    tags: [
      { text: 'AI', type: 'warning' },
      { text: '技术', type: 'success' }
    ]
  },
  {
    id: 2,
    title: '多模态智能体总结',
    time: '2025-06-25',
    content: '我们目前在多模态智能体方面的研究集中在图像、语音、文本的融合交互上，并结合 LLM 的上下文管理能力展开实验。',
    repo: '智能体架构',
    tags: [
      { text: '多模态', type: 'primary' },
      { text: '架构', type: 'success' }
    ]
  },
  {
    id: 3,
    title: '知识图谱接入实验',
    time: '2025-06-24',
    content: '目前已完成 LiveKG 与 LiveAgent 的初步打通，验证了智能体对接图谱后的检索调用效果。',
    repo: '知识中台',
    tags: [
      { text: '图谱', type: 'warning' },
      { text: '智能检索', type: 'success' }
    ]
  },
  {
    id: 4,
    title: '部署方案调研',
    time: '2025-06-23',
    content: '对比本地化部署、私有云、混合云三种部署方式的性能、稳定性和接入成本，为下季度客户部署做好准备。',
    repo: '部署与运维',
    tags: [
      { text: '本地化', type: 'success' },
      { text: '私有云', type: 'info' }
    ]
  },
  {
    id: 5,
    title: '插件系统扩展记录',
    time: '2025-06-22',
    content: '新增 MCP 插件适配能力，支持按模板生成 Word、Excel 等文档，已完成测试。',
    repo: '插件系统',
    tags: [
      { text: '插件', type: 'primary' },
      { text: '模板', type: 'success' }
    ]
  },
  {
    id: 6,
    title: '知识专利',
    time: '2025-06-22',
    content: '本知识专利记录了某领域核心技术的创新方法与实现路径，涵盖算法设计、系统架构及应用场景，具有独创性与实用价值，为相关技术研发与产业化提供知识产权保障。',
    repo: '知识专利',
    tags: [
      { text: '知识专利', type: 'primary' },
      { text: '法律', type: 'success' }
    ]
  }
])
</script>

<style scoped>
.notes-container {
  display: flex;
  flex-wrap: wrap;
  gap: 4vw;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
}

.delete-icon {
  position: absolute;
  top: 12px;
  right: 12px;
  cursor: pointer;
  color: #999;
  transition: color 0.3s;
}
</style>
