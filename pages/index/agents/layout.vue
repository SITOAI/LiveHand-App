<template>
  <view class="sub-index-page">
    <view class="sub-index-header">
      <SubTabBar v-model="activeTab" @change="handleTabChange" />
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
          <News class="sub-index-container" />
        </swiper-item>
        <swiper-item>
          <Resume class="sub-index-container" />
        </swiper-item>
        <swiper-item>
          <Research class="sub-index-container" />
        </swiper-item>
      </swiper>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import Research from './research/research.vue'
import Resume from './resume/resume.vue'
import News from './news/news.vue'
import SubTabBar from '../../../components/SubTabBar.vue'

const activeTab = ref(0)
const lastTab = ref(0)

function handleTabChange(index) {
  lastTab.value = activeTab.value
  activeTab.value = index
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

</script>

<style scoped>
.sub-index-page {
  height: 100vh !important;
  display: flex !important;
  flex-direction: column !important;
  align-items: center !important;
  top: -2vh !important;
  position: relative !important;
  background-color: #f5f5f5;
}

.sub-index-header {
  background-color: white;
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
  padding: 10px !important;
  height: 100% !important;
  overflow: auto !important;
  display: flex !important;
  flex-direction: column !important;
  align-items: center !important;
}
</style>
