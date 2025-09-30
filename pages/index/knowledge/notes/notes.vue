<template>
  <div class="notes-container">
    <NoteCard
      v-for="note in notes"
      :key="note.id"
      :title="note.title"
      :time="note.time"
      :content="note.content"
      :handmould="note.handmould"
      :summary="note.summary"
      :repo="note.repo"
      :musice="note.musice"
      :tags="note.tags"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import http from '../../../../utils/http.js'
import NoteCard from '@/components/cards/NoteCard.vue'

// 笔记数据
const notes = ref([])

// Mock数据 - 作为接口请求失败的备用数据
const mockNotes = [
  {
    id: 1,
    title: 'AI研究记录',
    time: '2025-06-26 08:30',
    content: '西安视途科技有限公司是一家专注于 AI Agent 和 大模型核心技术研发 的人工智能企业，成立于2024年8月20号.',
    repo: '默认知识库',
    tags: [
      { text: 'AI', type: 'warning' },
      { text: '技术', type: 'warning' }
    ]
  },
  {
    id: 2,
    title: '多模态智能体总结',
    time: '2025-06-25 10:00',
    content: '我们目前在多模态智能体方面的研究集中在图像、语音、文本的融合交互上，并结合 LLM 的上下文管理能力展开实验。',
    repo: '默认知识库',
    musice:true,
    tags: [
      { text: '多模态', type: 'warning' },
      { text: '架构', type: 'warning' }
    ]
  },
  {
    id: 3,
    title: '知识图谱接入实验',
    time: '2025-06-24 14:00',

    content: '目前已完成 LiveKG 与 LiveAgent 的初步打通，验证了智能体对接图谱后的检索调用效果。',
    repo: '默认知识库',
    tags: [
      { text: '图谱', type: 'warning' },
      { text: '智能检索', type: 'warning' }
    ]
  },
  {
    id: 4,
    title: '部署方案调研',
    time: '2025-06-23 16:00',
    content: '对比本地化部署、私有云、混合云三种部署方式的性能、稳定性和接入成本，为下季度客户部署做好准备。',
    repo: '部署与运维',
    tags: [
      { text: '本地化', type: 'warning' },
      { text: '私有云', type: 'warning' }
    ]
  },
  {
    id: 5,
    title: '插件系统扩展记录',
    time: '2025-06-22',
    content: '新增 MCP 插件适配能力，支持按模板生成 Word、Excel 等文档，已完成测试。',
    repo: '插件系统',
    tags: [
      { text: '插件', type: 'warning' },
      { text: '模板', type: 'warning' }
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
]

// 从接口获取笔记数据
function getNotesData() {
  // 从本地存储获取token和用户信息，添加错误处理
  const token = uni.getStorageSync('token');
  const userInfo = uni.getStorageSync('userInfo') || {};
  const userId = userInfo.knowledge_user_id ? String(userInfo.knowledge_user_id) : '';
  const params = {
    token: token,
    liveKnowledge_user_id: userId
  }
  // 调用接口获取笔记列表
  http.post("/livehands/note/list", params).then(result => {
    // 检查响应状态
    if (result.code === 200 && result.data && Array.isArray(result.data)) {
      // 处理接口返回的数据，转换为需要的格式
      const formattedNotes = result.data.map((item, index) => ({
        id: item.info.id || index + 1,
        title: item.info.note_title || '未命名笔记',
        time: item.info.note_created_datetime || new Date().toLocaleString(),
        content: item.info.note_description || '',
        handmould: item.content.note_content || '',
        summary: item.content.note_summary || '',
        repo: item.info.dataset_name || '暂无知识库分类',
        musice: item.musice || false,
        // 确保tags格式正确，转换为NoteCard组件期望的格式
        tags: formatTags(item.info.note_tags)
      }))
      
      notes.value = formattedNotes 
    } else {
      // 如果接口返回的数据格式不正确，使用mock数据
      uni.showToast({ title: '获取笔记数据失败，使用本地数据', icon: 'none' })
      notes.value = mockNotes
    }
  }).catch(error => {
    // 请求失败时使用mock数据
    console.error('获取笔记数据出错:', error)
    uni.showToast({ title: '网络错误，使用本地数据', icon: 'error' })
    notes.value = mockNotes
  })
}

// 格式化标签数据，确保符合NoteCard组件期望的格式
function formatTags(tagData) {
  // 如果标签数据为空或不是数组，返回空数组
  if (!tagData || !Array.isArray(tagData)) {
    return []
  }
  
  // 处理标签数据
  return tagData.map(tag => {
    // 如果标签是字符串，转换为对象格式
    if (typeof tag === 'string') {
      return {
        text: tag,
        type: 'warning' // 默认使用warning类型
      }
    }
    // 如果标签是对象但没有text属性，使用空字符串
    else if (typeof tag === 'object' && !tag.text) {
      return {
        text: '',
        type: 'warning'
      }
    }
    // 标签已经是正确的格式
    return tag
  }).filter(tag => tag.text) // 过滤掉空标签
}

// 页面加载时获取数据
onLoad(() => {
  getNotesData()
})
</script>

<style scoped>
.notes-container {
  display: flex;
  flex-wrap: wrap;
  gap: 4vw;
  min-height: 70vh;
  max-height: calc(100vh - 240rpx); /* 考虑底部tabbar高度 */
}

/* 支持网格布局的替代方案 */
@media screen and (min-width: 768px) {
  .notes-container {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  }
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
