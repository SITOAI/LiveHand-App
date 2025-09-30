<template>
  <view class="note-detail-poster-tab">
    <!-- 内容区域 -->
    <view class="content-wrapper">
      <!-- 使用从路由传递的handmould参数 -->
      <view v-if="handmould" class="handmould-content">
        <text class="paragraph">{{ handmould }}</text>
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
import { defineProps, defineEmits } from 'vue'

const props = defineProps({
  show: Boolean,
  tab: Number,
  handmould: {
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
</style>
