<template>
  <div class="notes-container">
    <!-- 数据加载完成后才根据数据状态显示内容 -->
    <template v-if="!isLoading">
      <!-- 有数据时显示笔记卡片 -->
      <template v-if="notes.length > 0">
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
      </template>
      <!-- 无数据时显示提示信息 -->
      <div v-else class="empty-state">
        <view class="empty-icon">📝</view>
        <view class="empty-title">暂无知识笔记</view>
        <view class="empty-description">您还没有创建任何知识笔记，点击下方加号开始记录您的思考</view>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import http from '../../../../utils/http.js'
import NoteCard from '@/components/cards/NoteCard.vue'
import { mockNotes } from '../../../../utils/mock/notesData.js'

// 笔记数据
const notes = ref([])
// 数据加载状态标志
const isLoading = ref(true)
// 定时器引用
let refreshTimer = null
// 自动刷新间隔（毫秒）
const AUTO_REFRESH_INTERVAL = 10000 // 20秒

// 从接口获取笔记数据
function getNotesData() {
  // 设置为加载中状态
  isLoading.value = true
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
    // 数据加载完成
    isLoading.value = false
  }).catch(error => {
    // 请求失败时使用mock数据
    console.error('获取笔记数据出错:', error)
    uni.showToast({ title: '网络错误，使用本地数据', icon: 'error' })
    notes.value = mockNotes
    // 数据加载完成
    isLoading.value = false
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

// 页面显示时启动定时刷新
onMounted(() => {
  startAutoRefresh()
  // 监听全局数据更新事件
  uni.$on('notesDataUpdated', handleDataUpdateEvent)
})

// 页面隐藏时停止定时刷新
onUnmounted(() => {
  stopAutoRefresh()
  // 移除事件监听
  uni.$off('notesDataUpdated', handleDataUpdateEvent)
})

// 启动自动刷新
function startAutoRefresh() {
  // 避免重复创建定时器
  stopAutoRefresh()
  // 创建新的定时器，每20秒执行一次刷新
  refreshTimer = setInterval(() => {
    refreshNotesData()
  }, AUTO_REFRESH_INTERVAL)
}

// 停止自动刷新
function stopAutoRefresh() {
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
}

// 处理数据更新事件
function handleDataUpdateEvent() {
  // 当接收到后台数据更新事件时立即刷新数据
  refreshNotesData()
}

// 刷新笔记数据（无感知）
async function refreshNotesData() {
  try {
    // 获取当前的数据快照用于比较
    const beforeData = JSON.stringify(notes.value)
    
    // 重新获取数据
    await new Promise((resolve, reject) => {
      // 从本地存储获取token和用户信息
      const token = uni.getStorageSync('token')
      const userInfo = uni.getStorageSync('userInfo') || {}
      const userId = userInfo.knowledge_user_id ? String(userInfo.knowledge_user_id) : ''
      const params = {
        token: token,
        liveKnowledge_user_id: userId
      }
      
      http.post("/livehands/note/list", params).then(result => {
        try {
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
            
            // 比较新数据与旧数据是否不同
            const afterData = JSON.stringify(formattedNotes)
            if (beforeData !== afterData) {
              // 应用新数据
              notes.value = formattedNotes
              console.log('笔记数据已自动更新')
            }
          }
          resolve()
        } catch (error) {
          console.error('处理笔记数据时出错:', error)
          resolve() // 即使处理出错也继续执行
        }
      }).catch(error => {
        console.error('自动刷新笔记数据请求失败:', error)
        resolve() // 即使请求失败也不阻止后续执行
      })
    })
  } catch (error) {
    console.error('自动刷新过程出错:', error)
  }
}
</script>

<style scoped>
.notes-container {
  display: flex;
  flex-direction: column;
  padding: 0 20rpx;
  padding-bottom: 120rpx; /* 保留底部内边距，确保内容不被tabbar遮挡 */
  gap: 20rpx; /* 减少卡片之间的间距 */
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

/* 空状态样式 */
.empty-state {
  width: 100%;
  min-height: 60vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 80rpx 40rpx;
  box-sizing: border-box;
}

.empty-icon {
  font-size: 120rpx;
  margin-bottom: 40rpx;
  opacity: 0.8;
}

.empty-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 20rpx;
}

.empty-description {
  font-size: 28rpx;
  color: #999;
  text-align: center;
  line-height: 1.6;
  max-width: 80%;
}
</style>
