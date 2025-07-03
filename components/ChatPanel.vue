<template>
  <u-popup
    :show="show"
    mode="right"
    :overlay="true"
    :closeable="false"
    @close="closePopup"
    @update:show="val => emit('update:show', val)"
    :duration="300"
    :custom-style="{ height: '100vh' }"
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

      <!-- 聊天区域，LiveChat高度100vh减去header高度40px -->
      <LiveChat
        :height="'calc(100vh - 40px)'"
        :showHeader="false"
        :onClose="closePopup"
      />
    </view>
  </u-popup>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue'
import LiveChat from '@/components/chat/LiveChat.vue' // 路径根据你项目调整

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
  width: 100vw;
  height: 100vh;
  background: #fff;
  display: flex;
  flex-direction: column;
  padding: 4vh 3vw 1vh 3vw;
  box-sizing: border-box;
}

/* 顶部返回按钮 */
.chat-header {
  height: 40px;
  display: flex;
  align-items: center;
}

/* 这里不用额外设置chat-body了，因为LiveChat自己撑满高度 */
</style>
