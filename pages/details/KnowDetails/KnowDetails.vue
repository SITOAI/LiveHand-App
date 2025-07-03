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
      
        <!-- 新增 prompt 显示 -->
        <view class="note-prompt">{{ prompt }}</view>
      
        <!-- 底部一行，标签 | 时间 | @用户名 -->
        <view class="note-footer-row">
          <view class="note-tags">
            <u-tag
			  shape="circle"
              v-for="(tag, i) in tags"
              :key="i"
              :text="tag.text"
              :type="tag.type"
              size="mini"
              plain
            />
          </view>
          <text class="note-footer-separator">|</text>
          <text class="note-time">{{ time }}</text>
          <text class="note-footer-separator">|</text>
          <text class="note-user">@{{ user }}</text>
        </view>
      </view>

      <!-- Tabs栏 -->
      <u-tabs
        :list="tabList"
        :current="activeTab"
        lineWidth="150"
        lineColor="#000"
        @change="handleTabChange"
        :activeStyle="{
          color: '#303133',
          fontWeight: 'bold',
          transform: 'scale(1.05)'
        }"
        :inactiveStyle="{
          color: '#606266',
          transform: 'scale(1)'
        }"
        itemStyle="padding-left: 15px; padding-right: 15px; height: 34px;"
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
                <scroll-view scroll-y class="file-list-scroll" enable-flex>
                  <view
                    class="file-item"
                    v-for="file in filteredFiles"
                    :key="file.id"
                    @longpress="confirmDelete(file.id)"
                  >
                    <image
                      :src="file.preview"
                      class="file-preview"
                      mode="aspectFill"
                    />
                    <view class="file-info">
                      <view class="file-name" :title="file.name">{{ file.name }}</view>
                      <view class="file-meta">
                        <view class="file-meta-left">
                          <u-icon :name="getFileIcon(file.type)" size="18" />
                          <text class="file-type-text">{{ file.type }}</text>
                        </view>
                        <view class="file-meta-right">{{ file.uploadTime }}</view>
                      </view>
                    </view>
                  </view>
                </scroll-view>
              </view>
            </view>
          </scroll-view>
        </swiper-item>
        <swiper-item>
          <scroll-view scroll-y class="tab-inner-scroll">
            <!-- 这里是第二个标签页内容，可以补充你的内容 -->
          </scroll-view>
        </swiper-item>
      </swiper>
    </view>

    <!-- 底部聊天栏 -->
    <view class="chatbar" v-if="!chatPopupVisible">
      <view class="fake-input" @click="chatPopupVisible = true">
        <u-icon name="star" size="22" />
        <text class="fake-input-text">向LiveHands提问...</text>
      </view>
      <TalkButton @click="onTalkWithAI">发送</TalkButton>
    </view>

    <!-- 更多操作 popup -->
    <u-popup :show="showMore" mode="bottom" @close="showMore = false" />

    <!-- 编辑弹窗 -->
    <u-modal
      :show="showEdit"
      title="编辑笔记"
      @confirm="showEdit = false"
      @cancel="showEdit = false"
    >
      <view style="padding: 20px;">编辑笔记弹窗内容</view>
    </u-modal>

    <!-- 聊天 popup -->
    <u-popup
      :show="chatPopupVisible"
      mode="bottom"
      :safe-area-inset-bottom="true"
      :overlay="true"
      :custom-style="{
        height: '95vh',
        borderTopLeftRadius: '20rpx',
        borderTopRightRadius: '20rpx',
        overflow: 'hidden'
      }"
      @close="chatPopupVisible = false"
    >
      <scroll-view style="height: 100%" scroll-y>
        <LiveChat
          class="note-detail-live-chat"
          :height="'80vh'"
          :showHeader="true"
          :title="title"
          @onClose="handleCloseChat"
        />
      </scroll-view>
    </u-popup>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import TalkButton from '../../../components/children/TalkButton.vue'
import LiveChat from '../../../components/chat/LiveChat.vue'

const activeTab = ref(0)
const lastTab = ref(0)

const tabList = [
  { name: '文件' },
  { name: '知识图谱' }
]

const files = ref([
  {
    id: 1,
    name: '2025年AI技术趋势深度报告.pdf',
    type: 'pdf',
    uploadTime: '2025-06-01 14:23',
    preview: '/static/previews/pdf-preview.png'
  },
  {
    id: 2,
    name: '项目流程图设计稿.png',
    type: 'image',
    uploadTime: '2025-05-29 09:11',
    preview: '/static/previews/image-preview.png'
  },
  {
    id: 3,
    name: '数据统计表2025年Q2.xlsx',
    type: 'excel',
    uploadTime: '2025-06-15 16:45',
    preview: '/static/previews/excel-preview.png'
  }
])

const showMore = ref(false)
const showEdit = ref(false)
const chatPopupVisible = ref(false)

const title = ref('')
const time = ref('')
const repo = ref('')
const user = ref('')
const tags = ref([])
const prompt = ref([])

onLoad((options) => {
	console.log(options)
  title.value = decodeURIComponent(options.name || '')
  time.value = options.time || ''
  repo.value = decodeURIComponent(options.repo || '')
  user.value = decodeURIComponent(options.user || '')
  prompt.value = decodeURIComponent(options.prompt || '') // 新增prompt绑定
  try {
    tags.value = JSON.parse(decodeURIComponent(options.tags || '[]'))
  } catch (e) {
    tags.value = []
  }
})

function onTalkWithAI() {
  console.log('功能暂未开放')
}

function handleCloseChat() {
  chatPopupVisible.value = false
  console.log('用户点击了关闭按钮')
}

function goBack() {
  uni.navigateBack()
}
function onShare() {
  uni.showToast({ title: '点击分享', icon: 'none' })
}

function handleTabChange(tab) {
  lastTab.value = activeTab.value
  activeTab.value = tab.index
}

function onSwiperChange(e) {
  lastTab.value = activeTab.value
  activeTab.value = e.detail.current
}

function getFileIcon(type) {
  switch (type) {
    case 'pdf':
      return 'file-text' // uView 内置图标名
    case 'image':
      return 'photo'
    case 'excel':
      return 'file-excel'
    default:
      return 'file'
  }
}

function confirmDelete(id) {
  uni.showModal({
    title: '确认删除',
    content: '是否要删除该文件？',
    confirmColor: '#f56c6c',
    success(res) {
      if (res.confirm) {
        deleteFile(id)
      }
    }
  })
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

  if (startTabIndex === 0 && activeTab.value === 0 && deltaX > 50 && deltaY < 30) {
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
  background-color: #ddd;
  border-radius: 12px;
  padding: 10px 16px 16px 16px;
  margin-bottom: 10px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
  margin-top: 4vh;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 140px; /* 固定高度，可根据需要微调 */
  box-sizing: border-box;
}

.note-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.note-title {
  font-size: 18px; /* 文字小一点 */
  font-weight: 700;
  line-height: 1.2;
  max-width: 85%;
  color: #222;
}
.note-meta {
  margin-top: 4px;
  display: flex;
  gap: 6px;
  font-size: 12px;
  color: #666;
}
/* prompt 文本 */
.note-prompt {
  margin-top: 8px;
  font-size: 14px;
  color: #444;
  line-height: 1.4;
  max-height: 50px;
  overflow: hidden;
  text-overflow: ellipsis;
  word-break: break-word;
}

/* 底部一行，水平排列 */
.note-footer-row {
  margin-top: 12px;
  display: flex;
  align-items: center;
  font-size: 13px;
  color: #666;
  gap: 8px;
  flex-wrap: nowrap;
}

.note-tags {
  display: flex;
  gap: 6px;
  flex-wrap: nowrap;
  overflow: hidden;
  flex-shrink: 0;
}

.note-footer-separator {
  color: #999;
  user-select: none;
}

.note-time,
.note-user {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100px;
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

/* 文件列表样式 */
.file-list {
  margin-top: 8vh;
}

.file-search-bar {
  margin-top: 10px;
  padding: 0 14px;
  margin: 0 14px 10px;
}

.file-list-scroll {
  height: calc(100vh - 270px);
  box-sizing: border-box;
}

.file-item {
  display: flex;
  align-items: flex-start;
  padding: 14px;
  background-color: #f8f8f8;
  border-radius: 16rpx;
  margin-bottom: 14px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  gap: 12px;
  min-height: 80px;
  box-sizing: border-box;
}

.file-preview {
  width: 72px;
  height: 72px;
  border-radius: 12rpx;
  flex-shrink: 0;
  background-color: #ddd;
  object-fit: cover;
}

.file-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 72px;
  box-sizing: border-box;
}

.file-name {
  font-size: 18px;
  font-weight: 600;
  line-height: 1.3;
  color: #333;
  max-height: 3.9em;
  overflow: hidden;
  word-break: break-word;
}

.file-meta {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: #666;
  margin-top: 6px;
}

.file-meta-left {
  display: flex;
  align-items: center;
  gap: 6px;
}

.file-type-text {
  text-transform: uppercase;
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

.note-detail-live-chat {
  border-top-left-radius: 16rpx;
  border-top-right-radius: 16rpx;
  overflow: hidden;
}
</style>
