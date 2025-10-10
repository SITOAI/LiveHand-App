<template>
  <view class="note-detail-sum-tab">
    
    <!-- 内容区域 -->
    <view class="content-wrapper">
      <!-- 使用从路由传递的summary参数 -->
      <view v-if="summary" class="summary-content">
        <rich-text :nodes="processedSummary"></rich-text>
      </view>
      
      <!-- 当summary为空时显示默认内容 -->
      <view v-else class="default-content">
        <!-- 图片整体信息 -->
        <view class="section">
          <text class="section-title">图片整体信息</text>
          <text class="paragraph">截图显示时间为11:23，手机状态栏显示信号、WiFi连接正常，电量剩余41%。</text>
          <view class="bullet-point">
            <text class="bullet">·</text>
            <text class="bullet-content">顶部有红色与黄色渐变标题文字 "只会系统出装"，其右侧有白色放大镜图标(搜索功能)。</text>
          </view>
        </view>
        
        <!-- 屏幕内容详情 -->
        <view class="section">
          <text class="section-title">屏幕内容详情</text>
          <view class="bullet-point">
            <text class="bullet">·</text>
            <text class="bullet-content">热门搜索推荐:页面中部显示 "大家都在搜王者出装教学知识"，右侧有分享和关闭按钮。</text>
          </view>
          <text class="paragraph">评论区数据:该内容累计获得4.0万条评论，互动量较高。</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { defineProps, defineEmits, computed } from 'vue'

const props = defineProps({
  show: Boolean,
  tab: Number,
  summary: {
    type: String,
    default: ''
  }
})
const emit = defineEmits(['update:show'])

// 简单的markdown解析函数
function parseMarkdown(text) {
  if (!text) return ''
  
  // 将文本处理为markdown格式
  let mdText = text
  
  // 处理标题
  mdText = mdText.replace(/^# (.*$)/gm, '<h1 style="margin: 16px 0;">$1</h1>')
  mdText = mdText.replace(/^## (.*$)/gm, '<h2 style="margin: 14px 0;">$1</h2>')
  mdText = mdText.replace(/^### (.*$)/gm, '<h3 style="margin: 12px 0;">$1</h3>')

  
  // 处理粗体
  mdText = mdText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
  mdText = mdText.replace(/\*(.*?)\*/g, '<em>$1</em>')
  
  // 首先处理所有图片链接，确保在任何URL处理之前
  // 1. 处理 ![]() 格式（标准Markdown图片链接）
  mdText = mdText.replace(/!\[.*?\]\(\s*[`]?([^\s"'<>"]*(?:\.(jpg|jpeg|png|gif|svg|webp)|wx_fmt=\w+)[^"'<>")\s]*?)[`]?\s*\)/gi, '<div style="margin: 12px 0;"><img src="$1" style="max-width: 100%; height: auto; border-radius: 8px;"></div>')
  
  // 2. 处理 !url 格式（简化版图片链接）
  mdText = mdText.replace(/!\s*[`]?([^\s"'<>"]*(?:\.(jpg|jpeg|png|gif|svg|webp)|wx_fmt=\w+)[^"'<>")\s]*?)[`]?/gi, '<div style="margin: 12px 0;"><img src="$1" style="max-width: 100%; height: auto; border-radius: 8px;"></div>')
  
  // 处理普通链接 [链接文本](链接URL)
  mdText = mdText.replace(/\[(.*?)\]\((https?:\/\/[^\s"'<>"]+)\)/g, '<a href="$2" class="markdown-link" target="_blank">$1</a>')
  
  // 处理纯URL链接 http:// 或 https://，只处理非图片链接
  // 确保不会覆盖已经处理成图片的链接
  mdText = mdText.replace(/(^|[^!`])(https?:\/\/[^\s"'<>"]+)/g, function(match, prefix, url) {
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
  // mdText = mdText.replace(/^(?!<h[1-3]>)(?!<div)(?!•)(.*$)/gm, '<p style="margin: 8px 0; line-height: 1.6; font-size: 27rpx;">$1</p>')
  mdText = mdText.replace(/^(?!<h[1-3]>)(?!<div)(?!•)(.*$)/gm, '<p style="margin: 8px 0; line-height: 1.6;">$1</p>')
  
  // 处理换行
  mdText = mdText.replace(/\n/g, '')
  
  return mdText
}

// 计算属性：处理summary数据为markdown格式
const processedSummary = computed(() => {
  if (!props.summary) return ''
  return parseMarkdown(props.summary)
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
.note-detail-sum-tab {
  margin-top: 40rpx;
  background: #fff;
  min-height: 100vh;
  position: relative;
  padding: 0 16px;
  box-sizing: border-box;
}

/* 顶部Tab切换 */
.tab-header {
  display: flex;
  border-bottom: 1px solid #f0f0f0;
  padding: 10px 0;
  margin-bottom: 20px;
}

.tab-item {
  font-size: 16px;
  font-weight: 500;
  color: #606266;
  margin-right: 30px;
  padding-bottom: 8px;
}

.tab-item.active {
  color: #000;
  font-weight: bold;
  border-bottom: 2px solid #000;
}

/* 内容区域 */
.content-wrapper {
  padding-bottom: 20px;
}

.section {
  margin-bottom: 20px;
}

.section-title {
  font-size: 16px;
  font-weight: bold;
  color: #000;
  margin-bottom: 12px;
  display: block;
}

.paragraph {
  font-size: 27rpx;
  color: #333;
  line-height: 1.6;
  margin-bottom: 12px;
  display: block;
}

/* 项目符号列表 */
.bullet-point {
  display: flex;
  align-items: flex-start;
  margin-bottom: 12px;
  line-height: 1.6;
}

.bullet {
  font-size: 27rpx;
  color: #333;
  margin-right: 6px;
  margin-top: 2px;
  flex-shrink: 0;
}

.bullet-content {
  font-size: 27rpx;
  color: #333;
  flex: 1;
}

/* 评论项 */
.comment-item {
  margin-bottom: 12px;
}

.comment-author {
  font-size: 27rpx;
  color: #333;
  display: block;
  margin-bottom: 6px;
}

.comment-content {
  font-size: 27rpx;
  color: #333;
  display: block;
  padding-left: 16px;
}

/* Markdown链接样式 */
.markdown-link {
  color: #0066cc;
  text-decoration: underline;
}


</style>
