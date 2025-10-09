<template>
  <view class="livechat-page" :style="{ height: height }">
    <!-- 顶部 Header -->
    <view class="chat-header" v-if="showHeader">
      <text class="chat-title">{{ title }}</text>
      <u-icon name="close-circle" size="28" class="chat-close-icon" @click="handleClose" />
    </view>

    <!-- 聊天滚动区 - 确保内容区域在键盘弹出时可见 -->
    <scroll-view
      scroll-y
      class="chat-scroll"
      :scroll-into-view="scrollTarget"
      scroll-with-animation
      adjust-position="false"
    >
      <MessageItem
        v-for="(msg, index) in messages"
        :key="index"
        :message="msg"
        :id="'msg-' + index"
      />

      <!-- Typing 动画 -->
      <view class="chat-message assistant" v-if="isTyping">
        <image src="@/static/logo.png" class="avatar" />
        <view class="bubble assistant typing-bubble">
          <view class="typing-dots">
            <view class="dot"></view>
            <view class="dot"></view>
            <view class="dot"></view>
          </view>
        </view>
      </view>
    </scroll-view>

    <!-- 底部输入区 -->
    <view class="chatbar" @tap="focusInput">
      <u--input
        v-model="input"
        placeholder="向LiveHands提问"
        :prefixIcon="input.length > 0 ? 'star-fill' : 'star'"
        prefixIconStyle="font-size: 22px;color: #909399"
        border="none"
        :customStyle="{ background: '#ddd', flex: 1 }"
        ref="inputRef"
      />
      <view
        class="send-icon-wrapper"
        :class="{ active: input.length > 0 }"
        @click="send"
      >
        <u-icon name="arrow-upward" size="22" color="#fff" />
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, nextTick, onMounted, onUnmounted } from 'vue'
import MessageItem from './components/MessageItem.vue'
import http from '../../utils/http.js'

// 输入框引用
const inputRef = ref(null)
// 监听键盘高度变化，确保内容区域可见
const handleKeyboardHeight = (e) => {
  // 添加错误检查，确保e和e.detail存在
  if (e && e.detail && typeof e.detail.height === 'number' && e.detail.height > 0) {
    // 键盘弹出时，保持滚动到底部
    updateScroll()
  }
}

// 组件挂载时添加键盘事件监听
onMounted(() => {
  // 监听键盘高度变化
  uni.onKeyboardHeightChange(handleKeyboardHeight)
})

// 组件卸载时移除事件监听
onUnmounted(() => {
  uni.offKeyboardHeightChange(handleKeyboardHeight)
})

const props = defineProps({
  height: {
    type: String,
    default: '100vh'
  },
  showHeader: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: 'AI Chat'
  },
  onClose: {
    type: Function,
    default: null
  },
  // 添加来源页面标识和参数
  sourcePage: {
    type: String,
    default: '' // 'noteDetails' 或 'knowDetails'
  },
  noteSummary: {
    type: String,
    default: '' // 笔记总结内容
  },
  datasetId: {
    type: String,
    default: '' // 知识库ID
  }
})

const input = ref('')
const messages = ref([
  {
    role: 'assistant',
    blocks: [
      { type: 'text', content: '你好，我是你的智能助手，请问有什么可以帮你？' }
    ]
  }
])
const isTyping = ref(false)
const scrollTarget = ref('msg-0')

// 点击chatbar区域时聚焦输入框
const focusInput = () => {
  if (inputRef.value) {
    nextTick(() => {
      inputRef.value.focus()
    })
  }
}

// 设置请求超时时间（毫秒）
const REQUEST_TIMEOUT = 600000 // 

const send = async () => {
  const content = input.value.trim()
  if (!content) return

  // 添加用户消息
  messages.value.push({
    role: 'user',
    blocks: [{ type: 'text', content }]
  })
  input.value = ''
  updateScroll()

  // 显示正在输入状态
  isTyping.value = true
  
  try {
    // 获取token
    const token = uni.getStorageSync('token');
    if (!token) {
      throw new Error('未登录，请先登录')
    }
    
    // 根据来源页面构建不同的请求参数
    let requestParams = {}
    
    if (props.sourcePage === 'noteDetails') {
      // 从NoteDetails页面进入的请求参数
      requestParams = {
        token: token,
        in_type: 'NoteAnswerAgentKey',
        content: [props.noteSummary, content] // 笔记总结内容,AI提问页面输入框输入的内容
      }
    } else if (props.sourcePage === 'knowDetails') {
      // 从KnowDetails页面进入的请求参数
      console.log('66666',props.datasetId)
      requestParams = {
        token: token,
        datasetId: props.datasetId,
        content: [content] // AI提问页面的输入内容
      }
    } else {
      // 默认请求参数
      requestParams = {
        token: token,
        content: [content]
      }
    }
    
    // 添加请求超时处理
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('请求超时，请稍后再试'))
      }, REQUEST_TIMEOUT)
    })
    
    // 发送POST请求到/livehands/knowledge/chat接口，使用Promise.race处理超时
    const result = await Promise.race([
      http.post('/livehands/knowledge/chat', requestParams),
      timeoutPromise
    ])
    
    // 隐藏正在输入状态
    isTyping.value = false
    
    // 处理接口返回结果
    if (result && result.code === 200 && result.data) {
      // 确保结果有内容再添加到消息列表
      if (result.data && result.data.trim()) {
        messages.value.push({
          role: 'assistant',
          blocks: [
            { type: 'text', content: result.data },
            // 如果有图片等其他类型的回复，可以在这里添加
            // { type: 'image', url: result.data.imageUrl }
          ]
        })
      } else {
        // 接口返回成功但内容为空
        messages.value.push({
          role: 'assistant',
          blocks: [
            { type: 'text', content: '暂未获取到相关内容，请尝试其他问题。' }
          ]
        })
      }
    } else {
      // 接口返回失败或数据格式不正确
      messages.value.push({
        role: 'assistant',
        blocks: [
          { type: 'text', content: result?.message || '抱歉，获取AI回复失败，请稍后再试。' }
        ]
      })
    }
  } catch (error) {
    // 捕获网络错误等异常
    isTyping.value = false
    
    // 根据错误类型显示不同的提示
    let errorMessage = '网络错误，请检查网络连接后重试。'
    if (error.message.includes('超时')) {
      errorMessage = '请求超时，请稍后再试。'
    } else if (error.message.includes('未登录')) {
      errorMessage = '未登录，请先登录。'
    }
    
    messages.value.push({
      role: 'assistant',
      blocks: [
        { type: 'text', content: errorMessage }
      ]
    })
    console.error('发送聊天请求失败:', error)
  } finally {
    // 发送消息后滚动到底部，但不重新聚焦输入框
    updateScroll()
  }
}

const updateScroll = () => {
  nextTick(() => {
    scrollTarget.value = 'msg-' + (messages.value.length - 1)
  })
}

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

const handleClose = () => {
  if (props.onClose && typeof props.onClose === 'function') {
    props.onClose()
  }
}
</script>

<style scoped>
.livechat-page {
  background-color: #ffffff;
  display: flex;
  flex-direction: column;
  position: relative;
  width: 100%;
  height: 100%;
  padding: 1rem;
  box-sizing: border-box;
}

/* 确保在键盘弹出时页面内容不会被挤压 */
page {
  overflow: auto;
  height: 100vh;
}

/* Header */
.chat-header {
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  background-color: #fff;
  border-bottom: 1px solid #f0f0f0;
}
.chat-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
}
.chat-close-icon {
  position: absolute;
  right: -25rpx;
  top: 10%;
  transform: translateY(-50%);
}

/* 聊天滚动区 - 确保内容区域在键盘弹出时可见 */
.chat-scroll {
  flex: 1;
  overflow: scroll;
  padding: 30rpx 20rpx;
  background-color: #ffffff;
  border-radius: 16rpx;
  /* 防止滚动条在某些设备上影响布局 */
  scrollbar-width: none;
  -ms-overflow-style: none;
  /* 确保内容区域始终可见 */
  min-height: 0;
}
.chat-scroll::-webkit-scrollbar {
  display: none;
}

/* Typing 动画 */
.chat-message.assistant {
  display: flex;
  align-items: flex-start;
  margin-bottom: 24rpx;
}
.avatar {
  width: 48rpx;
  height: 48rpx;
  border-radius: 50%;
  margin-right: 16rpx;
}
.typing-bubble {
  padding: 14rpx 20rpx;
  background-color: #f9f9f9;
  border-radius: 20rpx;
}
.typing-dots {
  display: flex;
  gap: 8rpx;
  height: 28rpx;
  align-items: center;
}
.dot {
  width: 12rpx;
  height: 12rpx;
  background-color: #ccc;
  border-radius: 50%;
  animation: bounce 1.4s infinite ease-in-out both;
}
.dot:nth-child(1) { animation-delay: -0.32s; }
.dot:nth-child(2) { animation-delay: -0.16s; }
.dot:nth-child(3) { animation-delay: 0; }

@keyframes bounce {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
}

/* 输入栏 - 确保在底部固定显示 */
.chatbar {
  position: relative;
  bottom: 0;
  width: 100%;
  background: #ddd;
  padding: 14rpx 20rpx;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  gap: 20rpx;
  box-sizing: border-box;
  margin-top: 16rpx;
}
.send-icon-wrapper {
  width: 48rpx;
  height: 48rpx;
  border-radius: 50%;
  background-color: rgb(239, 239, 239);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.3s ease;
}
.send-icon-wrapper.active {
  background-color: #333;
}
</style>
