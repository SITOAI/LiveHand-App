<template>
  <view class="index-page">
	  <view class="" v-if="activeTab == 1">
	  	<ExploreLayout></ExploreLayout>
	  </view>
	  <view class="" v-if="activeTab == 2">
	  	<KnowledgeLayout></KnowledgeLayout>
	  </view>
	  <view class="" v-if="activeTab == 3">
	  	<AgentsLayout></AgentsLayout>
	  </view>
	  <view class="" v-if="activeTab == 4">
	  	<MineLayout></MineLayout>
	  </view>
	
	<MainNav class="main-nav" :label="activeTab" @click="handleMainNavClick"/>
	<SelectionPanel
	  :show="popupVisible"
	  @update:show="val => popupVisible = val"
	  :items="popupItems"
	  @select="handleItemSelect"
	/>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onMounted } from 'vue'
import ExploreLayout from './explore/layout.vue'
import KnowledgeLayout from './knowledge/layout.vue'
import MineLayout from './mine/layout.vue'
import AgentsLayout from './agents/layout.vue'
import MainNav from '../../components/MainNav.vue'
import SelectionPanel from '../../components/SelectionPanel.vue'

const activeTab = ref(2)
const lastTab = ref(0)
const showCommonPanel = ref(false)
const showSearchPanel = ref(false)
const showChatPanel = ref(false)
const popupVisible = ref(false)
const popupItems = ref([])

onMounted(() => {
  uni.$on('swipeFromInnerFirstTab', () => {
    if (activeTab.value > 0) {
      activeTab.value--
    }
  })
})

function handleItemSelect(item) {
  popupVisible.value = false
  console.log('你点击了：', item)
}

function handleMainNavClick(label) {
  console.log("传出的变量", label)
  console.log("handleMainNavClick")
  if(label == 0)
  {
	popupVisible.value = true
	popupItems.value = label === 0
	  ? [
	      // { title: '新建文件夹', desc: '创建一个新的空文件夹', icon: 'folder' },
	      { title: '粘贴链接', desc: '从剪贴板粘贴链接内容', icon: 'attach' },
	      { title: '拍照', desc: '打开相机拍摄照片', icon: 'camera' },
	      { title: '上传图片', desc: '从相册选择图片上传', icon: 'photo' },
	      { title: '实时录音', desc: '录制语音备忘', icon: 'mic' },
	      { title: '导入音视频', desc: '导入本地音视频文件', icon: 'play-circle' },
	      { title: '上传文件', desc: '上传各种文件', icon: 'file-text' }
	    ]
	  : [
	      // { title: '新建文件夹', desc: '创建一个新的空文件夹', icon: 'folder' },
	      { title: '新建知识库', desc: '创建新的知识库空间', icon: 'bag' },
	      { title: '导入知识库', desc: '导入已有的知识库数据', icon: 'coupon' },
	      { title: '新增资料', desc: '添加新的资料内容', icon: 'plus' }
	    ]
  } else {
	  activeTab.value = label
  }
}
</script>

<style scoped>
.index-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  /* 为底部导航栏留出空间 */
  padding-bottom: 90rpx;
  box-sizing: border-box;
}

.main-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 9999;
  /* 确保在iPhone等有底部安全区域的设备上也能正常显示 */
  padding-bottom: env(safe-area-inset-bottom, 0px);
}

/* 适配不同尺寸的屏幕 */
@media screen and (max-width: 360px) {
  .index-page {
    padding-bottom: 80rpx;
  }
}
</style>
