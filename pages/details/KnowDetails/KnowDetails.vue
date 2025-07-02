<template>
  <view class="note-details-page">
    <!-- 顶部固定区域：图标、Header、Tabs -->
    <view class="top-fixed-header">
      <!-- 顶部图标 -->
      <view class="top-icon-row">
        <u-icon name="arrow-left" size="24" @click="goBack" />
        <view class="right-icons">
          <u-icon name="share" size="22" @click="onShare" />
          <u-icon name="more-dot-fill" size="22" @click="showMore = true" />
        </view>
      </view>

      <!-- Header 卡片 -->
      <view class="note-header-card">
        <view class="note-title-row">
          <text class="note-title">{{ title }}</text>
          <u-icon name="edit-pen" size="18" @click="showEdit = true" />
        </view>
        <view class="note-meta">
          <text>{{ time }}</text>
          <text class="note-separator">|</text>
          <text>{{ user }}</text>
        </view>
        <view class="note-tags">
          <u-tag
            v-for="(tag, i) in tags"
            :key="i"
            :text="tag.text"
            :type="tag.type"
            size="mini"
            plain
          />
        </view>
      </view>

      <!-- Tabs栏 -->
      <u-tabs :list="tabList" :current="activeTab" @change="handleTabChange" 
		  :item-style="{ justifyContent: 'center', padding: '20rpx 0', height: '80rpx',flex: 1, justifyContent: 'center' }"
		  :active-style="{ fontSize: '18px', fontWeight: '600' }"
		  :scrollable="false"
	  />
    </view>

    <!-- Swiper 内容区 -->
    <view
      class="tab-content-wrapper"
      @touchstart="onTouchStart"
      @touchend="onTouchEnd"
    >
      <swiper
        class="tab-swiper"
        :current="activeTab"
        @change="onSwiperChange"
        :indicator-dots="false"
      >
        <swiper-item>
          <scroll-view scroll-y class="tab-inner-scroll">
            <view class="sum-tab-wrapper">
                <!-- 文件列表展示区 -->
                <view class="file-list">
					<view class="file-search-bar">
					    <u-search
					      placeholder="搜索文件名"
					      v-model="searchKeyword"
					      :show-action="false"
					      bg-color="#f0f0f0"
					      height="64rpx"
					      @change="onSearchChange"
					    />
					  </view>
					
                    <u-swipe-action>
                      <u-swipe-action-item
                        v-for="file in filteredFiles"
                        :key="file.id"
                        :options="[{ text: '删除', style: { backgroundColor: '#f56c6c', color: '#fff' } }]"
                        @click="deleteFile(file.id)"
                      >
                        <view class="file-item">
                          <u-icon :name="getFileIcon(file.type)" size="20" />
                          <text class="file-name">{{ file.name }}</text>
                        </view>
                      </u-swipe-action-item>
                    </u-swipe-action>
                </view>
            </view>
          </scroll-view>
        </swiper-item>
        <swiper-item>
          <scroll-view scroll-y class="tab-inner-scroll">
            <NoteDetailPosterTab />
          </scroll-view>
        </swiper-item>
      </swiper>
    </view>

    <!-- 底部聊天栏 -->
    <view class="chatbar" v-if="!chatPopupVisible">
      <view class="fake-input" @click="chatPopupVisible = true">
        <u-icon name="star" size="22"/>
        <text class="fake-input-text">向LiveHands提问...</text>
      </view>
      <TalkButton @click="onTalkWithAI">发送</TalkButton>
    </view>

    <!-- 更多操作 popup -->
    <u-popup :show="showMore" mode="bottom" @close="showMore = false" />

    <!-- 编辑弹窗 -->
    <u-modal :show="showEdit" title="编辑笔记" @confirm="showEdit = false" @cancel="showEdit = false">
      <view style="padding: 20px;">编辑笔记弹窗内容</view>
    </u-modal>

    <!-- 聊天 popup -->
    <u-popup
      :show="chatPopupVisible"
      mode="bottom"
      :safe-area-inset-bottom="true"
      :overlay="true"
      :custom-style="{ height: '95vh' }"
      @close="chatPopupVisible = false"
    >
      <scroll-view style="height: 100%" scroll-y>
        <view style="padding: 20px;">AI 聊天内容区域</view>
      </scroll-view>
    </u-popup>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import NoteDetailSumTab from '../../../components/tabs/NoteDetailSumTab.vue'
import NoteDetailPosterTab from '../../../components/tabs/NoteDetailPosterTab.vue'
import TalkButton from '../../../components/children/TalkButton.vue'

const activeTab = ref(0)
const lastTab = ref(0)

const tabList = [
  { name: '文件' },
  { name: '知识图谱' }
]

const files = ref([
  { id: 1, name: '文档A.pdf', type: 'pdf' },
  { id: 2, name: '图片B.png', type: 'image' },
  { id: 3, name: '表格C.xlsx', type: 'excel' },
])

const showMore = ref(false)
const showEdit = ref(false)
const chatPopupVisible = ref(false)

const title = ref('')
const time = ref('')
const repo = ref('')
const user = ref('')
const tags = ref([])

onLoad((options) => {
  title.value = decodeURIComponent(options.name || '')
  time.value = options.time || ''
  repo.value = decodeURIComponent(options.repo || '')
  user.value = decodeURIComponent(options.user || '')
  try {
    tags.value = JSON.parse(decodeURIComponent(options.tags || '[]'))
  } catch (e) {
    tags.value = []
  }
})

function onTalkWithAI() {
  console.log("功能暂未开放")
}

function goBack() {
  uni.navigateBack()
}
function onShare() {
  uni.showToast({ title: '点击分享', icon: 'none' })
}

function handleTabChange(index) {
  lastTab.value = activeTab.value
  activeTab.value = index
}
function onSwiperChange(e) {
  lastTab.value = activeTab.value
  activeTab.value = e.detail.current
}

function getFileIcon(type) {
  switch (type) {
    case 'pdf': return 'file-text'; // uView 内置图标名
    case 'image': return 'photo';
    case 'excel': return 'file';
    default: return 'file';
  }
}

function deleteFile(id) {
  files.value = files.value.filter(file => file.id !== id)
}

const searchKeyword = ref('')

// 计算属性：根据关键词过滤文件
const filteredFiles = computed(() => {
  if (!searchKeyword.value.trim()) {
    return files.value
  }
  return files.value.filter(file =>
    file.name.toLowerCase().includes(searchKeyword.value.toLowerCase())
  )
})

// 监听输入变化（可选）
function onSearchChange(val) {
  searchKeyword.value = val
}

// 手势滑动控制退出与切换
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

  if (
    startTabIndex === 0 &&
    activeTab.value === 0 &&
    deltaX > 50 &&
    deltaY < 30
  ) {
    goBack()
  }
}
</script>

<style scoped>
.note-details-page {
  background: #fff;
  min-height: 100vh;
  box-sizing: border-box;
  position: relative;
}

/* 固定顶部 */
.top-fixed-header {
  position: fixed;
  top: 3vh;
  left: 0;
  width: 100vw;
  z-index: 999;
  background-color: #fff;
  padding: 12px 16px 8px;
  box-sizing: border-box;
}

/* 顶部图标 */
.top-icon-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.right-icons {
  display: flex;
  gap: 12px;
}

/* Header 卡片 */
.note-header-card {
  background-color: #f5f5f5;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 10px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
  margin-top: 4vh;
}
.note-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.note-title {
  font-size: 22px;
  font-weight: 700;
}
.note-meta {
  margin-top: 4px;
  display: flex;
  gap: 6px;
  font-size: 12px;
  color: #666;
}
.note-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

/* 内容区域 - 顶部区域高度约220px */
.tab-content-wrapper {
  margin-top: 220px;
  height: calc(100vh - 270px);
}
.tab-swiper {
  height: 100%;
}
.tab-inner-scroll {
  height: 100%;
  overflow-y: auto;
  padding: 10px 14px;
  box-sizing: border-box;
}

/* 底部聊天栏 */
.chatbar {
  position: fixed;
  bottom: 5px;
  left: 0;
  width: 95vw;
  display: flex;
  padding: 10px 14px;
  border-radius: 15px;
  margin: 2.5vw;
  background: #ddd;
  z-index: 999;
  box-sizing: border-box;
  gap: 10px;
}
.fake-input {
  flex: 1;
  display: flex;
  align-items: center;
  padding: 0 14px;
  box-sizing: border-box;
}
.fake-input-text {
  color: #999;
  font-size: 14px;
}

.sum-tab-wrapper {
  padding-top: 4px;
  box-sizing: border-box;
  min-height: 100%;
}

.file-list {
  margin-top: 5vh;
}

.file-item {
  display: flex;
  align-items: center;
  padding: 12px;
  background-color: #f8f8f8;
  border-radius: 8px;
  margin-bottom: 10px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}
.file-name {
  margin-left: 10px;
  font-size: 14px;
  color: #333;
}

.file-search-bar {
  margin-top: 10px;
  padding: 0 14px;
  margin: 0 14px 10px;
}
</style>
