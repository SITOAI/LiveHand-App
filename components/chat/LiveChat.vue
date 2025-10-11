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
      :style="{ paddingBottom: isKeyboardVisible ? keyboardHeight + 'px' : '0px' }"
      @scrolltolower="handleScrollToLower"
      @touchmove.stop.prevent=""
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
      
      <!-- 底部占位元素，确保最后一条消息和输入框之间有20rpx的距离 -->
      <view class="bottom-spacing"></view>
    </scroll-view>

    <!-- 底部输入区 -->
    <view class="chatbar-container" :style="{ transform: `translateY(-${keyboardHeight}px)` }">
      <view 
        class="chatbar" 
        @tap="focusInput"
        :class="{ 'chatbar-disabled': isLoading }"
        :style="{ pointerEvents: isLoading ? 'none' : 'auto' }"
      >
      <u--input
        v-model="input"
        placeholder="向LiveHands提问"
        :prefixIcon="input.length > 0 ? 'star-fill' : 'star'"
        prefixIconStyle="font-size: 22px;color: #909399"
        border="none"
        :customStyle="{ background: '#ddd', flex: 1 }"
        :adjust-position="false"
        ref="inputRef"
      />
      <view
        class="send-icon-wrapper"
        :class="{ active: input.length > 0  }"
        @click="send"
      >
        <u-icon name="arrow-upward" size="22" color="#fff" />
      </view>
    </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue'
import MessageItem from './components/MessageItem.vue'
import http from '../../utils/http.js'

// 输入框引用
const inputRef = ref(null)
// 键盘高度 - 用于响应式地调整布局
const keyboardHeight = ref(0)
// 计算键盘是否可见
const isKeyboardVisible = computed(() => keyboardHeight.value > 0)

// 监听键盘高度变化，响应式调整布局
const handleKeyboardHeight = (e) => {
  // 添加错误检查，确保e和e.detail存在
  if (e && e.detail && typeof e.detail.height === 'number') {
    keyboardHeight.value = e.detail.height
    
    // 键盘弹出时，保持滚动到底部
    if (e.detail.height > 0) {
      updateScroll()
    }
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



// 点击chatbar区域时聚焦输入框并调整页面高度
const focusInput = () => {
  try {
    if (inputRef.value) {
      nextTick(() => {
        // 添加50ms延迟确保DOM更新完成，防止黑屏闪烁
        setTimeout(() => {
          // 首选方案：使用uView组件提供的setFocus方法
          if (typeof inputRef.value.setFocus === 'function') {
            inputRef.value.setFocus()
          } 
          // 降级方案1：检查是否有focus方法直接调用
          else if (typeof inputRef.value.focus === 'function') {
            inputRef.value.focus()
          } 
          // 降级方案2：对于手机App环境，尝试访问组件内部元素
          else if (inputRef.value.$el) {
            try {
              // 尝试访问内部input元素（适用于大多数框架）
              const nativeInput = inputRef.value.$el.querySelector ? 
                inputRef.value.$el.querySelector('input') : null
              
              if (nativeInput && typeof nativeInput.focus === 'function') {
                nativeInput.focus()
              } else if (typeof inputRef.value.$el.click === 'function') {
                // 最后降级：直接点击组件区域
                inputRef.value.$el.click()
              }
            } catch (e) {
              console.warn('访问组件内部元素失败:', e)
            }
          }
          // 确保内容滚动到底部
          updateScroll()
        }, 50)
      })
    } else {
      updateScroll()
    }
  } catch (error) {
    console.warn('聚焦输入框失败:', error)
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

  // 显示正在输入状态和禁用发送按钮
  isTyping.value = true
  isLoading.value = true
  
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
        // 去除内容前面的空白字符（包括换行符），解决显示时前面有空行的问题
        const trimmedContent = result.data.trimStart()
        messages.value.push({
          role: 'assistant',
          blocks: [
            { type: 'text', content: trimmedContent },
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
    isLoading.value = false
    
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
    // 请求完成，启用发送按钮
    isLoading.value = false
    // 发送消息后滚动到底部，但不重新聚焦输入框
    updateScroll()
  }
}

const updateScroll = () => {
  nextTick(() => {
    scrollTarget.value = 'msg-' + (messages.value.length - 1)
    
    // 无论键盘是否可见，都尝试滚动到底部
    setTimeout(() => {
      try {
        const scrollView = document.querySelector('.chat-scroll')
        if (scrollView) {
          // 强制滚动到底部
          scrollView.scrollTop = scrollView.scrollHeight
          
          // 如果通过ID滚动失败，再尝试直接滚动到底部
          setTimeout(() => {
            if (scrollView.scrollTop < scrollView.scrollHeight - 100) {
              scrollView.scrollTop = scrollView.scrollHeight
            }
          }, 50)
        }
      } catch (e) {
        console.warn('滚动到底部失败:', e)
      }
    }, 50)
  })
}

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

const handleClose = () => {
  if (props.onClose && typeof props.onClose === 'function') {
    props.onClose()
  }
}

// 处理滚动到底部事件，可以用于加载更多历史消息
  const handleScrollToLower = () => {
    // 这里可以添加加载历史消息的逻辑
    // 如果需要分页加载历史聊天记录，可以在这里触发加载
    console.log('滚动到底部，可以加载更多历史消息')
  }

  // 用于控制发送按钮的禁用状态
  const isLoading = ref(false)
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
  overflow: hidden; /* 防止内容溢出 */
  touch-action: none; /* 防止整个页面的触摸滑动 */
}

/* 确保在键盘弹出时页面内容不会被挤压 */
page {
  overflow: hidden;
  height: 100vh;
  touch-action: none;
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
  z-index: 10; /* 确保Header在最上层 */
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
  z-index: 1; /* 确保层级正确 */
}
.chat-scroll::-webkit-scrollbar {
  display: none;
}

/* 底部占位元素样式 */
.bottom-spacing {
  height: 20rpx;
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

/* 输入栏容器 - 实现平滑的上移动画 */
.chatbar-container {
  position: relative;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 0 1rem 16rpx;
  box-sizing: border-box;
  z-index: 10;
  transition: transform 0.3s cubic-bezier(0.165, 0.84, 0.44, 1);
  background-color: #ffffff; /* 添加背景色防止黑色闪屏 */
}

/* 输入栏 */
.chatbar {
  background: #ddd;
  padding: 14rpx 20rpx;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  gap: 20rpx;
  box-sizing: border-box;
  user-select: none; /* 防止用户选择文本 */
  transition: all 0.3s ease;
}

/* 输入栏禁用状态 */
.chatbar.chatbar-disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.chatbar.chatbar-disabled .u-input__wrapper {
  cursor: not-allowed;
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

</style>
