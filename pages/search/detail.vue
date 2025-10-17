<template>
  <view class="search-detail-page">
    <!-- 顶部固定区域：返回按钮、标题和分享图标 -->
   <view class="detail-container">
      <view class="top-fixed-header">
        <view class="top-icon-row">
          <u-icon name="arrow-left" size="24" @click="goBack" />
          <text class="header-title" >探索</text>
          <view class="right-icons">
            <image src="../../static/share.png" class="share-icon" mode="aspectFit" @click="onShare"></image>
          </view>
       </view>
      </view>
      <!-- 根据是否有URL显示不同内容 -->
      <template v-if="hasUrl">
        <web-view :src="url" class="web-view-container" :webview-styles="webviewStyles" :allowFullScreen="false"></web-view>
      </template>
      <template v-else>
          <!-- 只有在没有URL时才显示detail-box模块 -->
        <view  class="detail-box">
          <view class="detail-title">{{ title }}</view>
          <view class="detail-meta">
              <image src="../../static/black_folder.png" class="folder-img" mode="aspectFit"></image>
              <text class="repo-name">{{ repo }}</text>
              <text class="time">{{ time }}</text>
          </view>
        </view>
        <!-- 没有URL时显示正常内容 -->
        <scroll-view scroll-y class="content-scroll">
          <view class="detail-content">
            <rich-text :nodes="content"></rich-text>
          </view>
        </scroll-view>
          <!-- 底部占位元素，确保内容不被聊天栏遮挡 -->
        <view class="bottom-spacer"></view>
        <!-- 底部追问栏 -->
        <view class="chatbar" v-if="!chatPopupVisible">
          <view class="fake-input" @click="chatPopupVisible = true">
            <u-icon name="star" size="22" />
            <text class="fake-input-text">我还想问...</text>
          </view>
        </view>
      </template>
      
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
            :sourcePage="'searchDetail'"
            :noteSummary="content"
            :appId="appId"
            :agentApiKey="agentApiKey"
          />
        </scroll-view>
      </u-popup>
   </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import LiveChat from '../../components/chat/LiveChat.vue'

const title = ref('')
const repo = ref('')
const content = ref('')
const url = ref('')
const hasUrl = ref(false)
const chatPopupVisible = ref(false)
const time = ref('')
const appId = ref('')
const agentApiKey = ref('')

const webviewStyles = ref({ 
  progress: { 
    color: '#07c160' 
  } 
});

// 聊天弹窗样式对象
const chatPopupStyle = {
  height: '95vh',
  borderTopLeftRadius: '20rpx',
  borderTopRightRadius: '20rpx',
  overflow: 'hidden'
}

onLoad((options) => {
  // 从URL参数中获取数据
  if (options) {
    title.value = decodeURIComponent(options.title || '')
    repo.value = decodeURIComponent(options.repo || '')
    url.value = decodeURIComponent(options.url || '')
    time.value = decodeURIComponent(options.time || '')
    appId.value = decodeURIComponent(options.appId || '')
    agentApiKey.value = decodeURIComponent(options.agentApiKey || '')
    
    // 检查是否有URL
    hasUrl.value = !!url.value
    
    if (hasUrl.value && !url.value.match(/^https?:\/\//i)) {
      url.value = `https://${url.value}`
    }
    
    // 获取内容参数，如果有HTML转义的内容则进行处理
    const rawContent = decodeURIComponent(options.desc || '')
    // 将内容转换为富文本格式，保留换行等格式
    content.value = formatContent(rawContent)
  }
})

// 简单的markdown解析函数 - 参照NoteDetailPosterTab.vue
function parseMarkdown(text) {
  if (!text) return ''
  
  // 将文本处理为markdown格式
  let mdText = text
  
  // 处理标题，设置字体大小为36rpx
  mdText = mdText.replace(/^# (.*$)/gm, '<h1 style="margin: 16px 0; font-size: 36rpx;">$1</h1>')
  mdText = mdText.replace(/^## (.*$)/gm, '<h2 style="margin: 14px 0; font-size: 30rpx;">$1</h2>')
  mdText = mdText.replace(/^### (.*$)/gm, '<h3 style="margin: 12px 0; font-size: 24rpx;">$1</h3>')
  
  // 处理粗体
  mdText = mdText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
  mdText = mdText.replace(/\*(.*?)\*/g, '<em>$1</em>')
  
  // 首先处理所有图片链接，确保在任何URL处理之前
  // 1. 处理 ![]() 格式（标准Markdown图片链接）
  mdText = mdText.replace(/!\[.*?\]\(\s*[`]?([^\s"'<>"](?:\.(jpg|jpeg|png|gif|svg|webp)|wx_fmt=\w+)[^"'<>\)"]*)[`]?\s*\)/gi, '<div style="margin: 12px 0;"><img src="$1" style="max-width: 100%; height: auto; border-radius: 8px;"></div>')
  
  // 2. 处理 !url 格式（简化版图片链接）
  mdText = mdText.replace(/!\s*[`]?([^\s"'<>"](?:\.(jpg|jpeg|png|gif|svg|webp)|wx_fmt=\w+)[^"'<>\)"]*)[`]?/gi, '<div style="margin: 12px 0;"><img src="$1" style="max-width: 100%; height: auto; border-radius: 8px;"></div>')
  
  // 处理普通链接 [链接文本](链接URL)
  mdText = mdText.replace(/\[(.*?)\]\((https?:\/\/[^\s"'<>"\)]+)\)/g, '<a href="$2" class="markdown-link" target="_blank">$1</a>')
  
  // 处理纯URL链接 http:// 或 https://，只处理非图片链接
  // 确保不会覆盖已经处理成图片的链接
  mdText = mdText.replace(/(^|[^!`])(https?:\/\/[^\s"'<>"\)]+)/g, function(match, prefix, url) {
    // 检查URL是否是图片链接
    const imageExtensions = /\.(jpg|jpeg|png|gif|svg|webp)$/i;
    const hasImageParam = /[?&](wx_fmt|format)=\w+/i.test(url);
    // 如果URL是图片链接，但没有被之前的处理捕获，则不转换为普通链接
    if (imageExtensions.test(url) || hasImageParam) {
      return prefix + url;
    }
    return prefix + '<a href="' + url + '" class="markdown-link" target="_blank">' + url + '</a>';
  });
  
  // 处理列表
  mdText = mdText.replace(/^- (.*$)/gm, '<div style="display: flex; align-items: flex-start; margin-bottom: 8px;"><span style="margin-right: 8px; margin-top: 4px;">•</span><div>$1</div></div>')
  
  // 处理段落
  mdText = mdText.replace(/^(?!<h[1-3]>)(?!<div)(?!•)(.*$)/gm, '<p style="margin: 8px 0; line-height: 1.6;">$1</p>')
  
  // 处理换行
  mdText = mdText.replace(/\n/g, '')
  
  return mdText
}

// 格式化内容函数
function formatContent(text) {
  // 使用markdown解析函数处理文本
  return parseMarkdown(text)
}

function goBack() {
  uni.navigateBack()
}

function onShare() {
  uni.showToast({ title: '分享功能', icon: 'none' })
}

function handleCloseChat() {
  chatPopupVisible.value = false
  console.log('用户点击了关闭按钮')
}

onMounted(async () => { 
  let height = 0; 
  let statusbar = 0; 
  
  // 使用 async/await 来获取系统信息 
  const sysinfo = await uni.getSystemInfo(); 
  statusbar = sysinfo.statusBarHeight; 
  height = sysinfo.windowHeight; 
  
  // 如果有URL，设置webview样式
  if (hasUrl.value) {
    setTimeout(() => { 
      //获取webview 
      let pages = getCurrentPages(); 
      let page = pages[pages.length - 1]; 
      let currentWebview = page.$getAppWebview(); 
      
      if (currentWebview && currentWebview.children().length > 0) {
        var wv = currentWebview.children()[0]; 
        // 计算webview的top和height，确保不覆盖顶部header
        const headerHeight = 50; 
        
        wv.setStyle({ 
          top: statusbar + headerHeight, // 顶部距离，加上header的高度
          height: height - statusbar - headerHeight, // webview的高度，减去header的高度
          zIndex: 1 // 确保webview在header之下
        })
      }
    }, 300); // 稍微增加延迟确保页面元素已渲染
  }
});
</script>

<style scoped>
.search-detail-page {
  background: #fff;
  box-sizing: border-box;
  position: relative;
  padding: 0 16px;
  box-sizing: border-box;
  min-height: 100vh;
}

/* 顶部图标行 */
.top-icon-row {
  display: flex;
  align-items: center;
  padding: 10px 0;
}

.header-title {
  flex: 1;
  font-size: 36rpx;
  font-weight: 500;
  color: #333;
  margin: 0 20rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 标题居中样式 */
.header-title {
  text-align: center !important;
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

.share-icon {
  width: 40rpx;
  height: 40rpx;
}

/* 详情头部 */

.detail-meta {
  display: flex;
  align-items: center;
  font-size: 24rpx;
  color: #999;
  gap: 10rpx;
  margin-bottom: 20rpx;
  flex-wrap: wrap;
}

.folder-img {
  width: 30rpx;
  height: 30rpx;
}

.repo-name {
  flex: 1;
}

.detail-title {
  font-size: 32rpx;
  color: #333;
  font-weight: bold;
  line-height: 1.4;
  margin: 30rpx 0 15rpx 0;
  white-space: normal;
  word-break: break-all;
}

/* 内容滚动区域 */
.content-scroll {
  max-height: calc(100vh - 180rpx);
  padding-bottom: 20rpx;
  overflow-y: auto;
}

/* web-view容器样式 */
.web-view-container {
  width: 100%;
  /* 初始高度设置，会被JS动态调整 */
  height: calc(100vh - 200rpx);
  margin-top: 100rpx; /* 有URL时只留出header的空间 */
  position: relative;
  z-index: 1; /* 确保webview在header之下 */
}

/* 详情内容 */
.detail-content {
  font-size: 28rpx;
  color: #333;
  line-height: 50rpx;
  padding: 20rpx 0;
}

/* 修改为直接对富文本内容应用样式 */
.detail-content {
  text-indent: 2em;
  margin-bottom: 16rpx;
}

/* 确保所有段落都有缩进 */
.detail-content :deep(p) {
  text-indent: 2em;
  margin-bottom: 16rpx;
}

/* 也添加通用样式作为后备 */
rich-text {
  --text-indent: 2em;
}

rich-text * {
  margin-bottom: 16rpx !important;
}

/* 只对段落添加缩进，不对标题、列表等元素添加 */
rich-text :deep(p) {
  text-indent: 2em;
  margin-bottom: 16rpx;
}

/* Markdown链接样式 */
.rich-text :deep(.markdown-link) {
  color: #0066cc;
  text-decoration: underline;
}

.top-fixed-header {
  position: fixed;
  top: 2vh;
  left: 0;
  right: 0;
  padding: 10px 30rpx;
  background-color: #fff;
  z-index: 999;
}

.detail-box {
  padding-top: 12vh;
  box-sizing: border-box;
}

/* 聊天栏样式 */
.chatbar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 20rpx 30rpx;
  background-color: #fff;
  border-top: 1px solid #f0f0f0;
  z-index: 99;
}

.fake-input {
  display: flex;
  align-items: center;
  padding: 20rpx 30rpx;
  background-color: #f5f5f5;
  border-radius: 40rpx;
  cursor: pointer;
}

.fake-input-text {
  margin-left: 10rpx;
  color: #999;
  font-size: 28rpx;
}

/* 底部占位元素样式 */
.bottom-spacer {
  height: 100rpx;
}

/* 聊天弹窗样式 */
.chat-scroll-view {
  height: 100%;
}

.note-detail-live-chat {
  border-top-left-radius: 16rpx;
  border-top-right-radius: 16rpx;
  overflow: hidden;
}
</style>