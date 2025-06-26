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
      <!-- ✅ 顶部返回按钮 -->
      <view class="chat-header">
        <u-icon name="arrow-left" size="24" @click="closePopup" />
      </view>

      <!-- 聊天区域 -->
      <view class="chat-body">
        聊天界面
      </view>
    </view>
  </u-popup>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue'

const props = defineProps({
  show: Boolean,
  tab: Number
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
.panel-wrapper {
  width: 96vw;
  height: 100vh;
  background: #fff;
  display: flex;
  flex-direction: column;
  padding: 4vh 3vw 1vh 3vw;
}

/* 顶部返回按钮 */
.chat-header {
  height: 40px;
  display: flex;
  align-items: center;
}

/* 聊天内容区域占满剩余空间 */
.chat-body {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
