<template>
  <u-popup
    :show="show"
    mode="bottom"
    :safe-area-inset-top="true"
    :overlay="true"
    :closeable="true"
    :close-on-click-overlay="true"
    @close="closePopup"
    @update:show="val => emit('update:show', val)"
    :duration="300"
    ref="popupRef"
  >
    <view
      class="panel-wrapper"
      @touchstart="onTouchStart"
      @touchend="onTouchEnd"
    >
      <!-- 顶部返回按钮 - 完全隔离于web-view，使用更高的z-index和固定定位 -->
      <view class="static-header">
        <view class="back-button" @click="closePopup" style="position: relative; z-index: 9999;">
          <u-icon name="arrow-left" size="24" />
        </view>
      </view>

      <!-- 嵌入网页内容 -->
      <view class="webview-container" style="z-index: 1;">
        <web-view 
          :src="url" 
          :webview-styles="{ 
            width: '100%',
            height: '100%'
          }" 
          :fullscreen="false" 
          :update-title="false" 
          @message="handleWebviewMessage"
          @load="onWebviewLoad"
        />
      </view>
    </view>
  </u-popup>
</template>

<script setup>
import { defineProps, defineEmits, ref, onMounted, watch } from 'vue'

const props = defineProps({
  show: Boolean
})
const emit = defineEmits(['update:show'])

// 使用简化版URL，可能减少一些复杂脚本的加载
const url = ref('https://www.xiaohongshu.com/user/profile/5fb3d0260000000001006910')
const popupRef = ref(null)

// 增强的关闭弹窗函数，确保安全关闭
function closePopup() {
  try {
    // 先尝试清理webview资源
    let pages = getCurrentPages()
    let page = pages[pages.length - 1]
    let currentWebview = page.$getAppWebview()
    
    if (currentWebview && currentWebview.children().length > 0) {
      var wv = currentWebview.children()[0]
      if (wv && typeof wv.destroy === 'function') {
        // 如果有destroy方法，尝试调用
        try {
          wv.destroy()
        } catch (e) {
          console.log('Webview destroy failed, continuing to close popup')
        }
      }
    }
  } catch (error) {
    console.log('Error cleaning webview resources:', error)
  } finally {
    // 无论如何都关闭弹窗
    emit('update:show', false)
  }
}

// 暴露closePopup方法供父组件调用
defineExpose({
  closePopup
})

// 手势滑动关闭逻辑
let startX = 0
let startY = 0

function onTouchStart(e) {
  startX = e.touches[0].clientX
  startY = e.touches[0].clientY
}

function onTouchEnd(e) {
  const endX = e.changedTouches[0].clientX
  const endY = e.changedTouches[0].clientY
  const deltaX = endX - startX
  const deltaY = Math.abs(endY - startY)

  if (deltaX > 60 && deltaY < 30) {
    closePopup()
  }
}

// 初始化webview的函数
// 处理webview消息
function handleWebviewMessage(e) {
  console.log('Webview message:', e.detail.data)
}

// webview加载完成事件
function onWebviewLoad() {
  console.log('Webview loaded')
  // 可以在这里添加额外的处理逻辑
}

function initWebview() {
  let height = 0
  let statusbar = 0
  let tabBarHeight = 0 // tabbar高度
  let safeAreaBottom = 0 // 底部安全区域
  
  // 使用 async/await 来获取系统信息
  uni.getSystemInfo({
    success: function(sysinfo) {
      statusbar = sysinfo.statusBarHeight
      height = sysinfo.windowHeight
      safeAreaBottom = sysinfo.safeAreaInsets?.bottom || 0
      
      // 估算tabBar高度，通常为50-60px，加上安全区域
      tabBarHeight = safeAreaBottom
      
      // 设置webview样式 - 增加延迟以确保弹窗已经完全显示
      setTimeout(() => {
        try {
          // 获取webview
          let pages = getCurrentPages()
          let page = pages[pages.length - 1]
          let currentWebview = page.$getAppWebview()
          
          if (currentWebview && currentWebview.children().length > 0) {
            var wv = currentWebview.children()[0]
            // 计算webview的top和height，适用于弹窗环境
            const headerHeight = 74 // 对应static-header的高度
            
            // 在弹窗中，我们需要确保webview完全在弹窗内容区域内，并且不被底部tabbar挡住
            const webviewHeight = height - headerHeight - tabBarHeight
            
            // 移除之前可能存在的webview配置，避免冲突
            if (wv) {
              // 设置基本样式
              wv.setStyle({
                top: headerHeight,
                height: webviewHeight + 'px',
                width: '100%',
                zIndex: 1,
                backgroundColor: '#ffffff'
              })
              
              // 配置webview，禁用扩展和可能有问题的功能
              if (typeof wv.setJavascriptEnabled === 'function') {
                wv.setJavascriptEnabled(true)
              }
              
              // 设置用户代理，避免被识别为特殊环境
              if (typeof wv.setUserAgent === 'function') {
                wv.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1')
              }
              
              // 尝试注入JavaScript来阻止扩展检测和一些可能导致问题的操作
              if (typeof wv.evalJS === 'function') {
                // 注入代码来阻止扩展检测和修复可能的DOM错误
                const injectedJS = `
                  // 阻止扩展检测
                  Object.defineProperty(window, 'chrome', {
                    get: () => ({
                      runtime: undefined,
                      extensions: undefined
                    }),
                    set: () => {}
                  });
                  
                  // 修复可能的getBoundingClientRect错误
                  const originalGetBoundingClientRect = HTMLElement.prototype.getBoundingClientRect;
                  HTMLElement.prototype.getBoundingClientRect = function() {
                    try {
                      if (!this || this.nodeType !== 1) {
                        return { top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0 };
                      }
                      return originalGetBoundingClientRect.call(this);
                    } catch (e) {
                      return { top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0 };
                    }
                  };
                  
                  // 阻止访问chrome-extension协议
                  const originalFetch = window.fetch;
                  window.fetch = function(url, options) {
                    if (typeof url === 'string' && url.startsWith('chrome-extension://')) {
                      console.log('Blocked fetch to chrome-extension:', url);
                      return Promise.reject(new Error('Blocked chrome-extension request'));
                    }
                    return originalFetch(url, options);
                  };
                `;
                
                // 先注入JS再加载URL
                wv.evalJS(injectedJS);
              }
              
              // 重新加载URL以应用新设置
              if (typeof wv.loadURL === 'function') {
                wv.loadURL(url.value)
              }
            }
          }
        } catch (error) {
          console.error('初始化webview失败:', error)
        }
      }, 800) // 增加延迟时间到800ms，确保DOM完全渲染
    },
    fail: function(error) {
      console.error('获取系统信息失败:', error)
    }
  })
}

// 监听show属性变化，当弹窗显示时初始化webview
watch(() => props.show, (newVal) => {
  if (newVal) {
    // 当弹窗显示时初始化webview
    initWebview()
  }
}, { immediate: true })

// 额外在onMounted中也调用一次，确保初始状态正确
onMounted(() => {
  if (props.show) {
    initWebview()
  }
})
</script>

<style scoped>
.panel-wrapper {
  width: 100vw;
  height: 100vh;
  background: #fff;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

/* 顶部返回按钮 - 增强样式确保在web-view上方 */
.static-header {
  height: 44px;
  display: flex;
  align-items: center;
  padding: 0 24rpx;
  padding-top: 60rpx;
  position: relative;
  z-index: 9999; /* 确保在最顶层 */
  background-color: #fff;
}

.back-button {
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 9999;
}

/* webview容器样式 */
.webview-container {
  flex: 1;
  position: relative;
  z-index: 1;
  overflow: hidden;
}
</style>
