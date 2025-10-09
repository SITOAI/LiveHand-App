<template>
  <view class="note-detail-poster-tab">
    <!-- 内容区域 -->
    <view class="content-wrapper">
      <!-- 使用从路由传递的handmould参数 -->
      <view v-if="handmould" class="handmould-content">
        <rich-text :nodes="processedHandmould"></rich-text>
      </view>
      
      <!-- 当handmould为空时显示默认内容 -->
      <view v-else class="default-content">
        <view class="section">
          <text class="section-title">手抄内容</text>
          <text class="paragraph">当前没有可用的手抄内容。</text>
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
  handmould: {
    type: String,
    default: ''
  }
})

// 简单的markdown解析函数
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
  mdText = mdText.replace(/^(?!<h[1-3]>)(?!<div)(?!•)(.*$)/gm, '<p style="margin: 8px 0; line-height: 1.6;">$1</p>')
  
  // 处理换行
  mdText = mdText.replace(/\n/g, '')
  
  return mdText
}

// 计算属性：处理handmould数据为markdown格式
const processedHandmould = computed(() => {
  if (!props.handmould) return ''
  return parseMarkdown(props.handmould)
})
const emit = defineEmits(['update:show'])

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
.note-detail-poster-tab {
  margin-top: 40rpx;
  background: #fff;
  min-height: 100vh;
  position: relative;
  padding: 0 16px;
  box-sizing: border-box;
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
  font-size: 14px;
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
  font-size: 14px;
  color: #333;
  margin-right: 6px;
  margin-top: 2px;
  flex-shrink: 0;
}

.bullet-content {
  font-size: 14px;
  color: #333;
  line-height: 1.6;
}

/* Markdown链接样式 */
.markdown-link {
  color: #0066cc;
  text-decoration: underline;
}
</style>
