<template>
  <view class="note-detail-sum-tab">
    
    <!-- 内容区域 -->
    <view class="content-wrapper">
      <!-- 使用从路由传递的summary参数 -->
      <view v-if="summary" class="summary-content">
        <text class="paragraph">{{ summary }}</text>
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
import { defineProps, defineEmits } from 'vue'

const props = defineProps({
  show: Boolean,
  tab: Number,
  summary: {
    type: String,
    default: ''
  }
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
  flex: 1;
}

/* 评论项 */
.comment-item {
  margin-bottom: 12px;
}

.comment-author {
  font-size: 14px;
  color: #333;
  display: block;
  margin-bottom: 6px;
}

.comment-content {
  font-size: 14px;
  color: #333;
  display: block;
  padding-left: 16px;
}


</style>
