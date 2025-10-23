<template>
  <u-popup
    :show="show"
    mode="right"
    :overlay="true"
    :closeable="false"
    @close="closePopup"
    @update:show="val => emit('update:show', val)"
    :duration="300"
  >
    <view
      class="panel-wrapper"
      @touchstart="onTouchStart"
      @touchend="onTouchEnd"
    >
      <!-- 顶部标题栏 -->
      <view class="static-header">
        <u-icon name="arrow-left" size="24" @click="closePopup" />
        <view class="header-title">版本介绍</view>
      </view>

      <!-- 主要内容区域 -->
      <scroll-view class="content-scroll" scroll-y>
        <!-- 应用Logo和版本信息 -->
        <view class="app-info-section">
          <view class="app-logo">
            <image src="/static/logo.png" mode="aspectFit" />
          </view>
          <view class="app-name">LiveHands</view>
          <view class="version-info">当前版本: 1.0.0</view>
          <view class="release-date">发布日期: 2024-01-15</view>
        </view>

        <!-- 功能亮点 -->
        <view class="highlights-section">
          <view class="section-title">✨ 功能亮点</view>
          <view class="highlights-grid">
            <view class="highlight-item">
              <u-icon name="edit" size="36" color="#007aff" class="highlight-icon" />
              <view class="highlight-text">智能笔记管理</view>
            </view>
            <view class="highlight-item">
              <u-icon name="chat" size="36" color="#5856d6" class="highlight-icon" />
              <view class="highlight-text">AI 助手对话</view>
            </view>
            <view class="highlight-item">
              <u-icon name="folder" size="36" color="#ff2d55" class="highlight-icon" />
              <view class="highlight-text">文件管理器</view>
            </view>
            <view class="highlight-item">
              <u-icon name="sync" size="36" color="#4cd964" class="highlight-icon" />
              <view class="highlight-text">数据同步备份</view>
            </view>
          </view>
        </view>

        <!-- 更新日志 -->
        <view class="changelog-section">
          <view class="section-title">📋 更新日志</view>
          <view class="changelog-content">
            <view class="changelog-item">
              <view class="changelog-version">v1.0.0</view>
              <view class="changelog-date">2024-01-15</view>
              <view class="changelog-details">
                <view class="changelog-entry">• 全新应用发布，集成笔记和AI助手功能</view>
                <view class="changelog-entry">• 支持多种笔记格式：文本、图片、链接等</view>
                <view class="changelog-entry">• 智能AI对话系统，提供即时帮助</view>
                <view class="changelog-entry">• 文件管理器，轻松组织和查找内容</view>
                <view class="changelog-entry">• 个性化设置，满足不同用户需求</view>
              </view>
            </view>
          </view>
        </view>

        <!-- 核心功能介绍 -->
        <view class="features-section">
          <view class="section-title">🎯 核心功能</view>
          
          <view class="feature-card">
            <view class="feature-header">
              <u-icon name="edit-pen" size="28" color="#007aff" />
              <view class="feature-title">智能笔记</view>
            </view>
            <view class="feature-description">
              创建、编辑和组织各类笔记，支持富文本格式和多媒体内容，让您的想法自由表达。
            </view>
          </view>
          
          <view class="feature-card">
            <view class="feature-header">
              <u-icon name="robot" size="28" color="#5856d6" />
              <view class="feature-title">AI 助手</view>
            </view>
            <view class="feature-description">
              内置智能AI助手，随时随地为您解答问题、提供建议，提高工作和学习效率。
            </view>
          </view>
          
          <view class="feature-card">
            <view class="feature-header">
              <u-icon name="cloud-download" size="28" color="#4cd964" />
              <view class="feature-title">数据同步</view>
            </view>
            <view class="feature-description">
              自动同步您的笔记和数据，多设备无缝切换，确保信息安全且随时可用。
            </view>
          </view>
          
          <view class="feature-card">
            <view class="feature-header">
              <u-icon name="tag" size="28" color="#ff9500" />
              <view class="feature-title">标签管理</view>
            </view>
            <view class="feature-description">
              使用标签轻松分类和查找笔记，自定义标签颜色和名称，让内容管理更加高效。
            </view>
          </view>
        </view>

        <!-- 联系与支持 -->
        <view class="support-section">
          <view class="section-title">📞 联系与支持</view>
          <view class="support-content">
            <view class="support-item">
              <u-icon name="chat" size="24" color="#ff2d55" />
              <view class="support-text">在线客服：工作日 9:00-18:00</view>
            </view>
            <view class="support-item">
              <u-icon name="mail" size="24" color="#007aff" />
              <view class="support-text">邮箱：support@livehands.com</view>
            </view>
          </view>
        </view>

        <!-- 底部信息 -->
        <view class="footer-info">
          <view class="copyright">© 2024 LiveHands. 保留所有权利。</view>
          <view class="company">西安视途科技有限公司</view>
        </view>
      </scroll-view>
    </view>
  </u-popup>
</template>

<script setup>
import { defineProps, defineEmits, ref, onMounted } from 'vue'

const props = defineProps({
  show: Boolean,
  tab: Number
})

const emit = defineEmits(['update:show'])
const currentVersion = ref('1.0.0')

// 页面加载时获取版本信息
onMounted(() => {
  // 这里可以通过API获取最新版本信息
  // 模拟获取版本信息
  setTimeout(() => {
    // 实际项目中可以从服务器获取最新版本号
  }, 500)
})

function closePopup() {
  emit('update:show', false)
}

// 手势滑动关闭逻辑
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

  if (deltaX > 60 && deltaY < 30) {
    closePopup()
  }
}
</script>

<style scoped>
.panel-wrapper {
  width: 96vw;
  height: 100vh;
  background: #f8f9fa;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  overflow: hidden;
}

/* 顶部标题栏 */
.static-header {
  height: 56px;
  display: flex;
  align-items: center;
  padding: 0 20rpx;
  background-color: #fff;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
  position: sticky;
  top: 0;
  z-index: 10;
}

.header-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
  margin-left: 20rpx;
}

/* 滚动内容区域 */
.content-scroll {
  flex: 1;
  padding: 30rpx;
  box-sizing: border-box;
  overflow: auto;
  -webkit-overflow-scrolling: touch;
  scroll-behavior: smooth;
}

/* 应用信息区域 */
.app-info-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40rpx 0;
  background-color: #fff;
  border-radius: 24rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);
}

.app-logo {
  width: 180rpx;
  height: 180rpx;
  border-radius: 36rpx;
  overflow: hidden;
  margin-bottom: 24rpx;
  box-shadow: 0 6rpx 20rpx rgba(0, 0, 0, 0.1);
}

.app-logo image {
  width: 100%;
  height: 100%;
}

.app-name {
  font-size: 40rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 12rpx;
}

.version-info {
  font-size: 32rpx;
  color: #007aff;
  margin-bottom: 8rpx;
}

.release-date {
  font-size: 28rpx;
  color: #999;
}

/* 通用区块样式 */
.highlights-section,
.changelog-section,
.features-section,
.support-section {
  background-color: #fff;
  border-radius: 24rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);
}

.section-title {
  font-size: 34rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 24rpx;
}

/* 功能亮点网格 */
.highlights-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20rpx;
}

.highlight-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24rpx;
  background-color: #f8f9fa;
  border-radius: 16rpx;
  transition: all 0.3s ease;
}

.highlight-item:active {
  transform: scale(0.95);
  background-color: #e9ecef;
}

.highlight-icon {
  margin-bottom: 12rpx;
}

.highlight-text {
  font-size: 28rpx;
  color: #555;
  text-align: center;
}

/* 更新日志样式 */
.changelog-item {
  padding: 20rpx 0;
}

.changelog-version {
  font-size: 32rpx;
  font-weight: bold;
  color: #007aff;
  margin-bottom: 8rpx;
}

.changelog-date {
  font-size: 26rpx;
  color: #999;
  margin-bottom: 16rpx;
}

.changelog-details {
  padding-left: 10rpx;
}

.changelog-entry {
  font-size: 28rpx;
  color: #666;
  margin-bottom: 10rpx;
  line-height: 1.5;
}

/* 核心功能卡片 */
.feature-card {
  background-color: #f8f9fa;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
  transition: all 0.3s ease;
}

.feature-card:active {
  background-color: #e9ecef;
  transform: translateX(10rpx);
}

.feature-header {
  display: flex;
  align-items: center;
  margin-bottom: 12rpx;
}

.feature-title {
  font-size: 30rpx;
  font-weight: 500;
  color: #333;
  margin-left: 12rpx;
}

.feature-description {
  font-size: 28rpx;
  color: #666;
  line-height: 1.6;
  padding-left: 40rpx;
}

/* 支持信息 */
.support-content {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.support-item {
  display: flex;
  align-items: center;
  padding: 16rpx;
  background-color: #f8f9fa;
  border-radius: 12rpx;
}

.support-text {
  font-size: 28rpx;
  color: #666;
  margin-left: 16rpx;
}

/* 底部信息 */
.footer-info {
  text-align: center;
  padding: 30rpx 0;
  color: #999;
}

.copyright {
  font-size: 26rpx;
  margin-bottom: 8rpx;
}

.company {
  font-size: 26rpx;
}

/* 动画效果 */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.highlights-section,
.changelog-section,
.features-section,
.support-section {
  animation: fadeInUp 0.5s ease-out;
}

.highlights-section {
  animation-delay: 0.1s;
}

.changelog-section {
  animation-delay: 0.2s;
}

.features-section {
  animation-delay: 0.3s;
}

.support-section {
  animation-delay: 0.4s;
}
</style>
