<template>
	<view class="knowledge-layout">
	   <view class="knowledge-layout-header">
	      <TabBar v-model="activeTab" @change="handleTabChange" />
	      <view class="header-right">
	        <u-icon
	          v-if="activeTab == 0"
	          name="search"
	          size="28"
	          @click="onSearchClick"
	        />
	        <u-icon
	          v-else-if="activeTab == 1"
	          name="search"
	          size="28"
	          @click="onSearchClick"
	        />
	        <u-icon
	          v-else
	          name="grid"
	          size="28"
	          @click="onAIClickInAgent"
	        />
	      </view>
	    </view>

	    <view
	      class="knowledge-layout-content"
	      @touchstart="onTouchStart"
	      @touchend="onTouchEnd"
	    >
	
	      <SearchPanel v-if="activeTab === 0" v-model:show="showSearchPanel" search-type="notes" />
	      <SearchPanel v-if="activeTab === 1" v-model:show="showSearchPanel" search-type="knowledge" />

	      <swiper
	        :current="activeTab"
	        @change="onSwiperChange"
	        :indicator-dots="false"
	        class="knowledge-layout-swiper"
	      >
	        <swiper-item>
	          <Notes class="notes-layout-container" />
	        </swiper-item>
	        <swiper-item>
	          <Knows class="knowledge-layout-container" />
	        </swiper-item>
	      </swiper>
	    </view>
</view>
</template>

<script setup>
import { ref } from 'vue'
import { onMounted, onUnmounted } from 'vue'
import Notes from './notes/notes.vue'
import Knows from './knows/knows.vue'
import TabBar from '../../../components/TabBar.vue'

import SearchPanel from '../../../components/SearchPanel.vue'


const activeTab = ref(0)
const lastTab = ref(0)
const showSearchPanel = ref(false)
const startX = ref(0)

onMounted(() => {
  uni.$on('swipeFromInnerFirstTab', () => {
    if (activeTab.value > 0) {
      activeTab.value--
    }
  })
  
  // 监听tabbar切换事件，关闭弹框
uni.$on('closeAllModals', () => {
  showSearchPanel.value = false
})
})
onUnmounted(() => {
  // 移除事件监听并重置状态，避免内存泄漏
})

// 处理选择事件


function handleTabChange(index) {
  lastTab.value = activeTab.value
  activeTab.value = index
}

function onSwiperChange(e) {
  activeTab.value = e.detail.current
}

function onTouchStart(e) {
  startX.value = e.touches[0].clientX
}

function onTouchEnd(e) {
  const endX = e.changedTouches[0].clientX
  if (endX - startX.value > 50 && activeTab.value === 0) {
    // 向右滑动，通知父组件
    uni.$emit('swipeFromInnerFirstTab')
  }
}

function onSearchClick() {
  showSearchPanel.value = true
}

function onAIClickInAgent() {
  // 这里是点击AI按钮的逻辑
  console.log('点击AI按钮')
}
</script>

<style scoped>
.knowledge-layout {
	height: 100vh;
  padding-top: 4vh;
}

.knowledge-layout-header {
  position: fixed;
  top: 5vh;
  left: 0;
  right: 0;
  height: 6vh;
  background-color: white;
  border-bottom: 0.5px solid rgba(204, 204, 204, 0.5);
  z-index: 1000;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0 3vw;
  background-color: #f5f5f5;
}

.header-right {
  position: absolute;
  right: 3vw;
  display: flex;
  align-items: center;
}

.knowledge-layout-content {
  margin-top: 9vh; /* 留出 header 高度 + 顶部边距 */
  height: calc(100vh - 9vh); /* 减去 header 高度 */
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch; /* iOS 平滑滚动 */
  box-sizing: border-box;
}

.knowledge-layout-swiper {
  width: 100%;
  height: 100%;
  position: static;
  box-sizing: border-box;
}

.knowledge-layout-container {
  padding: 3px 10px 10px 10px;
  height: 100%;
  overflow: auto;
}
.notes-layout-container {
  padding: 3px 20rpx 30rpx 20rpx;
  height: 100%;
  overflow: auto;
  box-sizing: border-box;
}
</style>