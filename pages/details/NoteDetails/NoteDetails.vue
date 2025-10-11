<template>
  <view class="note-details-page">
    <!-- 顶部固定区域：图标、Header、Tabs -->
    <view class="top-fixed-header">
      <!-- 顶部图标 -->
      <view class="top-icon-row">
        <u-icon name="arrow-left" size="24" @click="goBack" />
        <view class="right-icons">
        <image  src="../../../static/share.png" class="folder-icon" mode="aspectFit" @click="onShare"></image>
        <image  src="../../../static/more_explore.png" class="more-icon" mode="aspectFit" @click="showMore = true"></image>
        </view>
      </view>

      <!-- Header 卡片 -->
      <view class="note-header-card">
        <view class="note-title-row">
          <text class="note-title">{{ title }}</text>
          <u-icon name="edit-pen" size="18" @click="showEdit = true" />
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
        <view class="note-meta">
          <image  src="../../../static/black_folder.png" class="folder-img" mode="aspectFit" @click="showMore = true"></image>
          <text>{{ repo }}</text>
          <u-icon name="arrow-down" size="12" style="margin-left: 6rpx;" @click="showMore = true" />
        </view>
        <!-- 音频上传图标 -->
        <div class="audio-icon-wrapper" >
        <!-- <div class="audio-icon-wrapper" v-show="musice" > -->
          <div class="audio-icon">
            <image  src="../../../static/musice.png" class="folder-icon" mode="aspectFit"></image>
            <span class="audio-name">{{ audioName }}</span>
          </div>
        </div>
      </view>

      <u-tabs
        :list="tabList"
        :current="activeTab"
      	lineWidth="100"
      	lineColor="#131313"
        lineHeight="1.5"
        @change="handleTabChange"
        :activeStyle="{
            fontSize: '30rpx',
            color: '#131313',
            fontWeight: '500',
            transform: 'scale(1.05)'
        }"
        :inactiveStyle="{
            fontSize: '30rpx',
            color: '#565656',
            transform: 'scale(1)'
        }"
	    	itemStyle="padding-left: 15px; padding-right: 15px; height: 34px;"
        :scrollable="false"
      />
    </view>

    <!-- Swiper 内容区 -->
    <view class="tab-content-wrapper" @touchstart="onTouchStart" @touchend="onTouchEnd">
      <swiper
        class="tab-swiper"
        :current="activeTab"
        @change="onSwiperChange"
        :indicator-dots="false"
      >
        <swiper-item>
          <scroll-view scroll-y class="tab-inner-scroll">
            <NoteDetailSumTab :summary="summary" />
          </scroll-view>
        </swiper-item>
        <swiper-item>
          <scroll-view scroll-y class="tab-inner-scroll">
            <NoteDetailPosterTab :handmould="handmould" />
          </scroll-view>
        </swiper-item>
      </swiper>
    </view>
    
    <!-- 底部占位元素，确保内容不被聊天栏遮挡 -->
    <view class="bottom-spacer"></view>

    <!-- 更多操作 popup -->
    <u-popup :show="showMore" mode="bottom" class="more-popup" @close="showMore = false" :safe-area-inset-bottom="true">
      <view class="more-popup-container">
        <!-- 标题 -->
        <text class="more-popup-title">更多</text>
        
        <!-- 内容区域 -->
        <view class="more-popup-content">
          <!-- 添加到知识库 -->
          <view class="more-popup-item" @click="showMore = false; showRepoSelectionModal()">
            <image src="../../../static/gra_folder.png" class="more-popup-item-image" mode="aspectFit"></image>
            <text class="more-popup-item-text">添加知识库</text>
          </view>
          
          <!-- 复制笔记 -->
          <view class="more-popup-item" @click="copyNoteSummary()">
            <image src="../../../static/copy.png" class="more-popup-item-image" mode="aspectFit"></image>
            <text class="more-popup-item-text">复制笔记</text>
          </view>
          
          <!-- 删除笔记 -->
          <view class="more-popup-item" @click="deleteNote">
            <image src="../../../static/delete.png" class="more-popup-item-image" mode="aspectFit"></image>
            <text class="more-popup-item-text">删除笔记</text>
          </view>
        </view>
        
        <!-- 取消按钮 -->
        <view class="more-popup-cancel">
          <text class="more-popup-cancel-text" @click="showMore = false">取消</text>
        </view>
      </view>
    </u-popup>

    <!-- 编辑弹窗 -->
    <u-modal :show="showEdit" title="编辑笔记" @confirm="showEdit = false" @cancel="showEdit = false">
      <view class="edit-popup-content">编辑笔记弹窗内容</view>
    </u-modal>

    <!-- 选择知识库模态框 -->
    <u-modal :show="showRepoSelection" mode="bottom" width="100%" title="选择知识库" @confirm="handleRepoConfirm" @cancel="handleRepoCancel" :custom-style="{borderRadius: '32rpx'}" :mask-close-able="true" :show-cancel-button="true" cancel-text="取消">
      <view class="repo-selection-content">
        <u-radio-group v-model="selectedRepo" @change="handleRepoSelect">
          <!-- 循环渲染知识库列表 -->
          <view 
            v-for="item in repoList" 
            :key="item.id" 
            class="repo-item"
          >
            <image :src="item.icon" class="repo-icon" mode="aspectFit"></image>
            <view class="repo-item-content">
              <view class="repo-details">
                <text class="repo-name">{{ item.name }}</text>
                <text class="repo-desc">{{ item.desc }}</text>
              </view>
              <view class="repo-radio">
                <u-radio :value="item.id" :name="item.id" size="18" active-color="#4d8fff" @click="handleRepoRadioClick(item.id)" />
              </view>
            </view>
          </view>
        </u-radio-group>
        <!-- 新建知识库 -->
        <view class="create-repo" @click="handleCreateRepo">
          <image src="../../../static/add_folder.png" class="repo-icon" mode="aspectFit"></image>
          <text class="create-repo-text">新建知识库</text>
        </view>
      </view>
    </u-modal>

    <!-- 聊天 popup -->
    <u-popup
      :show="chatPopupVisible"
      mode="bottom"
      :safe-area-inset-bottom="true"
      :overlay="true"
      :custom-style="chatPopupStyle"
      @close="chatPopupVisible = false"
    >
      <scroll-view class="chat-scroll-view" scroll-y>
        <LiveChat
          class="note-detail-live-chat"
          :height="'80vh'"
          :showHeader="true"
          :title="title"
          :onClose="handleCloseChat"
          :sourcePage="'noteDetails'"
          :noteSummary="summary"
        />
      </scroll-view>
    </u-popup>
    <!-- 底部聊天栏 -->
    <view class="chatbar" v-if="!chatPopupVisible">
      <view class="fake-input" @click="chatPopupVisible = true">
        <u-icon name="star" size="22" />
        <text class="fake-input-text">向LiveHands提问...</text>
      </view>
      <!-- <TalkButton @click="onTalkWithAI">发送</TalkButton> -->
    </view>
  </view>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import NoteDetailSumTab from '../../../components/tabs/NoteDetailSumTab.vue'
import NoteDetailPosterTab from '../../../components/tabs/NoteDetailPosterTab.vue'
import TalkButton from '../../../components/children/TalkButton.vue'
import LiveChat from '../../../components/chat/LiveChat.vue'
import http from '../../../utils/http.js'

const activeTab = ref(0)
const lastTab = ref(0)

const tabList = [
  { name: '总结' },
  { name: '手抄' }
]

const showMore = ref(false)
const showEdit = ref(false)
const chatPopupVisible = ref(false)
const showRepoSelection = ref(false)
const selectedRepo = ref('1') // 默认选择id为1的知识库（字符串类型）
const title = ref('默认知识库')

// 知识库列表数据
const repoList = ref([
  {
    id: '1',
    name: '默认知识库',
    desc: '知识库说明',
    icon: '../../../static/foldery.png',
    value: '默认知识库'
  },
  {
    id: '2',
    name: '教育知识',
    desc: '学习、教育、知识',
    icon: '../../../static/test/test1.png',
    value: '教育知识1'
  },
  {
    id: '3',
    name: '教育知识',
    desc: '学习、教育、知识',
    icon: '../../../static/test/test1.png',
    value: '教育知识2'
  },
  {
    id: '4',
    name: '教育知识',
    desc: '学习、教育、知识',
    icon: '../../../static/test/test1.png',
    value: '教育知识3'
  }
])

// 聊天弹窗样式对象
const chatPopupStyle = {
  height: '95vh',
  borderTopLeftRadius: '20rpx',
  borderTopRightRadius: '20rpx',
  overflow: 'hidden'
}
const time = ref('')
const repo = ref('')
const tags = ref([])
const musice = ref(false)
const audioName = ref('音频文件')
const noteId = ref('') // 笔记ID

// 路由参数
const summary = ref('')
const handmould = ref('')

onLoad((options) => {
  title.value = decodeURIComponent(options.title || '')
  time.value = options.time || ''
  repo.value = decodeURIComponent(options.repo || '')
  musice.value = options.musice === 'true'
  audioName.value = decodeURIComponent(options.audioName || '音频文件')
  // 获取笔记ID
  noteId.value = options.id || ''
  // 获取summary参数
  summary.value = decodeURIComponent(options.summary || '')
  // 获取handmould参数
  handmould.value = decodeURIComponent(options.handmould || '')
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
  
  // 处理手势滑动退出逻辑
  if (startTabIndex === 0 && activeTab.value === 0 && deltaX > 50 && deltaY < 30) {
    goBack()
  }
}

// 选择知识库相关函数
function showRepoSelectionModal() {
  // 确保显示时选中id为1的选项
  selectedRepo.value = '1'
  showRepoSelection.value = true
}

// 监听showRepoSelection变化，确保模态框打开时选中第一个选项
watch(
  () => showRepoSelection.value,
  (newVal) => {
    if (newVal) {
      // 确保在模态框显示时强制设置选中状态
      nextTick(() => {
        selectedRepo.value = '1'
      })
    }
  }
)

function handleRepoConfirm() {
  showRepoSelection.value = false
  // 根据ID查找对应的知识库名称
  const selectedRepoItem = repoList.value.find(item => item.id === selectedRepo.value)
  const repoName = selectedRepoItem ? selectedRepoItem.name : '知识库'
  // uni.showToast({ title: `已添加到${repoName}`, icon: 'success' })
  uni.showToast({ title: `添加成功`, icon: 'success' })
}

function handleRepoCancel() {
  showRepoSelection.value = false
}

// 直接处理单选按钮点击事件
function handleRepoRadioClick(id) {
  selectedRepo.value = id
}

// 原有的radio-group change事件处理函数（保留以确保兼容性）
function handleRepoSelect(value) {
  if (value) {
    selectedRepo.value = value
  }
}

function handleCreateRepo() {
  uni.showToast({ title: '新建知识库功能暂未开放', icon: 'none' })
}

// AI提问按钮点击事件
function showAiChat() {
  chatPopupVisible.value = true
}

// 删除笔记功能
function deleteNote() {
            uni.showToast({ title: '功能暂未开放', icon: 'none' }); return
  // 显示确认对话框
  // uni.showModal({
  //   title: '确认删除',
  //   content: '确定要删除这条笔记吗？删除后将无法恢复。',
  //   success: async (res) => {
  //     if (res.confirm) {
  //       try {
          // 检查笔记ID是否存在
          // if (!noteId.value) {
          //   uni.showToast({ title: '笔记ID缺失', icon: 'none' });
          //   return;
          // }
          
          // // 显示加载状态
          // uni.showLoading({ title: '删除中...' });
          
          // // 发送删除请求
          // await http.delete(`/api/notes/${noteId.value}`);
          
          // // 隐藏加载状态
          // uni.hideLoading();
          
          // // 显示删除成功提示
          // uni.showToast({
          //   title: '笔记已删除',
          //   icon: 'success',
          //   duration: 2000,
          //   success: () => {
          //     // 隐藏更多操作弹窗
          //     showMore.value = false;
          //     // 延迟返回上一页，确保用户看到成功提示
          //     setTimeout(() => {
          //       goBack();
          //     }, 500);
          //   }
          // });
        // } catch (error) {
        //   // 隐藏加载状态
        //   uni.hideLoading();
          
        //   // 显示错误提示
        //   uni.showToast({
        //     title: error.message || '删除失败，请重试',
        //     icon: 'none',
        //     duration: 2000
        //   });
        // }
      // }
    // }
  // });
}

// 复制笔记总结内容
function copyNoteSummary() {
          uni.showToast({ title: '功能暂未开放', icon: 'none' }); return
  // if (summary.value) {
  //   uni.setClipboardData({
  //     data: summary.value,
  //     success: () => {
  //       uni.showToast({
  //         title: '笔记总结已复制',
  //         icon: 'success',
  //         duration: 2000
  //       })
  //     },
  //     fail: () => {
  //       uni.showToast({
  //         title: '复制失败，请重试',
  //         icon: 'none',
  //         duration: 2000
  //       })
  //     }
  //   })
  // } else {
  //   uni.showToast({
  //     title: '暂无笔记总结内容',
  //     icon: 'none',
  //     duration: 2000
  //   })
  // }
}
</script>

<style scoped>
.note-details-page {
  background: #fff;
  min-height: 100vh;
  box-sizing: border-box;
  position: relative;
  padding: 0 16px;
  padding-top: 4vh;
}

/* 顶部图标行 */
.top-icon-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
}

/* 左侧返回图标 */
.top-icon-row .u-icon[name="arrow-left"] {
  margin-left: 0;
}

/* 右侧图标组 */
.right-icons {
  display: flex;
  align-items: center;
  gap: 15px;
}

/* folder-icon尺寸设置 */
.folder-icon {
  width: 40rpx;
  height: 40rpx;
}
.more-icon {
  width: 40rpx;
  height: 40rpx;
}

/* 顶部标题区域 */
.top-header {
  display: flex;
  align-items: center;
  margin-top: 20px;
  margin-bottom: 10px;
}

.back-icon {
  margin-right: 10px;
}

.header-content {
  flex: 1;
  display: flex;
  justify-content: flex-start;
  align-items: center;
}

/* 标题行 */
.note-title-row {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.note-title {
  font-size: 18px;
  font-weight: bold;
  margin-right: 8px;
}

.edit-icon {
  color: #666;
}

/* 标签区域 */
.tags-container {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

.note-tags {
  display: flex;
  gap: 10rpx;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

.note-tag {
  background-color: #fff;
  border: 1px solid #f0f0f0;
}

/* 知识库选择器 */
.repo-selector {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  background-color: #f5f5f5;
  border-radius: 15px;
  width: fit-content;
  margin-bottom: 15px;
}

.repo-name {
  font-size: 14px;
  color: #666;
}

/* 音频文件显示区域 */
.audio-container {
  display: flex;
  align-items: center;
  gap: 10px;
  background-color: #f8f9fc;
  border-radius: 8px;
  padding: 10px;
  margin-bottom: 15px;
}

.audio-upload-text {
  font-size: 12px;
  color: #999;
}

/* 音频图标包装器 - 参照NoteCard.vue样式 */
.audio-icon-wrapper {
  background-color: #f8f9fc;
  border-radius: 8px;
  padding: 10px;
  margin-top: 10px;
  margin-bottom: 8px;
}

.audio-icon {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #4d8fff;
}

.audio-icon image {
  width: 70rpx;
  height: 70rpx;
  vertical-align: middle;
}

.audio-icon span {
  font-size: 12px;
  color: #888888;
  vertical-align: middle;
}

.audio-name {
  font-size: 28rpx;
  color: #131313;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Tabs栏 */
.tabs-container {
  margin-bottom: 15px;
}

/* Swiper 内容区 */
.tab-content-wrapper {
  height: calc(100vh - 380px);
}

.tab-swiper {
  height: 100%;
}

.tab-inner-scroll {
  height: 100%;
  overflow-y: auto; /* 内容多时自动显示滚动条，内容少时不显示 */
  padding: 0;
  box-sizing: border-box;
  /* 移除任何可能存在的自定义滚动条样式影响 */
}

/* AI提问按钮 - 公用组件 */
.ai-question-button {
  position: fixed;
  bottom: 130rpx;
  right: 5rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: #fff;
  border: 1px solid #4d8fff;
  border-radius: 25px;
  padding: 12px 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 999;
}

.ai-icon-wrapper {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
}

.question-text {
  font-size: 14px;
  color: #4d8fff;
  font-weight: 500;
}
.ai-icon{
  width: 56px;
  height: 56px;
}

.note-detail-live-chat {
  border-top-left-radius: 16rpx;
  border-top-right-radius: 16rpx;
  overflow: hidden;
}
.note-meta{
  font-family: Source Han Sans CN, Source Han Sans CN;
  margin-top: 10rpx;
  display: flex;
  align-items: center;
  font-size: 24rpx;
  color: #131313; 
  font-weight: 600;
}
.folder-img{
  width: 30rpx;
  height: 30rpx;
  margin-right: 8rpx;
}

/* 更多操作弹窗样式 */
.more-popup-container {
  width: 750rpx;
  height: 587rpx;
  background: #F5F5F5;
  border-radius: 30rpx 30rpx 0rpx 0rpx;
  padding: 20rpx;
  box-sizing: border-box;
}

.more-popup-title {
  font-weight: 500;
  font-size: 32rpx;
  color: #131313;
  line-height: 100rpx;
  text-align: left;
  display: block;
  height: 100rpx;
  margin-left: 20rpx;
  margin-bottom: 20rpx;
}

.more-popup-content {
  width: 690rpx;
  height: 276rpx;
  background: #FFFFFF;
  border-radius: 20rpx 20rpx 20rpx 20rpx;
  margin-bottom: 20rpx;
}

.more-popup-item {
  height: 92rpx;
  display: flex;
  align-items: center;
  border-bottom: 2rpx solid #ECECEC;
  padding: 0 30rpx;
}

.more-popup-item:last-child {
  border-bottom: none;
}

.more-popup-item-image {
  width: 25rpx;
  height: 25rpx;
  margin-right: 20rpx;
}

.more-popup-item-text {
  font-weight: 400;
  font-size: 28rpx;
  color: #131313;
}

.more-popup-cancel {
  width: 690rpx;
  height: 100rpx;
  background: #FFFFFF;
  border-radius: 20rpx 20rpx 20rpx 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.more-popup-cancel-text {
  font-weight: 400;
  font-size: 28rpx;
  color: #131313;
}

/* 编辑弹窗样式 */
.edit-popup-content {
  padding: 20px;
}

/* 选择知识库弹窗样式 */
.repo-selection-content {
  width: 750rpx;
  max-height: 50vh;
  padding: 10rpx 30rpx;
  border-radius: 32rpx 32rpx 0 0;
}

.repo-item {
  display: flex;
  align-items: center;
  height: 134rpx;
  width: 100%;
}

.repo-item-content {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
  border-bottom: 1px solid #f0f0f0;
}

.repo-radio {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 60rpx;
}

.repo-info {
  display: flex;
  align-items: center;
}

.repo-icon {
  width: 60rpx;
  height: 60rpx;
  margin-right: 15px;
  background-color: #f5f5f5;
  border-radius: 10rpx;
  padding: 5rpx;
}

.repo-details {
  flex: 1;
}

.repo-name {
  font-size: 28rpx;
  color: #333;
  margin-bottom: 5rpx;
  display: block;
}

.repo-desc {
  font-size: 24rpx;
  color: #999;
}

.create-repo {
    display: flex;
    align-items: center;
    padding: 20rpx 0;
    border-top: 3px solid transparent;
    border-image: linear-gradient(to bottom, rgba(0, 0, 0, 0.03), rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0.03)) 1;
  }

.create-repo-text {
  font-size: 28rpx;
  color: #131313;
  margin-left: 10rpx;
}

/* 聊天弹窗样式 */
.chat-scroll-view {
  height: 100%;
}
::v-deep .more-popup .u-popup__content {
  background-color: transparent;
}
::v-deep .u-tabs__wrapper__nav__item__text {
  font-size: 26rpx;
}

/* 底部聊天栏 */
.chatbar {
  position: fixed;
  bottom: 0rpx;
  left: 0;
  right: 0;
  display: flex;
  padding: 10px 14px;
  border-radius: 15px;
  margin: 2.5vw;
  margin-top: 20rpx;
  background: #ddd;
  z-index: 999; 
  box-sizing: border-box;
  gap: 10px;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
}

.chatbar::before {
  content: '';
  position: absolute;
  bottom: -200rpx;
  left: -200rpx;
  right: -200rpx;
  height: 200rpx;
  background: #ffffff;
  z-index: -1;
}
.fake-input {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 14px;
  box-sizing: border-box;
}
.fake-input-text {
  color: #999;
  font-size: 14px;
  text-align: center;
}

.note-detail-live-chat {
  border-top-left-radius: 16rpx;
  border-top-right-radius: 16rpx;
  overflow: hidden;
}

/* 底部占位元素 */
.bottom-spacer {
  height: 100px;
  width: 100%;
}
</style>
