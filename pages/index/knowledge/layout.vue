<template>
	<view class="knowledge-layout">
	   <view class="knowledge-layout-header">
	      <u-icon name="list" size="28" @click="showCommonPanel = true" />
	      <TabBar v-model="activeTab" @change="handleTabChange" />
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
	
	    <view
	      class="knowledge-layout-content"
	      @touchstart="onTouchStart"
	      @touchend="onTouchEnd"
	    >
	      <CommonPanel v-model:show="showCommonPanel" />
	      <SearchPanel v-if="activeTab === 0" v-model:show="showSearchPanel" search-type="notes" />
	      <SearchPanel v-if="activeTab === 1" v-model:show="showSearchPanel" search-type="knowledge" />
	
	      <swiper
	        :current="activeTab"
	        @change="onSwiperChange"
	        :indicator-dots="false"
	        class="knowledge-layout-swiper"
	      >
	        <swiper-item>
	          <Notes class="knowledge-layout-container" />
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
import { onMounted } from 'vue'
import Notes from './notes/notes.vue'
import Knows from './knows/knows.vue'
import TabBar from '../../../components/TabBar.vue'
import CommonPanel from '../../../components/CommonPanel.vue'
import SearchPanel from '../../../components/SearchPanel.vue'

const activeTab = ref(1)
const lastTab = ref(0)
const showCommonPanel = ref(false)
const showSearchPanel = ref(false)

onMounted(() => {
  uni.$on('swipeFromInnerFirstTab', () => {
    if (activeTab.value > 0) {
      activeTab.value--
    }
  })
})

function handleTabChange(index) {
  lastTab.value = activeTab.value
  activeTab.value = index
}

function onSwiperChange(e) {
  lastTab.value = activeTab.value
  activeTab.value = e.detail.current
}

function onSearchClick() {
  // 根据当前激活的标签页显示对应类型的搜索面板
  showSearchPanel.value = true
}

function onAIClickInAgent() {
  console.log('你现在点击的是智能体页面的 搜索按钮')
}

// 手势处理
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

  // 只有当滑动主要是水平方向（垂直滑动远小于水平滑动）且向右滑动足够距离时，才打开CommonPanel
  // 这可以防止上下滑动时意外触发CommonPanel
  if (deltaX > 50 && deltaY < deltaX / 2 && activeTab.value === 0 && lastTab.value === 0) {
    showCommonPanel.value = true
  }

  if (deltaX < -50 && deltaY < Math.abs(deltaX) / 2 && activeTab.value === 2 && lastTab.value === 2) {
    // 预留扩展
  }
}
</script>

<style scoped>
.knowledge-layout {
	height: 100vh;
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
  justify-content: space-between;
  align-items: center;
  padding: 0 3vw;
  background-color: #f5f5f5;
}

.knowledge-layout-content {
  margin-top: 60px; /* 留出 header 高度 */
  height: calc(100vh - 60px);
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch; /* iOS 平滑滚动 */
}

.knowledge-layout-swiper {
  width: 100vw;
  height: 100%;
  top: 5vh;
  position: relative;
}

.knowledge-layout-container {
  padding: 3px 10px 10px 10px;
  height: 100%;
  overflow: auto;
}
</style>