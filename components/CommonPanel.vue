<template>
  <u-popup 
    :close-on-click-overlay="false"
    :show="show"
    mode="left"
    :overlay="true"
    :closeable="false"
    :safe-area-inset-left="true"
    @close="closePanel"
    @update:show="val => emit('update:show', val)"
  >
    <view class="panel-wrapper" @touchstart="onTouchStart" @touchend="onTouchEnd">

      <!-- 顶部栏 -->
      <view class="panel-header">
        <text class="header-title">通用</text>
        <u-icon name="close-circle" size="28" @click="closePanel" />
      </view>

      <!-- 内容区域 -->
      <scroll-view scroll-y class="common-wrapper">

        <Member v-if="isMember" />
        <UnMember v-else />

        <!-- 快捷操作 -->
        <view class="section">
          <view class="section-title">快捷操作</view>
          <view class="section-body">
            <view @click="openWidgetManager"><MenuItem title="小组件" icon="attach" /></view>
            <view @click="openImportNotes"><MenuItem title="导入笔记" icon="plus-circle" /></view>
            <view @click="openSync"><MenuItem title="同步 LiveKnowledge" icon="reload" /></view>
          </view>
        </view>

        <!-- 个性化设置 -->
<!--        <view class="section">
          <view class="section-title">个性化设置</view>
          <view class="section-body">
            <view @click="openHistoryLog"><MenuItem title="历史记录" icon="clock" :isOk="true" /></view>
            <view @click="openTags"><MenuItem title="预设标签" icon="tags" :isOk="true" /></view>
            <view @click="openFileManager"><MenuItem title="文件管理器" icon="folder" :isOk="true" /></view>
          </view>
        </view> -->

        <!-- 需要你的帮助 -->
        <view class="section">
          <view class="section-title">需要你的帮助</view>
          <view class="section-body">
            <view @click="openRate"><MenuItem title="去应用商城给个好评" icon="star" /></view>
            <view @click="openShare"><MenuItem title="分享 LiveHands 给好友" icon="share" :isOk="true" /></view>
            <view @click="openFollowWechat"><MenuItem title="关注官方公众号" icon="weixin-fill" :isOk="true" /></view>
            <view @click="openFollowRedBook"><MenuItem title="关注官方小红书" icon="heart" :isOk="true" /></view>
            <view @click="openFeedback"><MenuItem title="吐槽专用" icon="chat" :isOk="true" /></view>
          </view>
        </view>

        <!-- 版本信息 -->
        <view class="section">
          <view class="section-title">版本信息</view>
          <view class="section-body">
            <view @click="openUpdate"><MenuItem title="版本更新" icon="checkmark-circle" :isOk="true" /></view>
            <view @click="openIntro"><MenuItem title="版本介绍" icon="info-circle" :isOk="true" /></view>
          </view>
        </view>

        <!-- 帮助中心 -->
        <view class="section">
          <view class="section-title">帮助中心</view>
          <view class="section-body">
            <view @click="openDocs"><MenuItem title="使用文档" icon="file-text" :isOk="true" /></view>
            <view @click="openAbout"><MenuItem title="关于我们" icon="integral" :isOk="true" /></view>
          </view>
        </view>

        <!-- 退出登录 -->
        <view class="logout-wrapper">
          <u-button
            type="error"
            shape="circle"
            size="medium"
            text="退出登录"
            @click="logout"
          />
        </view>

        <view class="somthing-info">
          <text>西安视途科技有限公司 AI 技术支撑</text>
        </view>
		
		<!-- Panel -->
		<WidgetManagerPanel v-model:show="showWidgetManagerPanel" />
		<ImportNotesPanel v-model:show="showImportNotesPanel" />
		<SyncPanel v-model:show="showSyncPanel" />
<!-- 		<HistoryLogPanel v-model:show="showHistoryLogPanel" />
		<TagsPanel v-model:show="showTagsPanel" />
		<FileManagerPanel v-model:show="showFileManagerPanel" /> -->
		<RatePanel v-model:show="showRatePanel" />		
		<SharePanel v-model:show="showSharePanel" />		
		<FollowWeChatPanel v-model:show="showFollowWeChatPanel" />
		<FollowRedBookPanel v-model:show="showFollowRedBookPanel" />
		<FeedbackPanel v-model:show="showFeedbackPanel" />
		<UpdatePanel v-model:show="showUpdatePanel" />
		<IntroPanel v-model:show="showIntroPanel" />
		<DocsPanel v-model:show="showDocsPanel" />
		<AboutPanel v-model:show="showAboutPanel" />



      </scroll-view>
    </view>
  </u-popup>
</template>

<script setup>
import { ref } from 'vue'
import Member from './children/Member.vue'
import UnMember from './children/UnMember.vue'
import MenuItem from './children/MenuItem.vue'
import { useUserStore } from '../store/user.js'

import WidgetManagerPanel from '../pages/static/WidgetManager.vue'
import ImportNotesPanel from '../pages/static/ImportNotes.vue'
import SyncPanel from '../pages/static/Sync.vue'
// import HistoryLogPanel from '../pages/static/HistoryLog.vue'
// import TagsPanel from '../pages/static/Tags.vue'
// import FileManagerPanel from '../pages/static/FileManager.vue'
import RatePanel from '../pages/static/Rate.vue'
import SharePanel from '../pages/static/Share.vue'
import FollowWeChatPanel from '../pages/static/FollowWeChat.vue'
import FollowRedBookPanel from '../pages/static/FollowRedBook.vue'
import FeedbackPanel from '../pages/static/Feedback.vue'
import UpdatePanel from '../pages/static/Update.vue'
import IntroPanel from '../pages/static/Intro.vue'
import DocsPanel from '../pages/static/Docs.vue'
import AboutPanel from '../pages/static/About.vue'

const props = defineProps({ show: Boolean })
const emit = defineEmits(['update:show'])

const showWidgetManagerPanel = ref(false)
const showImportNotesPanel = ref(false)
const showSyncPanel = ref(false)
// const showHistoryLogPanel = ref(false)
// const showTagsPanel = ref(false)
// const showFileManagerPanel = ref(false)
const showRatePanel = ref(false)
const showSharePanel = ref(false)
const showFollowWeChatPanel = ref(false)
const showFollowRedBookPanel = ref(false)
const showFeedbackPanel = ref(false)
const showUpdatePanel = ref(false)
const showIntroPanel = ref(false)
const showDocsPanel = ref(false)
const showAboutPanel = ref(false)


const isMember = ref(false)
const userStore = useUserStore()

function closePanel() {
  emit('update:show', false)
}

function logout() {
  userStore.logout()
  emit('update:show', false)
  setTimeout(() => {
    // 使用 uni-app 的页面跳转 API，注意路径要符合 pages.json 配置
    uni.reLaunch({ url: '/pages/layout' }); 
  }, 300)
}

// 手势关闭
let startX = 0, startY = 0
function onTouchStart(e) {
  startX = e.touches[0].clientX
  startY = e.touches[0].clientY
}
function onTouchEnd(e) {
  const deltaX = e.changedTouches[0].clientX - startX
  const deltaY = Math.abs(e.changedTouches[0].clientY - startY)
  if (deltaX < -60 && deltaY < 30) closePanel()
}


function openWidgetManager() {
	showWidgetManagerPanel.value = false
}
function openImportNotes() {
	showImportNotesPanel.value = false
}
function openSync() {
	showSyncPanel.value = false
}
// function openHistoryLog() {
// 	showHistoryLogPanel.value = true
// }
// function openTags() {
// 	showTagsPanel.value = true
// }
// function openFileManager() {
// 	showFileManagerPanel.value = true
// }
function openRate() {
	showRatePanel.value = false
}
function openShare() {
	showSharePanel.value = true
}
function openFollowWechat() {
	console.log('打开关注官方公众号弹窗')
	showFollowWeChatPanel.value = true
	console.log('打开关注官方公众号弹窗1')
}
function openFollowRedBook() {
	showFollowRedBookPanel.value = true
}
function openFeedback() {
	showFeedbackPanel.value = true
}
function openUpdate() {
    showUpdatePanel.value = true
}
function openIntro() {
	showIntroPanel.value = true
}
function openDocs() {
	showDocsPanel.value = true
}
function openAbout() {
	showAboutPanel.value = true
}
</script>

<style scoped>
.panel-wrapper {
  width: 90vw;
  height: 95vh;
  background-color: #ebeff2;
  display: flex;
  flex-direction: column;
  padding: 5vh 5vw 0;
  border-radius: 10px;
}
.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1vh 3vw;
  margin-bottom: 12px;
  border-bottom: 1px solid rgba(204,204,204,0.53);
}
.header-title {
  font-size: 18px;
  font-weight: bold;
  color: #333;
}
.common-wrapper {
  flex: 1;
  overflow-y: scroll;
}
.section {
  margin-top: 16px;
}
.section-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  padding-bottom: 8px;
}
.section-body {
  background-color: #f8f8f8;
  border-radius: 10px;
}
.logout-wrapper {
  margin: 24px 16px;
}
.somthing-info {
  padding-bottom: 2vh;
  font-size: 10px;
  color: #ccc;
  text-align: center;
}
</style>