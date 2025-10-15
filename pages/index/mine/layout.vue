<template>
  <view class="page-container">
    <!-- 固定的个人信息模块 -->
    <view class="user-info-section">
      <Member />
      <!-- <UnMember v-else /> -->
    </view>
    
    <!-- 可滚动的内容区域 -->
    <scroll-view scroll-y class="content-wrapper">
      <!-- 快捷操作 -->
      <view class="section">
        <view class="section-title">快捷操作</view>
        <view class="section-body">
          <view @click="openWidget"><MenuItem title="小组件" icon="attach" /></view>
          <view @click="openImport"><MenuItem title="导入笔记" icon="plus-circle" /></view>
          <view @click="openSynchronize"><MenuItem title="同步 LiveKnowledge" icon="reload" /></view>
        </view>
      </view>

      <!-- 个性化设置 -->
      <view class="section">
        <view class="section-title">个性化设置</view>
        <view class="section-body">
          <view @click="openHistory"><MenuItem title="历史记录" icon="clock" :isOk="true" /></view>
          <view @click="openTags"><MenuItem title="预设标签" icon="tags" :isOk="true" /></view>
          <view @click="openFiles"><MenuItem title="文件管理器" icon="folder" /></view>
        </view>
      </view>

      <!-- 需要你的帮助 -->
      <view class="section">
        <view class="section-title">需要你的帮助</view>
        <view class="section-body">
          <view @click="openRate"><MenuItem title="去应用商城给个好评" icon="star" /></view>
          <view @click="openShare"><MenuItem title="分享 LiveHands 给好友" icon="share" :isOk="true" /></view>
          <view @click="openWechat"><MenuItem title="关注官方公众号" icon="weixin-fill" :isOk="true" /></view>
          <view @click="openRedbook"><MenuItem title="关注官方小红书" icon="heart" :isOk="true" /></view>
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

      <!-- Panel -->
      <FollowWeChatPanel v-model:show="showFollowWeChatPanel" />
      <FollowRedBookPanel v-model:show="showFollowRedBookPanel" />
      <AboutPanel v-model:show="showAboutPanel" />

      <!-- 退出登录 -->
      <view class="logout-wrapper">
        <u-button
          type="primary"
          shape="circle"
          size="medium"
          text="退出登录"
          @click="logout"
        />
      </view>

      <view class="somthing-info">
        <text>西安视途科技有限公司 AI 技术支撑</text>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import Member from '../../../components/children/Member.vue'
import UnMember from '../../../components/children/UnMember.vue'
import MenuItem from '../../../components/children/MenuItem.vue'
import FollowWeChatPanel from '../../../pages/static/FollowWeChat.vue'
import FollowRedBookPanel from '../../../pages/static/FollowRedBook.vue'
import AboutPanel from '../../../pages/static/About.vue'
import { useUserStore } from '../../../store/user.js'

// 响应式数据
const isMember = ref(false)
const userStore = useUserStore()
const showFollowWeChatPanel = ref(false)
const showFollowRedBookPanel = ref(false)
const showAboutPanel = ref(false)

// 页面加载时检查用户状态
onMounted(() => {
  // 这里可以添加用户状态检查逻辑
  // isMember.value = userStore.isMember
  
  // 监听全局事件，当切换tabbar时关闭所有弹窗
  uni.$on('closeAllModals', () => {
    showFollowRedBookPanel.value = false
    showFollowWeChatPanel.value = false
    showAboutPanel.value = false
  })
})

onUnmounted(() => {
  // 移除事件监听，避免内存泄漏
  uni.$off('closeAllModals')
})

function logout() {
  userStore.logout()
  setTimeout(() => {
    uni.reLaunch({ url: '/pages/layout' })
  }, 300)
}

// 页面跳转函数
function openWidget() {
  uni.navigateTo({ url: '/pages/static/WidgetManager' })
}
function openImport() {
  uni.navigateTo({ url: '/pages/static/ImportNotes' })
}
function openSynchronize() {
  uni.navigateTo({ url: '/pages/static/Sync' })
}
function openHistory() {
  uni.navigateTo({ url: '/pages/static/HistoryLog' })
}
function openTags() {
  uni.navigateTo({ url: '/pages/static/Tags' })
}
function openFiles() {
  uni.navigateTo({ url: '/pages/static/FileBrowser' })
}
function openRate() {
  uni.navigateTo({ url: '/pages/static/Rate' })
}
function openShare() {
  uni.navigateTo({ url: '/pages/static/Share' })
}
function openWechat() {
  showFollowWeChatPanel.value = true
}
function openRedbook() {
  showFollowRedBookPanel.value = true
}
function openFeedback() {
  uni.navigateTo({ url: '/pages/static/Feedback' })
}
function openUpdate() {
  uni.navigateTo({ url: '/pages/static/Update' })
}
function openIntro() {
  uni.navigateTo({ url: '/pages/static/Intro' })
}
function openDocs() {
  uni.navigateTo({ url: '/pages/static/Docs' })
}
function openAbout() {
  showAboutPanel.value = true
}
</script>

<style scoped>
.page-container {
  width: 100%;
  height: auto;
  padding-top: 6vh;
  background-color: #ebeff2;
  box-sizing: border-box;
}

.user-info-section {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background-color: #ebeff2;
  padding: 32rpx;
  box-sizing: border-box;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
}

.page-header {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 24rpx 0;
  background-color: #fff;
  box-shadow: 0 4rpx 8rpx rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
}

.content-wrapper {
  flex: 1;
  padding: 32rpx;
  box-sizing: border-box;
  width: 100%;
  margin-top: 0;
}

.section {
  margin-bottom: 30rpx;
  background-color: #fff;
  border-radius: 24rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);
  margin-top: 20rpx;
  width: 100%;
  box-sizing: border-box;
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  padding: 24rpx 32rpx 16rpx;
  box-sizing: border-box;
  width: 100%;
}

.section-body {
  background-color: #fff;
  width: 100%;
  box-sizing: border-box;
}

.logout-wrapper {
  margin: 48rpx 0;
  margin-top: 70rpx;
  padding: 0 32rpx;
}

.somthing-info {
  padding: 40rpx 32rpx;
  font-size: 24rpx;
  color: #999;
  text-align: center;
}
</style>