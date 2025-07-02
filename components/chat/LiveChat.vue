<template>
  <view class="livechat-page" :style="{ height: height }">
    <!-- 顶部 Header -->
    <view class="chat-header" v-if="showHeader">
      <text class="chat-title">{{ title }}</text>
      <u-icon name="close-circle" size="28" class="chat-close-icon" @click="handleClose" />
    </view>

    <!-- 聊天滚动区 -->
    <scroll-view
      scroll-y
      class="chat-scroll"
      :scroll-into-view="scrollTarget"
      scroll-with-animation
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
    <view class="chatbar">
      <u--input
        v-model="input"
        placeholder="向LiveHands提问"
        :prefixIcon="input.length > 0 ? 'star-fill' : 'star'"
        prefixIconStyle="font-size: 22px;color: #909399"
        border="none"
        :customStyle="{ background: '#ddd', flex: 1 }"
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
import { ref, nextTick } from 'vue'
import MessageItem from './components/MessageItem.vue'

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

  // 模拟AI回复
  isTyping.value = true
  await delay(1000)
  isTyping.value = false

  messages.value.push({
    role: 'assistant',
    blocks: [
      { type: 'text', content: '收到，这是AI的模拟回复。' },
      { type: 'image', url: 'https://www.sitoai.cn/livehand/assets/images/sito_logo.png' }
    ]
  })
  updateScroll()
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
  padding: 1rem;
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
  right: 30rpx;
  top: 50%;
  transform: translateY(-50%);
}

/* 聊天滚动区 */
.chat-scroll {
  flex: 1;
  overflow: scroll;
  padding: 30rpx 20rpx;
  background-color: #ffffff;
  border-radius: 16rpx;
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

/* 输入栏 */
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
