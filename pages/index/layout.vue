<template>
  <view class="index-page">
    <view class="index-header">
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
        name="chat"
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
      class="index-content"
      @touchstart="onTouchStart"
      @touchend="onTouchEnd"
    >
      <CommonPanel v-model:show="showCommonPanel" />
      <SearchPanel v-if="activeTab === 0" v-model:show="showSearchPanel" />
      <ChatPanel v-if="activeTab === 1" v-model:show="showChatPanel" />

      <swiper
        :current="activeTab"
        @change="onSwiperChange"
        :indicator-dots="false"
        class="main-swiper"
      >
        <swiper-item>
          <Notes class="index-container" />
        </swiper-item>
        <swiper-item>
          <Knows class="index-container" />
        </swiper-item>
        <swiper-item>
          <AgentsLayout class="index-container" />
        </swiper-item>
      </swiper>
    </view>
	
	<MainNav v-if="activeTab !== 2" class="main-nav" :label="activeTab" @click="handleCreateClick"/>
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
import Notes from './notes/notes.vue'
import Knows from './knows/knows.vue'
import AgentsLayout from './agents/layout.vue'
import TabBar from '../../components/TabBar.vue'
import CommonPanel from '../../components/CommonPanel.vue'
import SearchPanel from '../../components/SearchPanel.vue'
import ChatPanel from '../../components/ChatPanel.vue'
import MainNav from '../../components/MainNav.vue'
import SelectionPanel from '../../components/SelectionPanel.vue'
import { useUserStore } from '@/store/user.js'
const userStore = useUserStore()

const activeTab = ref(0)
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

function handleCreateClick(label) {
  console.log("handleCreateClick")
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
}

function handleItemSelect(item) {
  popupVisible.value = false
  if(item.title === '上传文件'){
	  chooseAndUploadFile()
  }
  console.log('你点击了：', item)
}

function handleTabChange(index) {
  lastTab.value = activeTab.value
  activeTab.value = index
}

function onSwiperChange(e) {
  lastTab.value = activeTab.value
  activeTab.value = e.detail.current
}

function onSearchClick() {
  if (activeTab.value === 0) {
    showSearchPanel.value = true
  } else if (activeTab.value === 1) {
    showChatPanel.value = true
  }
}

function onAIClickInAgent() {
  console.log('你现在点击的是智能体页面的 搜索按钮')
}

function chooseAndUploadFile() {
  // 判断平台是否是 App
  const platform = uni.getSystemInfoSync().platform
  if (platform !== 'android' && platform !== 'ios') {
    uni.showToast({ title: '仅支持 App', icon: 'none' })
    return
  }
	console.log('你现在点击的是智能体页面的 搜索按钮')
  // 调用 plus.io.chooseFile 方法
  plus.io.chooseFile({
    title: '选择文件',
    multiple: false,
    filter: '' // 可选：限制类型如 '.pdf,.docx'
  }, (entry) => {
	console.log('✅ 选择文件成功 entry:', entry)
    const filePath = entry.files?.[0] // 获取真实本地路径

    console.log('选中的文件路径:', filePath)

    // 第一步上传到 dataset 接口
    uni.uploadFile({
      url: 'http://ai.sitoai.cn/livehands/dataset/upload/' + userStore.knowledge_user_id,
      filePath: filePath,
      name: 'file',
      formData: {
        description: '这是一个上传的文件',
      },
      success: (res) => {
        const data = JSON.parse(res.data)
        const uploadedPath = data.file_path
        console.log('第一步上传成功，路径：', uploadedPath)

        // 第二步上传到 files 接口
        uni.uploadFile({
          url: 'http://ai.sitoai.cn/livehands/files',
          filePath: filePath,
          name: 'file',
          formData: {
            token: userStore.token,
            user_id: userStore.knowledge_user_id,
            service_url: uploadedPath
          },
          success: (res2) => {
            const data2 = JSON.parse(res2.data)
            console.log('第二步上传成功：', data2)
            uni.showToast({ title: '上传成功', icon: 'success' })
          },
          fail: (err2) => {
            console.error('第二步上传失败：', err2)
            uni.showToast({ title: '上传失败', icon: 'error' })
          }
        })
      },
      fail: (err) => {
        console.error('第一步上传失败：', err)
        uni.showToast({ title: '上传失败', icon: 'error' })
      }
    })
  }, (err) => {
    console.error('文件选择失败：', err)
    uni.showToast({ title: '取消选择', icon: 'none' })
  })
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
  console.log(deltaX)
  console.log(deltaY)

  if (deltaX > 30 && activeTab.value === 0 && lastTab.value === 0) {
    showCommonPanel.value = true
  }

  if (deltaX < 30 && activeTab.value === 2 && lastTab.value === 2) {
    // 预留扩展
  }
}
</script>

<style scoped>
.index-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.index-header {
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

.index-content {
  margin-top: 60px; /* 留出 header 高度 */
  height: calc(100vh - 60px);
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch; /* iOS 平滑滚动 */
}

.main-swiper {
  width: 100vw;
  height: 100%;
      top: 5vh;
      position: relative;
}

.index-container {
  padding: 3px 10px 10px 10px;
  height: 100%;
  overflow: auto;
}

.main-nav {
  position: fixed;
  bottom: 20px;         /* 距离底部 */
  left: 50%;            /* 先把左边移动到中点 */
  transform: translateX(-50%); /* 再往左偏移自身宽度一半，实现居中 */
  z-index: 9999;
}
</style>
