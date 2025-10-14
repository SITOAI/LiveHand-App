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
        <!-- 文字输入模式 -->
        <template v-if="!isVoiceMode">
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
            class="voice-toggle-btn"
            @click.stop="toggleVoiceMode"
          >
            <image src="../../static/micro.png" class="voice-icon" mode="aspectFit"></image>
          </view>
          <view
            class="send-icon-wrapper"
            :class="{ active: input.length > 0  }"
            @click="send"
            v-if="input.length > 0"
          >
            <image src="../../static/send.png" class="send-icon" mode="aspectFit"></image>
          </view>
        </template>
        
        <!-- 语音输入模式 -->
        <template v-else>
          <view class="voice-mode-indicator">按住 说话</view>
          <view
            class="voice-toggle-btn"
            @click.stop="toggleVoiceMode"
          >
            <image src="../../static/keyboard.png" class="voice-icon" mode="aspectFit"></image>
          </view>
        </template>
        
        <!-- 按住说话区域 - 覆盖整个输入栏 -->
        <view 
          class="voice-hold-area" 
          v-if="isVoiceMode"
          :class="{ 'recording': isRecording }"
          @touchstart="startVoiceRecording"
          @touchend="stopVoiceRecording"
          @touchcancel="cancelVoiceRecording"
        >
        </view>
      </view>
    </view>
    
    <!-- 录音提示弹窗 -->
    <view class="recording-toast" v-if="isRecording">
      <view class="recording-icon"></view>
      <text class="recording-text">{{ wsConnectionStatus }}</text>
      <!-- 实时识别文本显示 -->
      <text class="partial-text" v-if="partialText">{{ partialText }}</text>
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
// 语音模式相关状态
const isVoiceMode = ref(false)
const isRecording = ref(false)
const recorderManager = uni.getRecorderManager()
const innerAudioContext = uni.createInnerAudioContext()
// WebSocket相关变量
let socketTask = null
let audioStreamInterval = null
const isWebSocketConnected = ref(false)
const partialText = ref('') // 存储实时反馈的文本
const wsConnectionStatus = ref('正在录音...松开结束') // WebSocket连接状态提示

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

// 组件挂载时添加键盘事件监听和录音事件监听
onMounted(() => {
  // 监听键盘高度变化
  uni.onKeyboardHeightChange(handleKeyboardHeight)
  
  // 监听录音停止事件
  recorderManager.onStop((res) => {
    console.log("🚀 ~ res:", res)
    
    // 先更新状态
    isRecording.value = false
    
    // 判断录音是否有效：检查是否有临时文件路径，且partialText不为空
    const hasValidRecording = res && res.tempFilePath && partialText.value.trim() !== ''
    
    // 如果录音无效（没有生成内容），提示用户
    if (!hasValidRecording) {
      uni.showToast({
        title: '未检测到有效语音，请重试',
        icon: 'none'
      })
      // 停止WebSocket连接
      stopWebSocket()
      return
    }
    
    // 处理最终识别结果
    handleRecognizeResult({ result: partialText.value })
    
    // 停止WebSocket连接
    stopWebSocket()
  })
  
  // 监听录音错误事件
  recorderManager.onError(handleRecordError)
  
  // 监听录音实时数据事件
  recorderManager.onFrameRecorded((res) => {
    if (res.isLastFrame) {
      // 最后一帧数据
      console.log('录音结束')
    } else if (isWebSocketConnected.value && socketTask) {
      // 发送音频数据到WebSocket
      try {
        socketTask.send({
          data: res.frameBuffer,
          success: () => {
            // 成功发送
          },
          fail: (err) => {
            console.error('发送音频数据失败:', err)
          }
        })
      } catch (error) {
        console.error('发送音频数据失败:', error)
      }
    }
  })
    })

// 组件卸载时移除事件监听
onUnmounted(() => {
  uni.offKeyboardHeightChange(handleKeyboardHeight)
  // 清理WebSocket连接
  stopWebSocket()
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
  if (!isVoiceMode.value && inputRef.value) {
    nextTick(() => {
      inputRef.value.focus()
      updateScroll()
    })
  }
}

// 切换语音/文字输入模式
const toggleVoiceMode = () => {
  if (isLoading.value) return
  
  // 隐藏键盘
  uni.hideKeyboard()
  
  // 切换模式
  isVoiceMode.value = !isVoiceMode.value
  
  console.log(`已切换到${isVoiceMode.value ? '语音' : '文字'}输入模式`)
}

// 初始化WebSocket连接
const initWebSocket = () => {
  try {
    wsConnectionStatus.value = '正在连接服务器...'
    socketTask = uni.connectSocket({
      url: 'ws://192.168.1.246:8082/livehands/asr/ws',
      success: () => {
      },
      fail: (err) => {
        wsConnectionStatus.value = '连接失败，请检查网络'
        setTimeout(() => {
          if (isRecording.value) {
            stopWebSocket()
            initWebSocket()
          }
        }, 2000)
      }
    })
    
    // 监听连接打开
    socketTask.onOpen(() => {
      isWebSocketConnected.value = true
      wsConnectionStatus.value = '正在录音...松开结束'
      
      // 发送开始参数
      socketTask.send({
        data: JSON.stringify({ type: 'start', lang: 'zh' }),
        success: () => {
          // 设置格式参数
          setTimeout(() => {
            socketTask.send({
              data: JSON.stringify({ type: 'format', mime: 'mpeg' }), 
              success: () => {
                console.log('格式参数发送成功')
              },
              fail: (err) => {
                console.error('格式参数发送失败:', err)
              }
            })
          }, 100)
        },
        fail: (err) => {
          console.error('开始参数发送失败:', err)
        }
      })
    })
    
    // 监听接收到消息
    socketTask.onMessage((res) => {
      // 处理接收到的消息
      try {
        const data = JSON.parse(res.data)
        console.log('接收到WebSocket消息6666666666:', res)
        wsConnectionStatus.value = '正在录音...松开结束'
        if (data.type === 'partial' && data.text) {
          partialText.value = data.text
        }
      } catch (error) {
        console.error('解析WebSocket消息失败:', error)
      }
    })
    
    // 监听连接关闭
    socketTask.onClose(() => {
      console.log('WebSocket连接已关闭')
      isWebSocketConnected.value = false
    })
    
    // 监听连接错误
    socketTask.onError((error) => {
      console.error('WebSocket错误:', error)
      isWebSocketConnected.value = false
      wsConnectionStatus.value = '连接失败，正在重试...'
      
      // 尝试重新连接
      setTimeout(() => {
        if (isRecording.value) {
          console.log('尝试重新连接WebSocket')
          stopWebSocket()
          initWebSocket()
        }
      }, 2000)
    })
    
    // 设置连接超时
    setTimeout(() => {
      if (socketTask && !isWebSocketConnected.value) {
        console.error('WebSocket连接超时')
        stopWebSocket()
        wsConnectionStatus.value = '连接超时，正在重试...'
        
        // 尝试重新连接
        setTimeout(() => {
          if (isRecording.value) {
            console.log('尝试重新连接WebSocket')
            initWebSocket()
          }
        }, 2000)
      }
    }, 5000)
  } catch (error) {
    console.error('初始化WebSocket失败:', error)
    wsConnectionStatus.value = '连接失败，请检查网络'
  }
}

// 停止WebSocket连接
const stopWebSocket = () => {
  try {
    if (socketTask && isWebSocketConnected.value) {
      // 发送停止命令
      socketTask.send({
        data: JSON.stringify({ type: 'stop' }),
        success: () => {
          console.log('停止命令发送成功')
        },
        fail: (err) => {
          console.error('停止命令发送失败:', err)
        }
      })
      // 关闭连接
      setTimeout(() => {
        socketTask.close({
          success: () => {
            console.log('WebSocket连接已关闭')
          },
          fail: (err) => {
            console.error('关闭WebSocket失败:', err)
          }
        })
        socketTask = null
      }, 300)
    }
    
    // 确保清除定时器
    if (audioStreamInterval) {
      clearInterval(audioStreamInterval)
      audioStreamInterval = null
    }
    
    isWebSocketConnected.value = false
  } catch (error) {
    console.error('停止WebSocket连接失败:', error)
  }
}

// 开始录音流程 - 定义在调用之前
const startRecordingProcess = () => {
  // 录音配置 - 优化参数以提高兼容性，简化配置以适应App环境
  const options = {
    duration: 60000, // 最大录音时长60秒
    sampleRate: 16000,
    numberOfChannels: 1,
    encodeBitRate: 96000,
    format: 'mp3', // 在App环境中mp3格式兼容性更好
    frameSize: 50
  }
  
  // 初始化WebSocket连接
  initWebSocket()
  
  // 开始录音
  recorderManager.start(options)
  isRecording.value = true
  
  console.log('开始录音')
}

// 开始语音录音
const startVoiceRecording = () => {
  if (isLoading.value || isRecording.value) return
  
  // 重置状态
  partialText.value = ''
  wsConnectionStatus.value = '正在准备录音...'
  startRecordingProcess()
}
// 停止语音录音
const stopVoiceRecording = () => {
  if (!isRecording.value) return
  
  // 停止录音
  recorderManager.stop()
  
  // 确保发送停止命令
  if (socketTask && isWebSocketConnected.value) {
    socketTask.send({
      data: JSON.stringify({ type: 'stop' }),
      success: () => {
        console.log('停止命令发送成功')
      },
      fail: (err) => {
        console.error('停止命令发送失败:', err)
      }
    })
  }
  
  console.log('停止录音')
}

// 取消语音录音
const cancelVoiceRecording = () => {
  if (isRecording.value) {
    recorderManager.stop()
    isRecording.value = false
    stopWebSocket()
    partialText.value = ''
    console.log('取消录音')
  }
}

// 录音错误处理
const handleRecordError = (err) => {
  console.error('录音失败:', err)
  isRecording.value = false
  stopWebSocket()
  partialText.value = ''
  uni.showToast({
    title: '录音失败，请重试',
    icon: 'none'
  })
}

// 语音识别结果处理
const handleRecognizeResult = (res) => {
  // 优先使用partialText中的识别结果
  const finalResult = partialText.value.trim() || (res && res.result && res.result.trim()) || ''
  
  if (finalResult) {
    // 将识别结果回填到输入框
    input.value = finalResult
    // 自动切换回文字模式并聚焦输入框
    isVoiceMode.value = false
    nextTick(() => {
      if (inputRef.value) {
        inputRef.value.focus()
      }
    })
    console.log('语音识别结果:', finalResult)
  } else {
    console.error('语音识别失败或结果为空:', res, 'partialText:', partialText.value)
    // 尝试使用uni-app内置的语音识别作为备选方案
    fallbackVoiceRecognition()
  }
  // 重置部分文本
  partialText.value = ''
}

// 备选语音识别方案
const fallbackVoiceRecognition = () => {
  // 显示加载提示
  uni.showLoading({
    title: '尝试备选识别方案...'
  })
  
  // 使用uni-app内置的语音识别API作为备选
  uni.getRecorderManager().stop()
  
  // 获取最近一次录音的临时文件
  const tempFilePath = uni.getRecorderManager().tempFilePath || ''
  
  if (tempFilePath) {
    uni.recognizeVoice({
      filePath: tempFilePath,
      lang: 'zh_CN',
      success: (result) => {
        uni.hideLoading()
        if (result && result.result) {
          input.value = result.result
          isVoiceMode.value = false
          nextTick(() => {
            if (inputRef.value) {
              inputRef.value.focus()
            }
          })
          console.log('备选语音识别成功:', result.result)
        } else {
          showRecognitionError()
        }
      },
      fail: (err) => {
        uni.hideLoading()
        console.error('备选语音识别也失败:', err)
        showRecognitionError()
      }
    })
  } else {
    uni.hideLoading()
    showRecognitionError()
  }
}

// 显示识别错误提示
const showRecognitionError = () => {
  uni.showToast({
    title: '语音识别失败，请重试',
    icon: 'none'
  })
  // 自动切换回文字模式
  isVoiceMode.value = false
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
        // 使用uni-app的选择器API，不使用this（在setup中不可用）
        const query = uni.createSelectorQuery()
        query.select('.chat-scroll').fields({
          scrollHeight: true,
          scrollOffset: true
        }, (res) => {
          if (res) {
            // 尝试使用页面滚动
            uni.pageScrollTo({
              scrollTop: res.scrollHeight,
              duration: 0
            })
          }
        })
        query.exec()
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

  const handleScrollToLower = () => {
    // 如果需要分页加载历史聊天记录，可以在这里触发加载
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
  position: relative;
  min-height: 80rpx;
}

/* 语音模式指示器 */
.voice-mode-indicator {
  flex: 1;
  color: #666;
  font-size: 28rpx;
  text-align: center;
}

/* 语音模式切换按钮 */
.voice-toggle-btn {
  width: 56rpx;
  height: 56rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.5);
}

.voice-icon {
  width: 40rpx;
  height: 40rpx;
}

/* 按住说话区域 */
.voice-hold-area {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #333;
  font-size: 28rpx;
  cursor: pointer;
  z-index: 1;
}

.voice-hold-area.recording {
  background-color: rgba(0, 0, 0, 0.05);
}

/* 录音提示弹窗 */
.recording-toast {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 30rpx;
  border-radius: 16rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 9999;
}

.recording-icon {
  width: 80rpx;
  height: 80rpx;
  background-color: #ff4d4f;
  border-radius: 50%;
  margin-bottom: 20rpx;
  animation: pulse 1s infinite;
}

.recording-text {
  font-size: 28rpx;
  color: white;
  margin-bottom: 10rpx;
}

/* 实时识别文本样式 */
.partial-text {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.9);
  margin-top: 10rpx;
  max-width: 600rpx;
  word-break: break-word;
  text-align: center;
}

@keyframes pulse {
  0% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.05);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
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
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.3s ease;
}

</style>
