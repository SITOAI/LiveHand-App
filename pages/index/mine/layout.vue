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
          <view @click="openHistory"><MenuItem title="历史记录" icon="clock" /></view>
          <view @click="openTags"><MenuItem title="预设标签" icon="tags"  /></view>
          <view @click="openFiles"><MenuItem title="文件管理器" icon="folder" /></view>
        </view>
      </view>

      <!-- 需要你的帮助 -->
      <view class="section">
        <view class="section-title">需要你的帮助</view>
        <view class="section-body">
          <view @click="openRate"><MenuItem title="去应用商城给个好评" icon="star" /></view>
          <view @click="openShare"><MenuItem title="分享 LiveHands 给好友" icon="share"  /></view>
          <view @click="openWechat"><MenuItem title="关注官方公众号" icon="weixin-fill" :isOk="true" /></view>
          <view @click="openRedbook"><MenuItem title="关注官方小红书" icon="heart"  /></view>
          <view @click="openFeedback"><MenuItem title="吐槽专用" icon="chat" /></view>
        </view>
      </view>

      <!-- 版本信息 -->
      <view class="section">
        <view class="section-title">版本信息</view>
        <view class="section-body">
          <view @click="openUpdate"><MenuItem title="版本更新" icon="checkmark-circle" :isOk="true" /></view>
          <!-- <view @click="openIntro"><MenuItem title="版本介绍" icon="info-circle" :isOk="true" /></view> -->
        </view>
      </view>

      <!-- 帮助中心 -->
      <view class="section">
        <view class="section-title">帮助中心</view>
        <view class="section-body">
          <view @click="openDocs"><MenuItem title="使用文档" icon="file-text"  /></view>
          <view @click="openAbout"><MenuItem title="关于我们" icon="integral" :isOk="true" /></view>
          <view @click="confirmAccountDeletion"><MenuItem title="注销账户" icon="trash" :isOk="true" /></view>
        </view>
      </view>

      <!-- Panel -->
      <FollowWeChatPanel v-model:show="showFollowWeChatPanel" />
      <FollowRedBookPanel v-model:show="showFollowRedBookPanel" />
      <AboutPanel v-model:show="showAboutPanel" />
      <UpdatePanel v-model:show="showUpdatePanel" />
      <IntroPanel v-model:show="showIntroPanel" />

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

  
  <!-- 自定义注销账户确认弹框 -->
  <view v-if="showDeleteAccountModal" class="custom-modal-overlay">
    <view class="custom-modal">
      <view class="modal-header">
        <text class="modal-title">注销账户</text>
      </view>
      <view class="modal-content">
        <text class="modal-message">注销账户将删除您的所有数据且不可恢复，确定要继续吗？</text>
      </view>
      <view class="modal-footer">
        <button class="cancel-button" @click="showDeleteAccountModal = false">取消</button>
        <button class="confirm-button" @click="deleteAccount">确定注销</button>
      </view>
    </view>
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
import UpdatePanel from '../../../pages/static/Update.vue'
import IntroPanel from '../../../pages/static/Intro.vue'
import { useUserStore } from '../../../store/user.js'
import http from '../../../utils/http.js'

// 响应式数据
const isMember = ref(false)
const userStore = useUserStore()
const showFollowWeChatPanel = ref(false)
const showFollowRedBookPanel = ref(false)
const showAboutPanel = ref(false)
const showUpdatePanel = ref(false)
const showIntroPanel = ref(false)
const showDeleteAccountModal = ref(false)

// 页面加载时检查用户状态
onMounted(() => {
  // 监听全局事件，当切换tabbar时关闭所有弹窗
  uni.$on('closeAllModals', () => {
    showFollowRedBookPanel.value = false
    showFollowWeChatPanel.value = false
    showAboutPanel.value = false
    showUpdatePanel.value = false
    showIntroPanel.value = false
    showDeleteAccountModal.value = false
  })
})

onUnmounted(() => {
  // 移除事件监听，避免内存泄漏
  uni.$off('closeAllModals')
})

function logout() {
  userStore.logout()
  // 清空所有uni-app存储数据
  uni.clearStorageSync()
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
  // showFollowRedBookPanel.value = true
}
function openFeedback() {
  uni.navigateTo({ url: '/pages/static/Feedback' })
}
function openUpdate() {
  showUpdatePanel.value = true
}
function openIntro() {
  // 显示版本介绍面板
  showIntroPanel.value = true
}
function openDocs() {
  uni.navigateTo({ url: '/pages/static/Docs' })
}
function openAbout() {
  showAboutPanel.value = true
}

// 注销账户功能
function confirmAccountDeletion() {
  // 显示自定义确认弹框
  showDeleteAccountModal.value = true
}

async function deleteAccount() {
  // 隐藏确认弹框
  showDeleteAccountModal.value = false
  
  // 显示加载提示
  uni.showLoading({
    title: '正在处理...',
    mask: true
  })
  
  try {
    const userInfo = uni.getStorageSync('userInfo') || {};
    console.log("🚀 ~ deleteAccount ~ userInfo:", userInfo)
    const nickName = userInfo.nickName || ''
    console.log("🚀 ~ deleteAccount ~ nickName:", nickName)
    const knowledge_user_id = userInfo.knowledge_user_id || ''
    console.log("🚀 ~ deleteAccount ~ knowledge_user_id:", knowledge_user_id)
    
    // 调用注销账户接口
    const res = await http.post('/user/logout', {
      name: nickName,
      knowledge_user_id: knowledge_user_id
    })
    console.log("🚀 ~ deleteAccount ~ res:", res)
    
    // 隐藏加载提示
    uni.hideLoading()
    
    // 判断注销是否成功
    if (res.data && res.data.isSuccess === 1) {
      // 清除用户数据
      userStore.logout()
      // 清除所有可能的用户相关数据
      try {
        uni.clearStorageSync()
      } catch (e) {
        console.error('清除存储数据失败:', e)
      }
      
      // 显示注销成功提示
      uni.showToast({
        title: '账户已注销',
        icon: 'success',
        duration: 2000,
        success: () => {
          // 延迟跳转到登录页
          setTimeout(() => {
            uni.reLaunch({ url: '/pages/login/login' })
          }, 2000)
        }
      })
    } else {
      // 注销失败
      uni.showToast({
        title: res.data?.message || '注销失败，请重试',
        icon: 'none',
        duration: 2000
      })
    }
  } catch (error) {
    // 隐藏加载提示
    uni.hideLoading()
    
    // 显示错误提示
    uni.showToast({
      title: error.message || '注销失败，请重试',
      icon: 'none',
      duration: 2000
    })
    
    console.error('注销账户失败:', error)
  }
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
  padding-top: calc(70rpx + env(safe-area-inset-top, 0px));
  box-sizing: border-box;
  z-index: 100;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
  margin-top: 0;
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
  padding-top: 12vh;
  position: relative;
  background-color: #ebeff2;
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

/* 自定义弹框样式 */
.custom-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.custom-modal {
  background-color: #fff;
  border-radius: 24rpx;
  width: 80%;
  max-width: 600rpx;
  overflow: hidden;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.15);
}

.modal-header {
  padding: 32rpx;
  text-align: center;
  border-bottom: 2rpx solid #f0f0f0;
}

.modal-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
}

.modal-content {
  padding: 40rpx 32rpx;
  text-align: center;
}

.modal-message {
  font-size: 32rpx;
  color: #666;
  line-height: 1.6;
}

.modal-footer {
  display: flex;
}

.cancel-button,
.confirm-button {
  height: 80rpx;
  width: 30rpx;
  flex: 1;
  font-size: 32rpx;
  border: none;
  margin-bottom: 40rpx;
  margin-right: 20rpx;
  margin-left: 20rpx;
  outline: none;
  box-sizing: border-box;
}

.cancel-button {
  color: #666;
  margin-right: 10rpx;
}

.confirm-button {
  color: #f56c6c;
  font-weight: 500;
  background-color:#fff;
  border: 1rpx solid #ddd;
}

.cancel-button:active,
.confirm-button:active {
  background-color: #f8f8f8;
}
::v-deep uni-button:after {
  border: none;
}
</style>