<template>
  <view class="sub-index-page">
    <view class="sub-index-header">
      <SubTabBar v-model="activeTab" @change="handleTabChange" :statusBarHeight="statusBarHeight"/>
	</view>
    <view
      class="sub-index-content"
	  @touchstart="onTouchStart"
	  @touchend="onTouchEnd"
    >
      <swiper
        :current="activeTab"
        @change="onSwiperChange"
        :indicator-dots="false"
        class="sub-swiper"
      >
        <swiper-item>
          <view class="sub-index-container">
            <web-view :src="newsUrl" class="web-view-container" :webview-styles="webviewStyles" :allowFullScreen="false"></web-view>
          </view>
        </swiper-item>
        <swiper-item>
          <view class="sub-index-container">
            <web-view :src="researchUrl" class="web-view-container" :webview-styles="webviewStyles" :allowFullScreen="false"></web-view>
          </view>
        </swiper-item>
      </swiper>
    </view>
  </view>
  <SelectionPanel v-model:show="showCenterModal"  />
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import SubTabBar from '../../../components/SubTabBar.vue'
import SelectionPanel from '../../../components/SelectionPanel.vue'

const newsUrl = ref('http://news.sitoai.cn')
const researchUrl = ref('http://research.sitoai.cn')
const webviewStyles = ref({ 
  progress: { 
    color: '#07c160' 
  } 
})

// 默认设置为新闻tab（索引0）
const activeTab = ref(0)
const lastTab = ref(0)
const showCenterModal = ref(false)
let modalListener = null

// 监听自定义事件
onMounted(() => {
  // 监听特定的自定义事件
  modalListener = uni.$on('showAgentsModal', () => {
    showCenterModal.value = true
  })
  
  // 监听tabbar切换事件，关闭弹框
  uni.$on('closeAllModals', () => {
    showCenterModal.value = false
  })
  
  // 确保初始加载新闻网址
  newsUrl.value = `http://news.sitoai.cn?t=${new Date().getTime()}`
  
  // 延迟设置webview样式，确保页面元素已渲染
  setTimeout(() => {
    setWebviewStyles()
  }, 300)
})

function setWebviewStyles() {
  //获取webview 
  let pages = getCurrentPages(); 
  if (pages.length > 0) {
    let page = pages[pages.length - 1]; 
    let currentWebview = page.$getAppWebview(); 
    
    if (currentWebview && currentWebview.children().length > 0) {
      // 为所有webview子元素设置样式
      currentWebview.children().forEach((wv) => {
        // 获取系统信息设置webview样式
        uni.getSystemInfo({
          success: (sysinfo) => {
            const statusbar = sysinfo.statusBarHeight; 
            const height = sysinfo.windowHeight;
            const headerHeight = 60; // 根据layout.vue样式，header高度约为60px
            
            // 设置webview样式，确保布局合理
            wv.setStyle({ 
              top: statusbar + headerHeight, // 考虑状态栏和header高度
              height: height - statusbar - headerHeight, // 充满剩余内容空间
              zIndex: 1
            })
          }
        });
      });
    }
  }
}

onUnmounted(() => {
  // 移除事件监听并重置状态
  if (modalListener) {
    uni.$off('showAgentsModal', modalListener)
  }
  showCenterModal.value = false
})

function handleTabChange(index) {
  lastTab.value = activeTab.value
  activeTab.value = index
  // 强制刷新web-view的src，通过添加随机参数触发重新加载
  const timestamp = new Date().getTime();
  if (index === 0) {
    // 切换到新闻tab
    newsUrl.value = `http://news.sitoai.cn?t=${timestamp}`;
  } else if (index === 1) {
    // 切换到调研tab
    researchUrl.value = `http://research.sitoai.cn?t=${timestamp}`;
  }
  
  // 同时重新设置webview样式
  setTimeout(() => {
    setWebviewStyles();
  }, 100);
}

function onSwiperChange(e) {
  lastTab.value = activeTab.value
  activeTab.value = e.detail.current
}

// 手势处理
// 暴露给父组件的方法
const swipeLeftFromFirstPage = () => {
  if (activeTab.value === 0) {
    // 通知父层 layout 执行上一 tab
    uni.$emit('swipeFromInnerFirstTab')
  }
}

// 监听触摸事件
let startX = 0
let startY = 0
let startTabIndex = 0

function onTouchStart(e) {
  startX = e.touches[0].clientX
  startY = e.touches[0].clientY
  startTabIndex = activeTab.value
}

function onTouchEnd(e) {
  const endX = e.changedTouches[0].clientX
  const endY = e.changedTouches[0].clientY
  const deltaX = endX - startX
  const deltaY = Math.abs(endY - startY)

  // 👉 仅当起始页就是第一页、并且向右滑，才触发外层事件
  if (deltaX > 50 && deltaY < 30 && startTabIndex === 0 && activeTab.value === 0) {
    swipeLeftFromFirstPage()
  }
}

const statusBarHeight = uni.getSystemInfoSync().statussBarHeight
console.log("statusBarHeight:"+statusBarHeight)
</script>

<style scoped>
.sub-index-page {
  height: 100vh !important;
  display: flex !important;
  flex-direction: column !important;
  align-items: center !important;
  top: 4vh !important;
  position: relative !important;
  background-color: #f5f5f5;
}

.sub-index-header {
  border-bottom: 0.5px solid rgba(204, 204, 204, 0.5);
  z-index: 1000;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 3vw;
  background-color: #f5f5f5;
}

.sub-index-content {
  height: calc(100vh - 60px);
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch; /* iOS 平滑滚动 */
}

.sub-swiper {
  width: 100vw;
  height: 100%;
}

.sub-index-container {
  padding: 0 !important;
  height: 100% !important;
  overflow: hidden !important;
  display: flex !important;
  flex-direction: column !important;
  align-items: center !important;
  position: relative;
}

.web-view-container {
  width: 100%;
  height: 100%;
  position: relative;
  z-index: 1;
}
</style>
